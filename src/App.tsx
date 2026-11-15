import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { Feed } from './components/Feed';
import { FundingHub } from './components/FundingHub';
import { AiMentor } from './components/AiMentor';
import { MessagingCenter } from './components/MessagingCenter';
import { CallModal } from './components/CallModal';
import { CommunitiesView } from './components/CommunitiesView';
import { OpportunitiesView } from './components/OpportunitiesView';
import { LearningHubView } from './components/LearningHubView';
import { EventsView } from './components/EventsView';
import { ShareModal, ShareItem } from './components/ShareModal';
import { CreatePostModal } from './components/CreatePostModal';
import { RaiseFundsModal } from './components/RaiseFundsModal';
import { ProfileModal } from './components/ProfileModal';
import { ProfileView } from './components/ProfileView';
import { EditProfileView } from './components/EditProfileView';
import { GoogleAuthScreen } from './components/GoogleAuthScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ModeratorDashboard, MODERATOR_EMAIL } from './components/ModeratorDashboard';
import { auth, firebaseSignOut, db as firestoreDb, doc, setDoc, setInMemorySheetsToken } from './firebase';
import { Post, FundingRequest, Message, User, NotificationItem } from './types';
import { Home, Compass, User as UserIcon, DollarSign, MessageSquare, PlusCircle, Flame, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeFilter, setActiveFilter] = useState<string>('For You');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // AUTH STATE: Real Multi-User Session
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [fundings, setFundings] = useState<FundingRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Real-time WebSocket & Chat States
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [chatError, setChatError] = useState<string | null>(null);
  const [selectedChatPartner, setSelectedChatPartner] = useState<string | undefined>(undefined);
  const [liveToast, setLiveToast] = useState<{ title: string; body: string; targetTab?: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const activeTabRef = useRef<string>(activeTab);
  activeTabRef.current = activeTab;

  // Modals
  const [shareItem, setShareItem] = useState<ShareItem | null>(null);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [createPostType, setCreatePostType] = useState('post');
  const [raiseFundsModalOpen, setRaiseFundsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStartupFilter, setSelectedStartupFilter] = useState('');

  // Call modal
  const [activeCall, setActiveCall] = useState<{
    partnerName: string;
    partnerAvatar: string;
    type: 'voice' | 'video';
  } | null>(null);

  // Sync dark class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  // Initial Session Check on Page Load
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const token = localStorage.getItem('cook_auth_token');
    if (!token) {
      setUser(null);
      setAuthChecked(true);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem('cook_auth_token');
        setUser(null);
      }
    } catch (err) {
      console.warn('Session verification fallback:', err);
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  // Fetch application data when authenticated user is present and onboarding completed
  useEffect(() => {
    if (user && user.onboardingCompleted) {
      fetchPosts();
      fetchFundings();
      fetchMessages();
      fetchNotifications();
    }
  }, [user?.id, user?.onboardingCompleted, activeFilter]);

  // Real-time WebSocket Connection (Chat, Presence, Typing, Read Receipts, Notifications, Video Metrics)
  useEffect(() => {
    if (!user || !user.onboardingCompleted) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsConnected(false);
      setOnlineUserIds([]);
      return;
    }

    let isDisposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retryAttempt = 0;
    let hasConnectedOnce = false;

    const connectWs = () => {
      if (isDisposed) return;
      const token = localStorage.getItem('cook_auth_token');
      if (!token) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        hasConnectedOnce = true;
        retryAttempt = 0;
        setWsConnected(true);
        fetchMessages();
        fetchNotifications();
      };

      socket.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data);
          const { event, payload } = parsed || {};

          if (event === 'presence:update') {
            if (Array.isArray(payload?.onlineUserIds)) {
              setOnlineUserIds(payload.onlineUserIds);
            }
          } else if (event === 'chat:message') {
            const incomingMsg: Message | undefined = payload?.message;
            const clientTempId: string | undefined = payload?.clientTempId;
            if (!incomingMsg) return;

            setMessages((prev) => {
              if (prev.some((m) => m.id === incomingMsg.id)) return prev;
              if (clientTempId && prev.some((m) => m.id === clientTempId)) {
                return prev.map((m) => (m.id === clientTempId ? incomingMsg : m));
              }
              return [...prev, incomingMsg];
            });

            if (!incomingMsg.isMe && activeTabRef.current !== 'messages') {
              setLiveToast({
                title: `New message from ${incomingMsg.senderName}`,
                body: incomingMsg.content,
                targetTab: 'messages',
              });
            }
          } else if (event === 'chat:typing') {
            const { conversationId, isTyping } = payload || {};
            if (conversationId) {
              setTypingUsers((prev) => ({ ...prev, [conversationId]: Boolean(isTyping) }));
            }
          } else if (event === 'chat:read') {
            const { conversationId, readAt } = payload || {};
            if (conversationId) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.conversationId === conversationId && m.isMe && !m.read
                    ? { ...m, read: true, readAt }
                    : m
                )
              );
            }
          } else if (event === 'chat:error') {
            const { clientTempId, error } = payload || {};
            if (clientTempId) {
              setMessages((prev) => prev.filter((m) => m.id !== clientTempId));
            }
            if (error) setChatError(error);
          } else if (event === 'notification:new') {
            const notif: NotificationItem | undefined = payload?.notification;
            if (notif) {
              setNotifications((prev) => {
                if (prev.some((n) => n.id === notif.id)) return prev;
                return [notif, ...prev];
              });
            }
          } else if (event === 'post:engagement') {
            const { postId, ...metrics } = payload || {};
            if (postId) {
              setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, ...metrics } : p))
              );
            }
          }
        } catch {
          // ignore invalid frames
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        if (!isDisposed && (hasConnectedOnce || retryAttempt < 2)) {
          const delay = Math.min(8000, 1000 * Math.pow(1.6, retryAttempt++));
          reconnectTimer = setTimeout(connectWs, delay);
        }
      };
    };

    connectWs();

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsConnected(false);
    };
  }, [user?.id, user?.onboardingCompleted]);

  // Auto-dismiss live toast banner after 4.5s
  useEffect(() => {
    if (!liveToast) return;
    const t = setTimeout(() => setLiveToast(null), 4500);
    return () => clearTimeout(t);
  }, [liveToast]);

  const handleAuthSuccess = (data: {
    user: any;
    token: string;
    onboardingCompleted: boolean;
    onboardingStep: number;
  }) => {
    setUser(data.user);
  };

  const handleOnboardingComplete = (completedUser: User) => {
    setUser(completedUser);
    setActiveTab('home');
    setIsEditingProfile(false);
  };

  const handleSignOut = async () => {
    setInMemorySheetsToken(null);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    const token = localStorage.getItem('cook_auth_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('cook_auth_token');
    setUser(null);
    setMessages([]);
    setNotifications([]);
    setOnlineUserIds([]);
    setActiveTab('home');
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async (updated: Partial<User>) => {
    if (!user) throw new Error('Not logged in');
    const token = localStorage.getItem('cook_auth_token');
    if (!token) throw new Error('Authentication session token missing. Please sign in again.');

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updated),
    });

    const data = await res.json();
    if (!res.ok || !data.success || !data.user) {
      throw new Error(data.error || 'Failed to save profile changes');
    }

    setUser(data.user);

    try {
      if (user.id) {
        await setDoc(
          doc(firestoreDb, 'users', user.id),
          {
            ...data.user,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }
    } catch (fbErr) {
      console.warn('Firestore profile sync note:', fbErr);
    }

    return data.user;
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/posts?filter=${encodeURIComponent(activeFilter)}`);
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch (err) {
      console.warn('Fallback: could not fetch posts from API', err);
    }
  };

  const fetchFundings = async () => {
    try {
      const res = await fetch('/api/fundings');
      const data = await res.json();
      if (data.fundings) setFundings(data.fundings);
    } catch (err) {
      console.warn('Fallback: could not fetch fundings from API', err);
    }
  };

  const fetchMessages = async () => {
    const token = localStorage.getItem('cook_auth_token');
    if (!token) return;
    try {
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) {
      console.warn('Fallback: could not fetch messages', err);
    }
  };

  const [serverStats, setServerStats] = useState<any>(null);
  const [allUsersCount, setAllUsersCount] = useState<number>(0);

  const fetchServerStats = async () => {
    try {
      const res = await fetch('/api/server/stats');
      const data = await res.json();
      if (data && data.online) {
        setServerStats(data);
        if (data.totalUsers) setAllUsersCount(data.totalUsers);
      }
    } catch {
      // server still starting or offline
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('cook_auth_token');
    try {
      const res = await fetch('/api/notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.warn('Fallback: could not fetch notifications', err);
    }
  };

  // Light periodic sync for server stats + fallback notification refresh
  useEffect(() => {
    fetchServerStats();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchServerStats();
      if (user) {
        fetchNotifications();
        if (!wsConnected && activeTab === 'messages') {
          fetchMessages();
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user?.id, activeTab, wsConnected]);

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const token = localStorage.getItem('cook_auth_token');
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const token = localStorage.getItem('cook_auth_token');
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearNotifications = async () => {
    setNotifications([]);
    const token = localStorage.getItem('cook_auth_token');
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Post Actions
  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const liked = !p.likedByMe;
          return {
            ...p,
            likedByMe: liked,
            likes: Math.max(0, p.likes + (liked ? 1 : -1)),
          };
        }
        return p;
      })
    );
    const token = localStorage.getItem('cook_auth_token');
    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const saved = !p.savedByMe;
          return {
            ...p,
            savedByMe: saved,
            saves: Math.max(0, p.saves + (saved ? 1 : -1)),
          };
        }
        return p;
      })
    );
    const token = localStorage.getItem('cook_auth_token');
    try {
      await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRepost = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const reposted = !p.repostedByMe;
          return {
            ...p,
            repostedByMe: reposted,
            reposts: Math.max(0, p.reposts + (reposted ? 1 : -1)),
          };
        }
        return p;
      })
    );
    const token = localStorage.getItem('cook_auth_token');
    try {
      await fetch(`/api/posts/${postId}/repost`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!user) return;
    const optimisticComment = {
      id: `c-${Date.now()}`,
      author: {
        name: user.name,
        avatar: user.avatar,
        role: user.headline || user.title,
        verified: user.verified,
      },
      content: text,
      timestamp: 'Just now',
      likes: 0,
    };

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [optimisticComment, ...p.comments] } : p))
    );

    try {
      const token = localStorage.getItem('cook_auth_token');
      await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleVideoView = async (postId: string, completed = false) => {
    const token = localStorage.getItem('cook_auth_token');
    try {
      const res = await fetch(`/api/posts/${postId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ completed }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  viewsCount: data.viewsCount,
                  watchCompletions: data.watchCompletions,
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    const token = localStorage.getItem('cook_auth_token');
    try {
      await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (postData: any) => {
    const token = localStorage.getItem('cook_auth_token');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });
      const data = await res.json();
      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Funding Actions
  const handleRaiseFunds = async (fundingData: Partial<FundingRequest>) => {
    const token = localStorage.getItem('cook_auth_token');
    try {
      const res = await fetch('/api/fundings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fundingData),
      });
      const data = await res.json();
      if (data.funding) {
        setFundings((prev) => [data.funding, ...prev]);
      }
      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExpressInterest = async (fundId: string) => {
    const token = localStorage.getItem('cook_auth_token');
    try {
      await fetch(`/api/fundings/${fundId}/interest`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Real-Time Messaging Actions (WebSocket primary + REST fallback + Privacy enforcement)
  const handleSendMessage = async (
    text: string,
    isVoiceNote?: boolean,
    mediaUrl?: string,
    recipientId?: string,
    conversationId?: string
  ) => {
    if (!user) return;
    setChatError(null);

    const targetConvId =
      conversationId ||
      (recipientId ? `dm_${[user.id, recipientId].sort().join('_')}` : 'general');
    const clientTempId = `tmp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

    const optimisticMsg: Message = {
      id: clientTempId,
      conversationId: targetConvId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      recipientId,
      content: text,
      mediaUrl,
      isVoiceNote,
      read: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && recipientId) {
      wsRef.current.send(
        JSON.stringify({
          event: 'chat:send',
          payload: {
            clientTempId,
            content: text,
            isVoiceNote,
            mediaUrl,
            recipientId,
            conversationId: targetConvId,
          },
        })
      );
      return;
    }

    const token = localStorage.getItem('cook_auth_token');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: text,
          isVoiceNote,
          mediaUrl,
          recipientId,
          conversationId: targetConvId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== clientTempId));
        setChatError(data.error || 'Could not deliver message.');
        return;
      }
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === clientTempId ? data.message : m))
        );
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== clientTempId));
      setChatError(err?.message || 'Network error sending message.');
    }
  };

  const handleTyping = (recipientId: string, conversationId: string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: 'chat:typing',
          payload: { recipientId, conversationId, isTyping },
        })
      );
    }
  };

  const handleMarkConversationRead = async (conversationId: string, partnerId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.conversationId === conversationId && !m.isMe && !m.read
          ? { ...m, read: true, readAt: Date.now() }
          : m
      )
    );

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: 'chat:read',
          payload: { conversationId, partnerId },
        })
      );
      return;
    }

    const token = localStorage.getItem('cook_auth_token');
    if (!token) return;
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId, partnerId }),
      });
    } catch {
      // ignore
    }
  };

  const handleUpdateChatPrivacy = async (payload: {
    chatInitiationPolicy?: 'everyone' | 'connections_only' | 'nobody';
    blockUserId?: string;
    unblockUserId?: string;
  }) => {
    const token = localStorage.getItem('cook_auth_token');
    if (!token) return;
    const res = await fetch('/api/chat/privacy', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success && data.user) {
      setUser(data.user);
    }
  };

  const handleConnectUser = async (targetUserId: string) => {
    const token = localStorage.getItem('cook_auth_token');
    if (!token) return;
    const res = await fetch('/api/connections/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUserId }),
    });
    const data = await res.json();
    if (data.success && typeof data.connectionsCount === 'number') {
      setUser((prev) => (prev ? { ...prev, connectionsCount: data.connectionsCount } : prev));
    }
  };

  const handleStartCall = (partnerName: string, partnerAvatar: string, type: 'voice' | 'video') => {
    setActiveCall({ partnerName, partnerAvatar, type });
  };

  const handleSearch = (query: string) => {
    setSearchFilter(query);
    if (query.trim()) {
      setActiveTab('home');
    }
  };

  const unreadMessagesCount = messages.filter((m) => !m.isMe && !m.read).length;

  // Loading state while checking session
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF5E1E] to-[#6366F1] flex items-center justify-center shadow-lg shadow-purple-500/25 animate-pulse">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs text-gray-400 font-semibold tracking-wide">Cooking your experience...</span>
      </div>
    );
  }

  // 1. FIRST SCREEN: Unauthenticated visitor sees Google Sign-In & Welcome screen
  if (!user) {
    return <GoogleAuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // 2. SECOND SCREEN: Authenticated but onboarding incomplete -> Create Profile Step 1 & Step 2
  if (!user.onboardingCompleted) {
    return (
      <OnboardingFlow
        user={user}
        initialStep={user.onboardingStep || 1}
        onComplete={handleOnboardingComplete}
        onSignOut={handleSignOut}
      />
    );
  }

  const isModerator = user?.email?.toLowerCase().trim() === MODERATOR_EMAIL;

  // 3. ENTER COOK: Full application with protected routes and real user profile throughout!
  return (
    <div className={`min-h-[100dvh] flex flex-col overflow-x-clip ${darkMode ? 'bg-[#0B0F19] text-[#F3F4F6]' : 'bg-slate-100 text-slate-900'}`}>
      {/* Live Real-Time Message Toast */}
      {liveToast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 max-w-xs bg-[#13192B] border border-indigo-500/40 rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              if (liveToast.targetTab) setActiveTab(liveToast.targetTab);
              setLiveToast(null);
            }}
          >
            <p className="text-xs font-bold text-white truncate">{liveToast.title}</p>
            <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5">{liveToast.body}</p>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-gray-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navbar with Real Notifications & Messages Badge */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => {
          setCreatePostType('post');
          setCreatePostModalOpen(true);
        }}
        onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
        onOpenProfile={() => {
          setActiveTab('profile');
          setIsEditingProfile(false);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearNotifications={handleClearNotifications}
        onNavigateToNotification={(targetType) => {
          if (targetType === 'post') {
            setActiveTab('home');
          } else if (targetType === 'funding') {
            setActiveTab('funding');
          } else if (targetType === 'messages') {
            setActiveTab('messages');
          } else if (targetType === 'profile') {
            setActiveTab('profile');
          } else if (targetType === 'moderator' && isModerator) {
            setActiveTab('moderator');
          }
        }}
        onSignOut={handleSignOut}
        onSearch={handleSearch}
        user={user}
      />

      {/* Main Layout Container */}
      <main className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 pt-3 sm:pt-5 pb-24 lg:pb-10 flex-1 flex items-start gap-5 xl:gap-6 justify-center">
        {/* Left Sidebar with Real Network & Unread Messages Badge */}
        <LeftSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenProfile={() => {
            setActiveTab('profile');
            setIsEditingProfile(true);
          }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          unreadMessagesCount={unreadMessagesCount}
          user={user}
          serverStats={serverStats}
          allUsersCount={allUsersCount}
          onSignOut={handleSignOut}
        />

        {/* Center Content Stage */}
        <div className="flex-1 w-full flex justify-center min-w-0">
          {activeTab === 'home' && (
            <Feed
              currentUser={user}
              posts={posts}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              onLike={handleLike}
              onSave={handleSave}
              onRepost={handleRepost}
              onShare={(item) => setShareItem(item)}
              onDelete={handleDeletePost}
              onAddComment={handleAddComment}
              onVideoView={handleVideoView}
              onOpenCreateModal={(type) => {
                setCreatePostType(type || 'post');
                setCreatePostModalOpen(true);
              }}
              onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
              onViewStartup={(name) => {
                setSelectedStartupFilter(name);
                setActiveTab('funding');
              }}
              searchFilter={searchFilter}
              onClearSearch={() => setSearchFilter('')}
              onDirectPost={handleCreatePost}
            />
          )}

          {activeTab === 'funding' && (
            <FundingHub
              fundings={fundings}
              onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
              onExpressInterest={handleExpressInterest}
              onShare={(item) => setShareItem(item)}
              onContactFounder={(founder) => {
                setSelectedChatPartner(founder);
                setActiveTab('messages');
              }}
              selectedStartupFilter={selectedStartupFilter}
            />
          )}

          {activeTab === 'ai-mentor' && (
            <AiMentor onShare={(item) => setShareItem(item)} />
          )}

          {activeTab === 'messages' && (
            <MessagingCenter
              messages={messages}
              currentUser={user}
              onSendMessage={handleSendMessage}
              onStartCall={handleStartCall}
              selectedPartner={selectedChatPartner}
              onlineUserIds={onlineUserIds}
              wsConnected={wsConnected}
              typingUsers={typingUsers}
              chatError={chatError}
              onClearChatError={() => setChatError(null)}
              onTyping={handleTyping}
              onMarkConversationRead={handleMarkConversationRead}
              onUpdateChatPrivacy={handleUpdateChatPrivacy}
              onConnectUser={handleConnectUser}
            />
          )}

          {activeTab === 'moderator' && isModerator && (
            <ModeratorDashboard currentUserEmail={user.email} />
          )}

          {activeTab === 'communities' && (
            <CommunitiesView onShare={(item) => setShareItem(item)} />
          )}

          {activeTab === 'opportunities' && (
            <OpportunitiesView
              onShare={(item) => setShareItem(item)}
              onContactFounder={(founder) => {
                setSelectedChatPartner(founder);
                setActiveTab('messages');
              }}
            />
          )}

          {activeTab === 'investors' && (
            <FundingHub
              fundings={fundings}
              onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
              onExpressInterest={handleExpressInterest}
              onShare={(item) => setShareItem(item)}
              onContactFounder={(founder) => {
                setSelectedChatPartner(founder);
                setActiveTab('messages');
              }}
            />
          )}

          {activeTab === 'learning' && (
            <LearningHubView onShare={(item) => setShareItem(item)} />
          )}

          {activeTab === 'events' && (
            <EventsView onShare={(item) => setShareItem(item)} />
          )}

          {activeTab === 'discover' && (
            <Feed
              currentUser={user}
              posts={posts}
              activeFilter="Trending"
              setActiveFilter={setActiveFilter}
              onLike={handleLike}
              onSave={handleSave}
              onRepost={handleRepost}
              onShare={(item) => setShareItem(item)}
              onDelete={handleDeletePost}
              onAddComment={handleAddComment}
              onVideoView={handleVideoView}
              onOpenCreateModal={(type) => {
                setCreatePostType(type || 'post');
                setCreatePostModalOpen(true);
              }}
              onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
              onViewStartup={(name) => {
                setSelectedStartupFilter(name);
                setActiveTab('funding');
              }}
            />
          )}

          {activeTab === 'profile' && (
            isEditingProfile ? (
              <EditProfileView
                user={user}
                onSave={handleSaveProfile}
                onBack={() => setIsEditingProfile(false)}
                onViewPublicProfile={() => setIsEditingProfile(false)}
              />
            ) : (
              <ProfileView
                user={user}
                posts={posts}
                fundings={fundings}
                isOwner={true}
                onEditProfile={() => setIsEditingProfile(true)}
                onShare={(item) => setShareItem(item)}
                onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
                onOpenUploadVideo={() => {
                  setCreatePostType('video');
                  setCreatePostModalOpen(true);
                }}
                onContactUser={() => setActiveTab('messages')}
                onUpdateUser={handleSaveProfile}
                onLikePost={handleLike}
                onSavePost={handleSave}
                onRepostPost={handleRepost}
                onDeletePost={handleDeletePost}
                onAddComment={handleAddComment}
                onVideoView={handleVideoView}
              />
            )
          )}
        </div>

        {/* Right Sidebar (Shown on Home & Discover so full workspace tabs breathe on laptops) */}
        {(activeTab === 'home' || activeTab === 'discover') && (
          <RightSidebar
            onSelectTopic={(_tag) => {
              setActiveTab('home');
              setActiveFilter('Trending');
            }}
            onViewStartup={(name) => {
              setSelectedStartupFilter(name);
              setActiveTab('funding');
            }}
            setActiveTab={setActiveTab}
            fundings={fundings}
            posts={posts}
            onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-xl border-t border-[#1F293D] pt-1.5 pb-[max(8px,env(safe-area-inset-bottom,8px))] px-2 flex items-center justify-around select-none shadow-2xl">
        <button
          onClick={() => setActiveTab('home')}
          className={`min-w-[48px] py-1 flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
            activeTab === 'home' ? 'text-[#FF5E1E]' : 'text-gray-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('discover')}
          className={`min-w-[48px] py-1 flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
            activeTab === 'discover' ? 'text-[#FF5E1E]' : 'text-gray-400'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Discover</span>
        </button>

        <button
          onClick={() => {
            setCreatePostType('post');
            setCreatePostModalOpen(true);
          }}
          className="flex flex-col items-center justify-center -mt-4 px-2 active:scale-95 transition"
          aria-label="Create post"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#FF5E1E] to-[#6366F1] flex items-center justify-center text-white shadow-lg shadow-orange-500/30 ring-4 ring-[#0B0F19]">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold text-white mt-0.5">Post</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('profile');
            setIsEditingProfile(false);
          }}
          className={`min-w-[48px] py-1 flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
            activeTab === 'profile' ? 'text-[#FF5E1E]' : 'text-gray-400'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`min-w-[48px] py-1 flex flex-col items-center justify-center gap-0.5 relative transition active:scale-95 ${
            activeTab === 'messages' ? 'text-[#FF5E1E]' : 'text-gray-400'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-0 right-1.5 px-1 min-w-[15px] h-3.5 rounded-full bg-[#FF5E1E] text-white text-[9px] font-bold flex items-center justify-center">
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </span>
          )}
          <span className="text-[10px] font-semibold">Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('funding')}
          className={`min-w-[48px] py-1 flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
            activeTab === 'funding' ? 'text-[#FF5E1E]' : 'text-gray-400'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Funding</span>
        </button>
      </nav>

      {/* Universal Share & Copy Modal */}
      <ShareModal
        isOpen={Boolean(shareItem)}
        onClose={() => setShareItem(null)}
        item={shareItem}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        onSubmit={handleCreatePost}
        defaultType={createPostType}
      />

      {/* Raise Funds Modal */}
      <RaiseFundsModal
        isOpen={raiseFundsModalOpen}
        onClose={() => setRaiseFundsModalOpen(false)}
        onSubmit={handleRaiseFunds}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />

      {/* Live Voice & Video Call Modal */}
      {activeCall && (
        <CallModal
          partnerName={activeCall.partnerName}
          partnerAvatar={activeCall.partnerAvatar}
          callType={activeCall.type}
          onEndCall={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
