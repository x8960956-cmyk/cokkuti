import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, MessageSquare, Send, Trash2, Heart, ShieldCheck, Pause, Play } from 'lucide-react';
import { Story, StoryComment, User } from '../types';

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onStoryDeleted?: (storyId: string) => void;
  onCommentAdded?: (storyId: string, comment: StoryComment) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex = 0,
  isOpen,
  onClose,
  currentUser,
  onStoryDeleted,
  onCommentAdded,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timerRef = useRef<any>(null);
  const touchStartXRef = useRef<number>(0);

  const activeStory = stories[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  // Mark story as viewed on backend
  useEffect(() => {
    if (activeStory && isOpen) {
      fetch(`/api/stories/${activeStory.id}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [currentIndex, isOpen, activeStory?.id]);

  // 5-second automatic progression
  useEffect(() => {
    if (!isOpen || isPaused || commentsOpen || !activeStory) return;

    const intervalMs = 50;
    const step = (intervalMs / 5000) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentIndex, isPaused, commentsOpen, activeStory]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || !activeStory) return null;

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/stories/${activeStory.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newCommentText.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        if (onCommentAdded) {
          onCommentAdded(activeStory.id, data.comment);
        }
        if (!activeStory.comments) activeStory.comments = [];
        activeStory.comments.push(data.comment);
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Failed to post story comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/stories/${activeStory.id}`, { method: 'DELETE' });
      if (onStoryDeleted) {
        onStoryDeleted(activeStory.id);
      }
      if (stories.length <= 1) {
        onClose();
      } else {
        handleNext();
      }
    } catch (err) {
      console.error('Failed to delete story:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (deltaX < -50) handleNext();
    else if (deltaX > 50) handlePrev();
  };

  const isOwner =
    activeStory.userId === currentUser.id ||
    activeStory.userUsername === currentUser.username ||
    activeStory.userId === 'me';

  const timeAgoString = (timestamp: number) => {
    const diffHours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    return `${diffHours}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in select-none">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container */}
      <div
        className="relative z-10 w-full max-w-[430px] h-[92vh] max-h-[820px] bg-[#0B0F19] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
      >
        {/* Top Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3 pt-3.5 flex items-center gap-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {stories.map((s, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const barWidth = isCompleted ? 100 : isCurrent ? progress : 0;

            return (
              <div key={s.id} className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top User Info Bar */}
        <div className="absolute top-6 left-0 right-0 z-20 px-4 py-2 flex items-center justify-between text-white bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#FF5E1E] to-[#6366F1]">
              <img
                src={activeStory.userAvatar}
                alt={activeStory.userName}
                className="w-9 h-9 rounded-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs sm:text-sm text-white">{activeStory.userName}</span>
                {activeStory.userVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
              </div>
              <span className="text-[11px] text-gray-300">
                @{activeStory.userUsername} • {timeAgoString(activeStory.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={handleDeleteStory}
                disabled={isDeleting}
                title="Delete your story"
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-rose-600/80 text-gray-300 hover:text-white flex items-center justify-center transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-white/20 text-white flex items-center justify-center transition"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Content Display */}
        <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {activeStory.mediaType === 'video' ? (
            <video
              src={activeStory.mediaUrl}
              autoPlay
              playsInline
              loop
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={activeStory.mediaUrl}
              alt={activeStory.caption || 'Story'}
              className="w-full h-full object-cover"
            />
          )}

          {/* Left/Right Click Areas to Navigate */}
          <div
            className="absolute left-0 top-16 bottom-20 w-1/3 z-10 cursor-pointer"
            onClick={handlePrev}
          />
          <div
            className="absolute right-0 top-16 bottom-20 w-1/3 z-10 cursor-pointer"
            onClick={handleNext}
          />

          {/* Caption Overlay */}
          {activeStory.caption && (
            <div className="absolute bottom-20 left-4 right-4 z-20 bg-black/70 backdrop-blur-md px-4 py-3 rounded-2xl text-center text-xs sm:text-sm text-white font-medium border border-white/10 shadow-lg">
              {activeStory.caption}
            </div>
          )}
        </div>

        {/* Bottom Story Action & Comment Bar */}
        <div className="relative z-20 px-4 py-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setCommentsOpen(!commentsOpen);
              setIsPaused(true);
            }}
            className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs text-gray-200 transition"
          >
            <span className="truncate">Reply or comment on story...</span>
            <div className="flex items-center gap-1 text-white font-bold ml-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#FF5E1E]" />
              <span className="text-[11px]">{activeStory.comments?.length || 0}</span>
            </div>
          </button>
        </div>

        {/* Comments Sliding Drawer */}
        {commentsOpen && (
          <div className="absolute inset-x-0 bottom-0 top-24 z-30 bg-[#0B0F19]/95 backdrop-blur-xl border-t border-[#1F293D] rounded-t-3xl flex flex-col p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#FF5E1E]" />
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  Story Comments ({activeStory.comments?.length || 0})
                </h4>
              </div>
              <button
                onClick={() => {
                  setCommentsOpen(false);
                  setIsPaused(false);
                }}
                className="w-7 h-7 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {activeStory.comments && activeStory.comments.length > 0 ? (
                activeStory.comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <img
                      src={c.author.avatar}
                      alt={c.author.name}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 bg-[#13192B] border border-gray-800 p-2.5 rounded-2xl">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-[11px] text-white">{c.author.name}</span>
                        <span className="text-[9px] text-gray-500">{c.createdAt}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-gray-500">
                  No comments yet on this story. Be the first to reply!
                </div>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="pt-2 border-t border-[#1F293D] flex items-center gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3.5 py-2 text-xs bg-[#13192B] border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5E1E]"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim() || isSubmittingComment}
                className="w-8 h-8 rounded-full bg-[#FF5E1E] text-white flex items-center justify-center disabled:opacity-40 transition active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* External Desktop Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white items-center justify-center transition active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white items-center justify-center transition active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
