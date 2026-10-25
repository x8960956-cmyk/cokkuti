import React, { useState, useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Mic,
  Paperclip,
  Link,
  BarChart2,
  Calendar,
  DollarSign,
  Send,
  Sparkles,
  Flame,
  Search,
  Camera,
  Film,
  Trash2,
  Plus,
  Upload,
} from 'lucide-react';
import { Post, User } from '../types';
import { currentUser as fallbackUser } from '../data/mockData';
import { PostCard } from './PostCard';
import { ShareItem } from './ShareModal';
import { StoriesBar } from './StoriesBar';

interface FeedProps {
  currentUser?: User;
  posts: Post[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onRepost: (postId: string) => void;
  onShare: (item: ShareItem) => void;
  onDelete?: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onOpenCreateModal: (defaultType?: string) => void;
  onOpenRaiseFundsModal: () => void;
  onViewStartup: (startupName: string) => void;
  searchFilter?: string;
  onClearSearch?: () => void;
  onDirectPost?: (postData: any) => void;
}

export const Feed: React.FC<FeedProps> = ({
  currentUser: currentUserProp,
  posts,
  activeFilter,
  setActiveFilter,
  onLike,
  onSave,
  onRepost,
  onShare,
  onDelete,
  onAddComment,
  onOpenCreateModal,
  onOpenRaiseFundsModal,
  onViewStartup,
  searchFilter,
  onClearSearch,
  onDirectPost,
}) => {
  const user = currentUserProp || fallbackUser;
  const [quickText, setQuickText] = useState('');
  const [mediaList, setMediaList] = useState<{ url: string; type: 'image' | 'video'; name: string }[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const filterTabs = [
    'For You',
    'Following',
    'Trending',
    'New Ideas',
    'Startups',
    'Opportunities',
    'Let Them Cook',
  ];

  // Handle Photo files picked directly from computer
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaList(prev => [
            ...prev,
            {
              type: 'image',
              url: event.target!.result as string,
              name: file.name,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Video file picked directly from computer
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setMediaList(prev => [
          ...prev,
          {
            type: 'video',
            url: event.target!.result as string,
            name: file.name,
          },
        ]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim() && mediaList.length === 0) {
      onOpenCreateModal();
      return;
    }

    if (onDirectPost) {
      setIsPosting(true);
      const isVideo = mediaList.some(m => m.type === 'video');
      onDirectPost({
        content: quickText.trim() || 'Shared media update',
        type: isVideo ? 'video' : 'post',
        tags: ['#COOK', '#Startups', '#BuildingInPublic'],
        media: mediaList.length > 0 ? mediaList.map(m => ({ type: m.type, url: m.url, caption: m.name })) : undefined,
      });
      setQuickText('');
      setMediaList([]);
      setIsPosting(false);
    } else {
      onOpenCreateModal();
    }
  };

  return (
    <section className="flex-1 max-w-3xl space-y-5 pb-16">
      {/* 24-Hour Stories Bar */}
      <StoriesBar currentUser={user} />

      {/* Hidden file pickers for computer photo & video upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePhotoSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/*"
        className="hidden"
        onChange={handleVideoSelect}
      />

      {/* Search active banner */}
      {searchFilter && (
        <div className="bg-[#13192B] border border-indigo-500/40 rounded-2xl p-3 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#FF5E1E]" />
            <span>
              Searching for: <strong className="text-[#FF5E1E]">"{searchFilter}"</strong>
            </span>
          </div>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Composer Card: What's cooking today? */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 sm:p-5 shadow-lg">
        <form onSubmit={handleQuickPostSubmit}>
          <div className="flex items-start gap-3 mb-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border border-indigo-500/40 mt-1 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";
              }}
            />
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">
                What's cooking today?
              </h3>
              <p className="text-xs text-gray-400 mb-2">
                Share an idea, startup pitch, prototype video, question, or story...
              </p>
              <textarea
                rows={mediaList.length > 0 ? 3 : 2}
                value={quickText}
                onChange={e => setQuickText(e.target.value)}
                placeholder="Got an idea? Type here or choose photos/video from your computer to let it cook..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#0B0F19] border border-[#1F293D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5E1E] transition resize-none"
              />
            </div>
          </div>

          {/* Attached Media Previews inside Feed Composer */}
          {mediaList.length > 0 && (
            <div className="mb-3 p-3 bg-[#0B0F19] rounded-xl border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-300">
                  Ready to post from this computer ({mediaList.length}):
                </span>
                <button
                  type="button"
                  onClick={() => setMediaList([])}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mediaList.map((m, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-gray-700 bg-black group">
                    {m.type === 'video' ? (
                      <video src={m.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaList(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-80 hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] text-white truncate max-w-[85%]">
                      {m.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Buttons & Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1F293D]/70">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Photo directly from computer */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-[#0B0F19] hover:bg-white/5 border border-gray-800 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
                title="Select photo from this computer"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Photo from PC</span>
              </button>

              {/* Video directly from computer */}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-[#0B0F19] hover:bg-white/5 border border-gray-800 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
                title="Select video from this computer"
              >
                <Film className="w-3.5 h-3.5 text-rose-400" />
                <span>Video from PC</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCreateModal('poll')}
                className="px-2.5 py-1.5 rounded-lg bg-[#0B0F19] hover:bg-white/5 border border-gray-800 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Poll</span>
              </button>

              <button
                type="button"
                onClick={onOpenRaiseFundsModal}
                className="px-2.5 py-1.5 rounded-lg bg-[#FF5E1E]/15 hover:bg-[#FF5E1E]/25 border border-[#FF5E1E]/30 text-[#FF5E1E] text-xs font-bold flex items-center gap-1.5 transition"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Raise Funds</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isPosting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer active:scale-95"
            >
              <span>{isPosting ? 'Posting...' : 'Post to Feed'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Feed Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {filterTabs.map(tab => {
          const isActive = activeFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-500/30 font-bold'
                  : 'bg-[#13192B] border border-[#1F293D] text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              {tab === 'Let Them Cook' && <Flame className="w-3 h-3 inline mr-1 text-[#FF5E1E]" />}
              {tab}
            </button>
          );
        })}
      </div>

      {/* Posts Stream */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">Nothing cooking in this filter yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Be the first to share a breakthrough idea, startup pitch, or project update with the COOK community.
            </p>
            <button
              onClick={() => onOpenCreateModal()}
              className="py-2 px-4 rounded-xl bg-[#6366F1] text-white text-xs font-semibold"
            >
              Start Cooking Now
            </button>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={onLike}
              onSave={onSave}
              onRepost={onRepost}
              onShare={onShare}
              onDelete={onDelete}
              onAddComment={onAddComment}
              onFilterTag={tag => setActiveFilter('Startups')}
              onViewStartup={onViewStartup}
            />
          ))
        )}
      </div>
    </section>
  );
};
