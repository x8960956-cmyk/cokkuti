import React, { useState, useRef } from 'react';
import {
  Search,
  Send,
  Phone,
  Video,
  Mic,
  Paperclip,
  Smile,
  ShieldCheck,
  MoreVertical,
  CheckCheck,
  Check,
  Flame,
  ArrowLeft,
  Image as ImageIcon,
  Film,
  X,
} from 'lucide-react';
import { Message } from '../types';
import { currentUser } from '../data/mockData';

interface MessagingCenterProps {
  messages: Message[];
  onSendMessage: (text: string, isVoiceNote?: boolean, mediaUrl?: string) => void;
  onStartCall: (partnerName: string, partnerAvatar: string, type: 'voice' | 'video') => void;
  selectedPartner?: string;
}

export const MessagingCenter: React.FC<MessagingCenterProps> = ({
  messages,
  onSendMessage,
  onStartCall,
  selectedPartner = 'Sarah Ahmed',
}) => {
  const [activeConversationId, setActiveConversationId] = useState('conv-1');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversations = [
    {
      id: 'conv-1',
      partnerName: 'Sarah Ahmed',
      partnerRole: 'Product Designer | Creative Thinker',
      partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      lastMessage: 'Sounds great! Ready whenever you hit the call button.',
      timestamp: '10:48 AM',
      unreadCount: 0,
      online: true,
    },
    {
      id: 'conv-2',
      partnerName: 'Elena Rostova',
      partnerRole: 'Partner @ Horizon Seed Capital',
      partnerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      lastMessage: 'Reviewed your pitch deck for TechNova. Can you share the unit economics?',
      timestamp: 'Yesterday',
      unreadCount: 2,
      online: false,
    },
    {
      id: 'conv-3',
      partnerName: 'David Kim',
      partnerRole: 'Founder @ MedlAI',
      partnerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      lastMessage: 'Sent over the revised co-founder vesting agreement.',
      timestamp: 'Oct 22',
      unreadCount: 0,
      online: true,
    },
  ];

  const currentConv = conversations.find(c => c.id === activeConversationId) || conversations[0];

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachedMedia({
          url: event.target.result as string,
          type: isVideo ? 'video' : 'image',
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedMedia) return;

    const text = inputText.trim() || (attachedMedia ? `Sent ${attachedMedia.type}: ${attachedMedia.name}` : '');
    onSendMessage(text, false, attachedMedia?.url);
    setInputText('');
    setAttachedMedia(null);
  };

  const handleVoiceNoteClick = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        onSendMessage('🎙️ Voice Note (0:14) • Shared product vision', true);
      }, 2500);
    }
  };

  return (
    <div className="flex-1 max-w-5xl h-[calc(100vh-7.5rem)] sm:h-[calc(100vh-8.5rem)] flex rounded-2xl bg-[#13192B] border border-[#1F293D] shadow-2xl overflow-hidden relative">
      {/* Hidden File Picker for computer attachment */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileAttach}
      />

      {/* Left Conversations Sidebar (hidden on mobile when chat is open) */}
      <div
        className={`w-full sm:w-80 border-r border-[#1F293D] flex flex-col bg-[#0B0F19]/60 ${
          mobileShowChat ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <div className="p-3.5 sm:p-4 border-b border-[#1F293D]">
          <h2 className="font-bold text-white text-sm sm:text-base mb-2.5 flex items-center justify-between">
            <span>Conversations</span>
            <span className="text-[10px] font-semibold text-[#FF5E1E] bg-[#FF5E1E]/10 px-2 py-0.5 rounded-full">
              Live P2P
            </span>
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats or founders..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#13192B] border border-[#1F293D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* List of Contacts */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-800/40">
          {conversations.map(conv => {
            const isSelected = activeConversationId === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  setMobileShowChat(true);
                }}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition active:scale-98 ${
                  isSelected ? 'bg-indigo-600/15 border-l-4 border-indigo-500' : 'hover:bg-white/5'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={conv.partnerAvatar}
                    alt={conv.partnerName}
                    className="w-11 h-11 rounded-full object-cover border border-gray-800"
                  />
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0B0F19]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-bold text-white text-xs truncate">{conv.partnerName}</h4>
                    <span className="text-[10px] text-gray-500">{conv.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#FF5E1E] text-white text-[10px] font-bold flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Active Chat Pane (full width on mobile when active) */}
      <div
        className={`flex-1 flex flex-col bg-[#13192B] ${
          !mobileShowChat ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Chat Header */}
        <div className="p-3 sm:p-4 border-b border-[#1F293D] flex items-center justify-between bg-[#0B0F19]/40">
          <div className="flex items-center gap-2.5">
            {/* Mobile Back Button */}
            <button
              onClick={() => setMobileShowChat(false)}
              className="sm:hidden p-1.5 -ml-1 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative">
              <img
                src={currentConv.partnerAvatar}
                alt={currentConv.partnerName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-indigo-500/40"
              />
              {currentConv.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#13192B]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-white text-xs sm:text-sm">{currentConv.partnerName}</h3>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="truncate max-w-[140px] sm:max-w-xs">{currentConv.partnerRole}</span>
              </p>
            </div>
          </div>

          {/* Quick Voice / Video Call Trigger Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => onStartCall(currentConv.partnerName, currentConv.partnerAvatar, 'voice')}
              title="Start Voice Call"
              className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-indigo-600 text-gray-300 hover:text-white flex items-center justify-center transition shadow-md active:scale-95"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStartCall(currentConv.partnerName, currentConv.partnerAvatar, 'video')}
              title="Start Video Call"
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white flex items-center justify-center transition shadow-md shadow-indigo-600/30 active:scale-95"
            >
              <Video className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!msg.isMe && (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover flex-shrink-0 mb-1"
                />
              )}
              <div
                className={`max-w-[85%] sm:max-w-md p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.isMe
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs shadow-md'
                    : 'bg-[#0B0F19] text-gray-200 border border-gray-800 rounded-bl-xs'
                }`}
              >
                {/* Media Attachment if present */}
                {msg.mediaUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-white/10 bg-black">
                    {msg.mediaUrl.startsWith('data:video') || msg.mediaUrl.endsWith('.mp4') ? (
                      <video src={msg.mediaUrl} controls className="w-full max-h-56 object-cover" />
                    ) : (
                      <img src={msg.mediaUrl} alt="Attached" className="w-full max-h-56 object-cover" />
                    )}
                  </div>
                )}

                {msg.isVoiceNote ? (
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      🎙️
                    </span>
                    <div>
                      <p className="font-semibold">{msg.content}</p>
                      <div className="flex gap-1 items-center mt-1">
                        {[20, 50, 80, 40, 90, 60, 30].map((h, i) => (
                          <span
                            key={i}
                            className="w-1 bg-white/60 rounded-full"
                            style={{ height: `${h / 4}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}

                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    msg.isMe ? 'text-indigo-200' : 'text-gray-500'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.isMe && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                </div>
              </div>
            </div>
          ))}

          {isRecording && (
            <div className="flex items-center gap-2 text-xs text-[#FF5E1E] bg-[#FF5E1E]/10 p-2.5 rounded-xl border border-[#FF5E1E]/30 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E1E] animate-ping" />
              <span>Recording voice note... Release or tap to send</span>
            </div>
          )}
        </div>

        {/* Attached preview bar before sending */}
        {attachedMedia && (
          <div className="px-4 py-2 bg-[#0B0F19] border-t border-gray-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                {attachedMedia.type === 'video' ? '🎬' : '📷'}
              </span>
              <span className="text-white truncate max-w-xs">{attachedMedia.name}</span>
            </div>
            <button
              onClick={() => setAttachedMedia(null)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message Input Bar */}
        <form onSubmit={handleSend} className="p-2.5 sm:p-3 border-t border-[#1F293D] flex items-center gap-1.5 sm:gap-2 bg-[#0B0F19]/40">
          {/* Upload Photo/Video from Computer Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach photo or video from computer"
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition active:scale-95"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleVoiceNoteClick}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-95 ${
              isRecording ? 'bg-[#FF5E1E] text-white animate-pulse' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            title="Record voice note"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type a message... (or attach photo/video from computer)"
            className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#0B0F19] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer active:scale-95"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
