import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Send,
  Phone,
  Video,
  Paperclip,
  ShieldCheck,
  Check,
  CheckCheck,
  ArrowLeft,
  X,
  MessageSquare,
  Shield,
  Lock,
  UserPlus,
  Ban,
  Loader2,
  AlertCircle,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import { Message, User } from '../types';
import { uploadMediaFile } from '../utils/mediaUpload';

interface MessagingCenterProps {
  messages: Message[];
  currentUser: User;
  onSendMessage: (
    text: string,
    isVoiceNote?: boolean,
    mediaUrl?: string,
    recipientId?: string,
    conversationId?: string
  ) => void;
  onStartCall: (partnerName: string, partnerAvatar: string, type: 'voice' | 'video') => void;
  selectedPartner?: string;
  onlineUserIds?: string[];
  wsConnected?: boolean;
  typingUsers?: Record<string, boolean>;
  chatError?: string | null;
  onClearChatError?: () => void;
  onTyping?: (recipientId: string, conversationId: string, isTyping: boolean) => void;
  onMarkConversationRead?: (conversationId: string, partnerId: string) => void;
  onUpdateChatPrivacy?: (payload: {
    chatInitiationPolicy?: 'everyone' | 'connections_only' | 'nobody';
    blockUserId?: string;
    unblockUserId?: string;
  }) => Promise<void>;
  onConnectUser?: (targetUserId: string) => Promise<void>;
}

interface ReadStatusIndicatorProps {
  read?: boolean;
  readAt?: number;
  showLabel?: boolean;
  justTransitioned?: boolean;
}

const ReadStatusIndicator: React.FC<ReadStatusIndicatorProps> = ({
  read,
  readAt,
  showLabel = false,
  justTransitioned = false,
}) => {
  const formattedReadTime = readAt
    ? new Date(readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const statusText = read
    ? formattedReadTime
      ? `Read at ${formattedReadTime}`
      : 'Read'
    : 'Sent';

  return (
    <span
      title={statusText}
      aria-label={statusText}
      className="inline-flex items-center gap-1 select-none"
    >
      <span className="relative inline-flex items-center justify-center w-4 h-3.5">
        {/* Single Checkmark (Sent / Delivered) */}
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            read
              ? 'opacity-0 scale-75 -translate-x-0.5 pointer-events-none'
              : 'opacity-100 scale-100 translate-x-0'
          }`}
        >
          <Check className="w-3.5 h-3.5 text-indigo-200/75" strokeWidth={2.25} />
        </span>

        {/* Double Checkmark (Read) */}
        <span
          key={read ? 'status-read' : 'status-unread'}
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            read
              ? `opacity-100 scale-100 ${justTransitioned ? 'animate-receipt-pop' : ''}`
              : 'opacity-0 scale-50 translate-x-0.5 pointer-events-none'
          }`}
        >
          <CheckCheck
            className={`w-3.5 h-3.5 transition-colors duration-300 ${
              justTransitioned
                ? 'text-emerald-200 drop-shadow-[0_0_6px_rgba(110,231,183,0.6)]'
                : 'text-emerald-300'
            }`}
            strokeWidth={2.35}
          />
        </span>
      </span>

      {showLabel && (
        <span
          className={`text-[10px] font-medium tracking-tight transition-colors duration-300 ${
            read ? 'text-emerald-200' : 'text-indigo-200/75'
          }`}
        >
          {read ? 'Read' : 'Sent'}
        </span>
      )}
    </span>
  );
};

