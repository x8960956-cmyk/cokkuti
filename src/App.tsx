import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { Feed } from './components/Feed';
import { FundingHub } from './components/FundingHub';
import { CookClips } from './components/CookClips';
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
import { Post, FundingRequest, Clip, Message, User } from './types';
import { Home, Compass, Film, DollarSign, MessageSquare, PlusCircle, Flame } from 'lucide-react';

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
  const [clips, setClips] = useState<Clip[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Modals
  const [shareItem, setShareItem] = useState<ShareItem | null>(null);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [createPostType, setCreatePostType] = useState('post');
  const [raiseFundsModalOpen, setRaiseFundsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [clipsViewOpen, setClipsViewOpen] = useState(false);
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

  // Fetch application data only when authenticated user is present and onboarding completed
  useEffect(() => {
    if (user && user.onboardingCompleted) {
      fetchPosts();
      fetchFundings();
      fetchClips();
      fetchMessages();
    }
  }, [user?.id, user?.onboardingCompleted, activeFilter]);

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
    const token = localStorage.getItem('cook_auth_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('cook_auth_token');
    setUser(null);
    setActiveTab('home');
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async (updated: Partial<User>) => {
    if (!user) return;
    const merged = { ...user, ...updated };
    setUser(merged);
    const token = localStorage.getItem('cook_auth_token');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error persisting profile to server:', err);
    }
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

  const fetchClips = async () => {
    try {
      const res = await fetch('/api/clips');
      const data = await res.json();
      if (data.clips) setClips(data.clips);
    } catch (err) {
      console.warn('Fallback: could not fetch clips', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) {
      console.warn('Fallback: could not fetch messages', err);
    }
  };

  // Post Actions
  const handleLike = async (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const liked = !p.likedByMe;
          return {
            ...p,
            likedByMe: liked,
            likes: p.likes + (liked ? 1 : -1),
          };
        }
        return p;
      })
    );
    try {
      await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const saved = !p.savedByMe;
          return {
            ...p,
            savedByMe: saved,
            saves: p.saves + (saved ? 1 : -1),
          };
        }
        return p;
      })
    );
    try {
      await fetch(`/api/posts/${postId}/save`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRepost = async (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const reposted = !p.repostedByMe;
          return {
            ...p,
            repostedByMe: reposted,
            reposts: p.reposts + (reposted ? 1 : -1),
          };
        }
        return p;
      })
    );
    try {
      await fetch(`/api/posts/${postId}/repost`, { method: 'POST' });
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

    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, comments: [optimisticComment, ...p.comments] } : p))
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

  const handleDeletePost = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
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
        setPosts([data.post, ...posts]);
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
        setFundings([data.funding, ...fundings]);
      }
      if (data.post) {
        setPosts([data.post, ...posts]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExpressInterest = async (fundId: string) => {
    try {
      await fetch(`/api/fundings/${fundId}/interest`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  // Messaging Actions
  const handleSendMessage = async (text: string, isVoiceNote?: boolean, mediaUrl?: string) => {
    if (!user) return;
    const optimisticMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: 'conv-1',
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content: text,
      mediaUrl,
      isVoiceNote,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const token = localStorage.getItem('cook_auth_token');
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text, isVoiceNote, mediaUrl }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadClip = async (newClipData: Partial<Clip>) => {
    const token = localStorage.getItem('cook_auth_token');
    try {
      const res = await fetch('/api/clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClipData),
      });
      const data = await res.json();
      if (data.clip) {
        setClips([data.clip, ...clips]);
      }
    } catch (err) {
      console.error(err);
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

  // 3. ENTER COOK: Full application with protected routes and real user profile throughout!
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0B0F19] text-[#F3F4F6]' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={tab => {
          if (tab === 'clips') {
            setClipsViewOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
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
        onSearch={handleSearch}
        user={user}
        onSignOut={handleSignOut}
      />

      {/* Main Layout Container */}
      <main className="w-full max-w-[1720px] mx-auto px-2.5 sm:px-6 pt-4 sm:pt-6 pb-24 lg:pb-12 flex gap-6 justify-center">
        {/* Left Sidebar */}
        <LeftSidebar
          activeTab={activeTab}
          setActiveTab={tab => {
            if (tab === 'clips') {
              setClipsViewOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          onOpenProfile={() => {
            setActiveTab('profile');
            setIsEditingProfile(true);
          }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          user={user}
          onSignOut={handleSignOut}
        />

        {/* Center Content Stage */}
        <div className="flex-1 flex justify-center min-w-0">
          {activeTab === 'home' && (
            <Feed
              currentUser={user}
              posts={posts}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              onLike={handleLike}
              onSave={handleSave}
              onRepost={handleRepost}
              onShare={item => setShareItem(item)}
              onDelete={handleDeletePost}
              onAddComment={handleAddComment}
              onOpenCreateModal={type => {
                setCreatePostType(type || 'post');
                setCreatePostModalOpen(true);
              }}
              onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
              onViewStartup={name => {
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
              onShare={item => setShareItem(item)}
              onContactFounder={founder => {
                setActiveTab('messages');
              }}
              selectedStartupFilter={selectedStartupFilter}
            />
          )}

          {activeTab === 'ai-mentor' && (
            <AiMentor onShare={item => setShareItem(item)} />
          )}

          {activeTab === 'messages' && (
            <MessagingCenter
              messages={messages}
              onSendMessage={handleSendMessage}
              onStartCall={handleStartCall}
            />
          )}

          {activeTab === 'communities' && (
            <CommunitiesView onShare={item => setShareItem(item)} />
          )}

          {activeTab === 'opportunities' && (
            <OpportunitiesView
              onShare={item => setShareItem(item)}
              onContactFounder={founder => setActiveTab('messages')}
            />
          )}

          {activeTab === 'investors' && (
            <FundingHub
              fundings={fundings}
              onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
              onExpressInterest={handleExpressInterest}
              onShare={item => setShareItem(item)}
              onContactFounder={founder => setActiveTab('messages')}
            />
          )}

          {activeTab === 'learning' && (
            <LearningHubView onShare={item => setShareItem(item)} />
          )}

          {activeTab === 'events' && (
            <EventsView onShare={item => setShareItem(item)} />
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
              onShare={item => setShareItem(item)}
              onDelete={handleDeletePost}
              onAddComment={handleAddComment}
              onOpenCreateModal={() => setCreatePostModalOpen(true)}
              onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
              onViewStartup={name => {
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
                clips={clips}
                isOwner={true}
                onEditProfile={() => setIsEditingProfile(true)}
                onShare={item => setShareItem(item)}
                onOpenRaiseFundsModal={() => setRaiseFundsModalOpen(true)}
                onContactUser={() => setActiveTab('messages')}
                onUpdateUser={handleSaveProfile}
                onLikePost={handleLike}
                onSavePost={handleSave}
                onRepostPost={handleRepost}
                onAddComment={handleAddComment}
              />
            )
          )}
        </div>

        {/* Right Sidebar */}
        <RightSidebar
          onSelectTopic={tag => {
            setActiveTab('home');
            setActiveFilter('Trending');
          }}
          onViewStartup={name => {
            setSelectedStartupFilter(name);
            setActiveTab('funding');
          }}
          setActiveTab={setActiveTab}
        />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-xl border-t border-[#1F293D] py-2 px-3 pb-safe flex items-center justify-around select-none shadow-2xl">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'home' ? 'text-[#FF5E1E]' : 'text-gray-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('discover')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'discover' ? 'text-[#FF5E1E]' : 'text-gray-400'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Discover</span>
        </button>

        <button
          onClick={() => setCreatePostModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF5E1E] to-[#6366F1] flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold text-white mt-1">Post</span>
        </button>

        <button
          onClick={() => setClipsViewOpen(true)}
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Clips</span>
        </button>

        <button
          onClick={() => setActiveTab('funding')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'funding' ? 'text-[#FF5E1E]' : 'text-gray-400'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Funding</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('profile');
            setIsEditingProfile(false);
          }}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'profile' ? 'text-[#FF5E1E]' : 'text-gray-400'
          }`}
        >
          <div className="relative">
            <img
              src={user.avatar}
              alt="Profile"
              className={`w-5 h-5 rounded-full object-cover ${
                activeTab === 'profile' ? 'ring-2 ring-[#FF5E1E]' : ''
              }`}
            />
          </div>
          <span className="text-[10px] font-semibold">Profile</span>
        </button>
      </nav>

      {/* COOK Clips Full Screen Viewer */}
      {clipsViewOpen && (
        <CookClips
          clips={clips}
          onClose={() => setClipsViewOpen(false)}
          onShare={item => setShareItem(item)}
          onUploadClip={handleUploadClip}
        />
      )}

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