export const MessagingCenter: React.FC<MessagingCenterProps> = ({
  messages,
  currentUser,
  onSendMessage,
  onStartCall,
  selectedPartner,
  onlineUserIds = [],
  wsConnected = false,
  typingUsers = {},
  chatError,
  onClearChatError,
  onTyping,
  onMarkConversationRead,
  onUpdateChatPrivacy,
  onConnectUser,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [convFilter, setConvFilter] = useState<'all' | 'unread' | 'online'>('all');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [attachedMedia, setAttachedMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    name: string;
  } | null>(null);
  const [newlyReadIds, setNewlyReadIds] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevReadStatusRef = useRef<Record<string, boolean>>({});

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('cook_auth_token');
      const res = await fetch('/api/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data.users)) {
        const others = data.users.filter((u: any) => u.id !== currentUser.id);
        setUsers(others);
        if (selectedPartner) {
          const match = others.find(
            (u: any) => u.name.toLowerCase() === selectedPartner.toLowerCase()
          );
          if (match) {
            setSelectedUserId(match.id);
            setMobileShowChat(true);
            return;
          }
        }
        if (others.length > 0 && !selectedUserId) {
          setSelectedUserId(others[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser.id, selectedPartner, currentUser.privacySettings]);

  // Detect live false -> true transitions on `read` so the status update animates crisply
  useEffect(() => {
    const justRead: string[] = [];
    const nextMap: Record<string, boolean> = {};

    for (const m of messages) {
      if (!m.isMe) continue;
      const wasRead = prevReadStatusRef.current[m.id];
      const isNowRead = Boolean(m.read);
      nextMap[m.id] = isNowRead;
      if (wasRead === false && isNowRead === true) {
        justRead.push(m.id);
      }
    }
    prevReadStatusRef.current = nextMap;

    if (justRead.length > 0) {
      setNewlyReadIds((prev) => {
        const updated = { ...prev };
        for (const id of justRead) updated[id] = true;
        return updated;
      });

      const timer = setTimeout(() => {
        setNewlyReadIds((prev) => {
          const updated = { ...prev };
          for (const id of justRead) delete updated[id];
          return updated;
        });
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const allConversations = useMemo(() => {
    return users.map((u) => {
      const convId = `dm_${[currentUser.id, u.id].sort().join('_')}`;
      const convMsgs = messages.filter(
        (m: any) =>
          m.conversationId === convId ||
          (m.senderId === u.id && m.recipientId === currentUser.id) ||
          (m.senderId === currentUser.id && m.recipientId === u.id)
      );
      const last = convMsgs[convMsgs.length - 1];
      const unreadCount = convMsgs.filter((m) => !m.isMe && !m.read).length;
      const isOnline = onlineUserIds.includes(u.id) || Boolean(u.isOnline);
      return {
        id: convId,
        partnerId: u.id,
        partnerName: u.name,
        partnerRole: u.headline || u.role || `@${u.username}`,
        partnerAvatar: u.avatar || '',
        verified: Boolean(u.verified),
        isOnline,
        isConnected: Boolean(u.isConnected),
        isBlockedByMe: Boolean(u.isBlockedByMe),
        canInitiateChat: u.canInitiateChat !== false,
        chatBlockReason: u.chatBlockReason,
        chatPrivacyPolicy: u.chatPrivacyPolicy || 'everyone',
        unreadCount,
        lastMsg: last || null,
        lastMessage: last ? last.content : 'Start a conversation on COOK',
        timestamp: last ? last.timestamp : '',
        messages: convMsgs,
      };
    });
  }, [users, messages, currentUser.id, onlineUserIds]);

  const conversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allConversations
      .filter((c) => {
        if (convFilter === 'unread' && c.unreadCount === 0) return false;
        if (convFilter === 'online' && !c.isOnline) return false;
        if (!q) return true;
        return (
          c.partnerName.toLowerCase().includes(q) ||
          c.partnerRole.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const timeA = a.lastMsg?.createdAt || 0;
        const timeB = b.lastMsg?.createdAt || 0;
        if (timeA !== timeB) return timeB - timeA;
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return a.partnerName.localeCompare(b.partnerName);
      });
  }, [allConversations, searchQuery, convFilter]);

  const currentConv =
    allConversations.find((c) => c.partnerId === selectedUserId) || conversations[0] || null;

  // Mark incoming unread messages in the active conversation as read
  useEffect(() => {
    if (!currentConv || currentConv.unreadCount === 0 || !onMarkConversationRead) return;
    onMarkConversationRead(currentConv.id, currentConv.partnerId);
  }, [currentConv?.id, currentConv?.unreadCount]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages.length, currentConv?.id]);

  // Auto-resize composer textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputText]);

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const isVideo = file.type.startsWith('video');
    try {
      setUploadProgress(5);
      const uploaded = await uploadMediaFile(file, (pct) => setUploadProgress(pct));
      setAttachedMedia({
        url: uploaded.url,
        type: isVideo ? 'video' : 'image',
        name: file.name,
      });
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload attachment');
    } finally {
      setUploadProgress(null);
    }
    e.target.value = '';
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!currentConv || !onTyping) return;
    onTyping(currentConv.partnerId, currentConv.id, val.trim().length > 0);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(currentConv.partnerId, currentConv.id, false);
    }, 1800);
  };

  const submitMessage = () => {
    if (!currentConv || (!inputText.trim() && !attachedMedia) || !currentConv.canInitiateChat) return;

    const text =
      inputText.trim() || (attachedMedia ? `Sent ${attachedMedia.type}: ${attachedMedia.name}` : '');
    onSendMessage(text, false, attachedMedia?.url, currentConv.partnerId, currentConv.id);
    if (onTyping) {
      onTyping(currentConv.partnerId, currentConv.id, false);
    }
    setInputText('');
    setAttachedMedia(null);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const handlePolicyChange = async (policy: 'everyone' | 'connections_only' | 'nobody') => {
    if (!onUpdateChatPrivacy || isUpdatingPrivacy) return;
    setIsUpdatingPrivacy(true);
    try {
      await onUpdateChatPrivacy({ chatInitiationPolicy: policy });
      await loadUsers();
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleBlockToggle = async (partnerId: string, currentlyBlocked: boolean) => {
    if (!onUpdateChatPrivacy || isUpdatingPrivacy) return;
    setIsUpdatingPrivacy(true);
    try {
      await onUpdateChatPrivacy(
        currentlyBlocked ? { unblockUserId: partnerId } : { blockUserId: partnerId }
      );
      await loadUsers();
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleConnectAndUnlock = async (partnerId: string) => {
    if (!onConnectUser || isConnecting) return;
    setIsConnecting(true);
    try {
      await onConnectUser(partnerId);
      await loadUsers();
    } finally {
      setIsConnecting(false);
    }
  };

  const myChatPolicy =
    currentUser.privacySettings?.allowDirectMessages === false
      ? 'nobody'
      : currentUser.privacySettings?.chatInitiationPolicy || 'everyone';

  const isPartnerTyping = currentConv ? Boolean(typingUsers[currentConv.id]) : false;

  const totalUnreadConvs = allConversations.filter((c) => c.unreadCount > 0).length;
  const totalOnlineConvs = allConversations.filter((c) => c.isOnline).length;

  const lastOutgoingMessageId = useMemo(() => {
    if (!currentConv) return null;
    for (let i = currentConv.messages.length - 1; i >= 0; i--) {
      if (currentConv.messages[i].isMe) return currentConv.messages[i].id;
    }
    return null;
  }, [currentConv?.messages]);

  return (
    <div className="w-full flex-1 max-w-6xl h-[calc(100dvh-9.25rem)] sm:h-[calc(100dvh-9.75rem)] lg:h-[calc(100dvh-6.75rem)] min-h-[420px] flex rounded-2xl bg-[#111728] border border-white/[0.08] shadow-2xl overflow-hidden relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileAttach}
      />

      {/* Left Conversations Sidebar */}
      <aside
        className={`w-full sm:w-72 lg:w-80 xl:w-[340px] border-r border-white/[0.08] flex flex-col bg-[#0C111E] ${
          mobileShowChat ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-base tracking-tight whitespace-nowrap">
                  Messages
                </h2>
                {wsConnected && (
                  <span
                    title="Real-time connection active"
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                {allConversations.length} members · {totalOnlineConvs} online
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyPanel(!showPrivacyPanel)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                showPrivacyPanel
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#151C2F] text-slate-300 hover:text-white border border-white/[0.08]'
              }`}
              title="Manage who can start chats with you"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy</span>
            </button>
          </div>

          {showPrivacyPanel && (
            <div className="p-3 rounded-xl bg-[#151C2F] border border-indigo-500/30 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Who can start a chat</span>
                </span>
                {isUpdatingPrivacy && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'everyone', label: 'Everyone on COOK', desc: 'Any verified member can message you' },
                  { id: 'connections_only', label: 'Connections Only', desc: 'Only members you connected with' },
                  { id: 'nobody', label: 'Nobody', desc: 'Pause new chat requests' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handlePolicyChange(opt.id as any)}
                    className={`p-2.5 rounded-lg text-left border transition-colors cursor-pointer ${
                      myChatPolicy === opt.id
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                        : 'bg-[#0C111E] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members or messages..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#151C2F] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Conversation Filter */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#151C2F] rounded-xl border border-white/[0.06]">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: totalUnreadConvs > 0 ? `Unread (${totalUnreadConvs})` : 'Unread' },
              { id: 'online', label: `Online (${totalOnlineConvs})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setConvFilter(tab.id as any)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap truncate tabular-nums cursor-pointer ${
                  convFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
          {isLoadingUsers ? (
            <div className="p-3 space-y-2">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="p-2.5 flex items-center gap-3 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-white/[0.06] flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 bg-white/[0.06] rounded" />
                    <div className="h-2.5 w-40 bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-200">
                  {searchQuery || convFilter !== 'all' ? 'No matching conversations' : 'No members yet'}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {searchQuery || convFilter !== 'all'
                    ? 'Try clearing your filter or searching for another member name.'
                    : 'Registered COOK builders and founders will appear here for 1-on-1 messaging.'}
                </p>
              </div>
              {(searchQuery || convFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setConvFilter('all');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Reset filter
                </button>
              )}
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = currentConv?.partnerId === conv.partnerId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setSelectedUserId(conv.partnerId);
                    setMobileShowChat(true);
                    if (onClearChatError) onClearChatError();
                  }}
                  className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                    isSelected
                      ? 'bg-indigo-500/15 ring-1 ring-inset ring-indigo-500/30'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {conv.partnerAvatar ? (
                      <img
                        src={conv.partnerAvatar}
                        alt={conv.partnerName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-200">
                        {conv.partnerName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {conv.isOnline && (
                      <span
                        title="Online now"
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0C111E]"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <h4 className="font-semibold text-white text-xs truncate">{conv.partnerName}</h4>
                        {conv.verified && <ShieldCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-500 tabular-nums whitespace-nowrap">
                        {conv.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {conv.lastMsg?.isMe && !typingUsers[conv.id] && (
                          <ReadStatusIndicator
                            read={conv.lastMsg.read}
                            readAt={conv.lastMsg.readAt}
                            justTransitioned={Boolean(newlyReadIds[conv.lastMsg.id])}
                          />
                        )}
                        <p
                          className={`text-[11px] truncate ${
                            conv.unreadCount > 0 ? 'text-slate-100 font-medium' : 'text-slate-400'
                          }`}
                        >
                          {typingUsers[conv.id] ? (
                            <span className="text-indigo-400 font-medium">Typing...</span>
                          ) : (
                            conv.lastMessage
                          )}
                        </p>
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 min-w-[18px] text-center rounded-full bg-[#FF5E1E] text-white text-[10px] font-bold tabular-nums flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Active Chat Pane */}
      <section
        className={`flex-1 flex flex-col bg-[#111728] min-w-0 ${
          !mobileShowChat ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {!currentConv ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">Direct Messaging</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Select a member from the left to view your conversation history and exchange real-time messages.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-[#0E1424]">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className="sm:hidden p-2 -ml-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative flex-shrink-0">
                  {currentConv.partnerAvatar ? (
                    <img
                      src={currentConv.partnerAvatar}
                      alt={currentConv.partnerName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/15"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-200">
                      {currentConv.partnerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {currentConv.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0E1424]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-sm truncate">{currentConv.partnerName}</h3>
                    {currentConv.verified && <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-[190px] sm:max-w-sm">
                    {isPartnerTyping ? (
                      <span className="text-indigo-400 font-medium">Typing a message...</span>
                    ) : (
                      <span>
                        {currentConv.isOnline ? 'Active now · ' : ''}
                        {currentConv.partnerRole}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleBlockToggle(currentConv.partnerId, currentConv.isBlockedByMe)}
                  disabled={isUpdatingPrivacy}
                  title={currentConv.isBlockedByMe ? 'Unblock User' : 'Block User'}
                  className={`px-3 h-9 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    currentConv.isBlockedByMe
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                      : 'bg-[#171F35] hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 border border-white/[0.06]'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {currentConv.isBlockedByMe ? 'Unblock' : 'Block'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onStartCall(currentConv.partnerName, currentConv.partnerAvatar, 'voice')}
                  title="Start Voice Call"
                  aria-label="Start Voice Call"
                  className="w-9 h-9 rounded-xl bg-[#171F35] hover:bg-indigo-600 text-slate-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onStartCall(currentConv.partnerName, currentConv.partnerAvatar, 'video')}
                  title="Start Video Call"
                  aria-label="Start Video Call"
                  className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-sm shadow-indigo-600/25 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Chat Error Alert */}
            {chatError && (
              <div className="px-4 py-2.5 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between text-xs text-rose-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{chatError}</span>
                </div>
                {onClearChatError && (
                  <button
                    type="button"
                    onClick={onClearChatError}
                    className="text-rose-300 hover:text-white p-1"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">
              {currentConv.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-12">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-slate-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    Say hello to {currentConv.partnerName}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Messages are delivered instantly and show live read receipts when seen.
                  </p>
                </div>
              ) : (
                currentConv.messages.map((msg: Message, idx: number) => {
                  const prevMsg = idx > 0 ? currentConv.messages[idx - 1] : null;
                  const nextMsg =
                    idx < currentConv.messages.length - 1 ? currentConv.messages[idx + 1] : null;
                  const sameSenderAsPrev = Boolean(prevMsg && prevMsg.isMe === msg.isMe);
                  const sameSenderAsNext = Boolean(nextMsg && nextMsg.isMe === msg.isMe);
                  const isLastOutgoing = msg.isMe && msg.id === lastOutgoingMessageId;
                  const showReceiptLabel = isLastOutgoing;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 animate-msg-enter ${
                        msg.isMe ? 'justify-end' : 'justify-start'
                      } ${sameSenderAsPrev ? 'pt-0.5' : 'pt-3'}`}
                    >
                      {!msg.isMe && (
                        <div className="w-7 flex-shrink-0">
                          {!sameSenderAsNext &&
                            (msg.senderAvatar || currentConv.partnerAvatar ? (
                              <img
                                src={msg.senderAvatar || currentConv.partnerAvatar}
                                alt={msg.senderName}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full object-cover border border-white/10"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                {currentConv.partnerName.slice(0, 1).toUpperCase()}
                              </div>
                            ))}
                        </div>
                      )}

                      <div
                        className={`max-w-[82%] sm:max-w-[72%] px-3.5 py-2.5 text-[13px] sm:text-sm leading-relaxed transition-colors ${
                          msg.isMe
                            ? `bg-indigo-600 text-white shadow-sm ${
                                sameSenderAsNext
                                  ? 'rounded-2xl rounded-br-md'
                                  : 'rounded-2xl rounded-br-xs'
                              }`
                            : `bg-[#182035] text-slate-100 border border-white/[0.07] ${
                                sameSenderAsNext
                                  ? 'rounded-2xl rounded-bl-md'
                                  : 'rounded-2xl rounded-bl-xs'
                              }`
                        }`}
                      >
                        {msg.mediaUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-white/10 bg-black">
                            {msg.mediaUrl.startsWith('data:video') ||
                            msg.mediaUrl.endsWith('.mp4') ||
                            msg.mediaUrl.endsWith('.webm') ||
                            msg.mediaUrl.endsWith('.mov') ? (
                              <video
                                src={msg.mediaUrl}
                                controls
                                className="w-full max-h-60 object-cover"
                              />
                            ) : (
                              <img
                                src={msg.mediaUrl}
                                alt="Attached media"
                                referrerPolicy="no-referrer"
                                className="w-full max-h-60 object-cover"
                              />
                            )}
                          </div>
                        )}

                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                        <div
                          className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] tabular-nums ${
                            msg.isMe ? 'text-indigo-200/85' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {msg.isMe && (
                            <ReadStatusIndicator
                              read={msg.read}
                              readAt={msg.readAt}
                              showLabel={showReceiptLabel}
                              justTransitioned={Boolean(newlyReadIds[msg.id])}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isPartnerTyping && (
                <div className="flex items-end gap-2.5 pt-3 animate-msg-enter">
                  <div className="w-7 h-7 rounded-full bg-[#182035] border border-white/[0.07] flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0">
                    {currentConv.partnerName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-[#182035] border border-white/[0.07] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-typing-dot" />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-typing-dot"
                      style={{ animationDelay: '0.18s' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-typing-dot"
                      style={{ animationDelay: '0.36s' }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Attached Media Bar */}
            {attachedMedia && (
              <div className="px-4 py-2.5 bg-[#0E1424] border-t border-white/[0.08] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {attachedMedia.type === 'image' ? (
                    <img
                      src={attachedMedia.url}
                      alt={attachedMedia.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-lg object-cover border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center justify-center flex-shrink-0">
                      <Film className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{attachedMedia.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {attachedMedia.type} ready to send
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedMedia(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
                  aria-label="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadProgress !== null && (
              <div className="px-4 py-2 bg-[#0E1424] border-t border-white/[0.08] text-[11px] text-indigo-300 flex items-center gap-2 tabular-nums">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading attachment · {uploadProgress}%</span>
              </div>
            )}

            {uploadError && (
              <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Composer or Privacy Gate */}
            {!currentConv.canInitiateChat ? (
              <div className="p-3.5 border-t border-white/[0.08] bg-[#0E1424] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-amber-300">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <span>{currentConv.chatBlockReason || 'Messaging is restricted by privacy settings.'}</span>
                </div>
                {currentConv.chatPrivacyPolicy === 'connections_only' &&
                  !currentConv.isConnected &&
                  !currentConv.isBlockedByMe &&
                  onConnectUser && (
                    <button
                      type="button"
                      onClick={() => handleConnectAndUnlock(currentConv.partnerId)}
                      disabled={isConnecting}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer whitespace-nowrap"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      <span>Connect to Chat</span>
                    </button>
                  )}
              </div>
            ) : (
              <form
                onSubmit={handleSend}
                className="p-3 sm:px-4 border-t border-white/[0.08] flex items-end gap-2 bg-[#0E1424]"
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach photo or video"
                  aria-label="Attach photo or video"
                  className="w-10 h-10 rounded-xl bg-[#171F35] hover:bg-[#1E2945] text-slate-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${currentConv.partnerName}...`}
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#151C2F] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none max-h-[120px] leading-snug"
                />

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !attachedMedia) || uploadProgress !== null}
                  className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 disabled:hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/25 transition-colors flex-shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
};
