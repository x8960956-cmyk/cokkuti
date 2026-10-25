import React, { useState, useRef } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  X,
  Upload,
  Bookmark,
  ShieldCheck,
  Flame,
  Send,
  Eye,
  Plus,
} from 'lucide-react';
import { Clip } from '../types';
import { ShareItem } from './ShareModal';

interface CookClipsProps {
  clips: Clip[];
  onClose: () => void;
  onShare: (item: ShareItem) => void;
  onUploadClip: (clip: Partial<Clip>) => void;
}

export const CookClips: React.FC<CookClipsProps> = ({
  clips,
  onClose,
  onShare,
  onUploadClip,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({ 'clip-1': true });
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const [comments, setComments] = useState<string[]>([
    'Insane breakdown! The 2nd viral loop is pure gold.',
    'Sharing this with my co-founder right now.',
    'Could you do a follow up on enterprise B2B sales cycles?',
  ]);
  const [commentInput, setCommentInput] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newUrl, setNewUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [localVideoName, setLocalVideoName] = useState<string | null>(null);
  const [localVideoSize, setLocalVideoSize] = useState<string | null>(null);

  const clipFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const currentClip = clips[currentIndex] || clips[0];

  const handleClipFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalVideoName(file.name);
    setLocalVideoSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (currentIndex < clips.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(clips.length - 1);
    }
  };

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartYRef.current - touchEndY;
    // Minimum 45px swipe threshold
    if (deltaY > 45) {
      // Swiped UP -> Next Clip
      handleNext();
    } else if (deltaY < -45) {
      // Swiped DOWN -> Previous Clip
      handlePrev();
    }
    touchStartYRef.current = null;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleLike = (id: string) => {
    setLikedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFollow = (creator: string) => {
    setFollowedMap(prev => ({ ...prev, [creator]: !prev[creator] }));
  };

  const handleShareCurrentClip = () => {
    onShare({
      id: currentClip.id,
      type: 'clip',
      title: currentClip.title,
      description: currentClip.description,
      imageUrl: currentClip.creator.avatar,
      authorName: currentClip.creator.name,
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setComments([commentInput.trim(), ...comments]);
    setCommentInput('');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onUploadClip({
      title: newTitle,
      description: newDescription,
      videoUrl: newUrl,
      tags: ['#COOKClips', '#Startups'],
    });
    setShowUploadModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-extrabold text-xs">
            <Flame className="w-3.5 h-3.5 text-[#FF5E1E] fill-[#FF5E1E]" />
            <span>COOK CLIPS</span>
          </div>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">
            Vertical Startup & Creator Shorts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 rounded-full bg-[#FF5E1E] hover:bg-[#ff6d31] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/25 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Clip</span>
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Vertical Video Frame with Mobile Swipe Gesture support */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-[440px] h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl flex items-center justify-center touch-pan-y"
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={currentClip.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onClick={togglePlay}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Play/Pause Overlay indicator when paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-black/70 border border-white/30 flex items-center justify-center text-white">
              <Play className="w-8 h-8 fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Sound Toggle */}
        <button
          onClick={toggleMute}
          className="absolute top-16 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Right Floating Actions (Like, Comment, Save, Share) */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4">
          {/* Creator Avatar with follow plus */}
          <div className="relative mb-2">
            <img
              src={currentClip.creator.avatar}
              alt={currentClip.creator.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-[#FF5E1E]"
            />
            <button
              onClick={() => toggleFollow(currentClip.creator.name)}
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                followedMap[currentClip.creator.name] ? 'bg-emerald-500' : 'bg-[#FF5E1E]'
              }`}
            >
              {followedMap[currentClip.creator.name] ? '✓' : '+'}
            </button>
          </div>

          {/* Like */}
          <button
            onClick={() => toggleLike(currentClip.id)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white border border-white/15 transition group-active:scale-90">
              <Heart
                className={`w-5 h-5 ${
                  likedMap[currentClip.id] ? 'fill-rose-500 text-rose-500' : 'text-white'
                }`}
              />
            </div>
            <span className="text-[11px] font-bold text-white shadow-sm">
              {currentClip.likes + (likedMap[currentClip.id] ? 1 : 0)}
            </span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowCommentSheet(true)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white border border-white/15 transition">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-white shadow-sm">
              {currentClip.commentsCount + comments.length}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={handleShareCurrentClip}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white border border-white/15 transition">
              <Share2 className="w-5 h-5 text-[#FF5E1E]" />
            </div>
            <span className="text-[11px] font-bold text-white shadow-sm">
              {currentClip.sharesCount}
            </span>
          </button>

          {/* Views count */}
          <div className="flex flex-col items-center text-[10px] text-gray-300 font-bold">
            <Eye className="w-3.5 h-3.5 mb-0.5" />
            <span>{currentClip.views}</span>
          </div>
        </div>

        {/* Bottom Content Metadata Overlay */}
        <div className="absolute left-0 right-16 bottom-4 z-20 p-4 text-left space-y-2 pointer-events-auto bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-sm drop-shadow">{currentClip.creator.name}</h4>
            {currentClip.creator.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
            <button
              onClick={() => toggleFollow(currentClip.creator.name)}
              className="text-[11px] font-semibold text-indigo-300 hover:text-white"
            >
              {followedMap[currentClip.creator.name] ? 'Following' : '• Follow'}
            </button>
          </div>

          <p className="text-xs font-semibold text-white leading-snug drop-shadow">
            {currentClip.title}
          </p>

          <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed drop-shadow">
            {currentClip.description}
          </p>

          <div className="flex flex-wrap gap-1 pt-0.5">
            {currentClip.tags.map(t => (
              <span key={t} className="text-[10px] font-semibold text-indigo-400">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Mobile Swipe Hint & Quick Nav Controls */}
        <div className="sm:hidden absolute right-3 top-20 z-30 flex flex-col gap-2">
          <button
            onClick={handlePrev}
            aria-label="Previous clip"
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-95 transition"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next clip"
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-95 transition"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Up / Down Navigation Floaters for Desktop */}
        <div className="hidden sm:flex flex-col gap-2 absolute -right-16 top-1/2 -translate-y-1/2 z-30">
          <button
            onClick={handlePrev}
            aria-label="Previous clip"
            className="w-10 h-10 rounded-full bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white flex items-center justify-center transition shadow-lg hover:scale-105 active:scale-95"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next clip"
            className="w-10 h-10 rounded-full bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white flex items-center justify-center transition shadow-lg hover:scale-105 active:scale-95"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Slide-over Comments Sheet */}
      {showCommentSheet && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 bg-[#13192B] border-l border-gray-800 p-4 flex flex-col shadow-2xl animate-in slide-in-from-right">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <h3 className="font-bold text-white text-sm">Comments ({comments.length})</h3>
            <button
              onClick={() => setShowCommentSheet(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {comments.map((comm, idx) => (
              <div key={idx} className="p-3 bg-[#0B0F19] rounded-xl border border-gray-800 text-xs">
                <span className="font-bold text-indigo-300 block mb-1">Founder Community</span>
                <p className="text-gray-200">{comm}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="pt-3 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="Add your thought to this clip..."
              className="flex-1 px-3 py-2 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Upload Clip Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#13192B] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base">Upload a COOK Clip</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Clip Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. 3 Viral Growth Loops for AI Startups"
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Description & Hashtags</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="What's this clip about? #startups #mvp #cook"
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#FF5E1E]"
                />
              </div>

              {/* Computer Video File Picker */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">
                  Select Video from this Computer (MP4, WebM) *
                </label>
                <input
                  ref={clipFileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/*"
                  className="hidden"
                  onChange={handleClipFileSelect}
                />
                
                <button
                  type="button"
                  onClick={() => clipFileInputRef.current?.click()}
                  className="w-full p-4 rounded-2xl bg-[#0B0F19] border-2 border-dashed border-gray-700 hover:border-[#FF5E1E] text-center transition flex flex-col items-center justify-center gap-1 group active:scale-98"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF5E1E]/15 text-[#FF5E1E] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white mt-1">
                    {localVideoName ? 'Change Video File' : 'Click to Browse from Computer'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {localVideoName ? `${localVideoName} (${localVideoSize})` : 'MP4, WebM or MOV video up to 50MB'}
                  </span>
                </button>
              </div>

              {/* Video Preview if selected */}
              {newUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-800 bg-black aspect-[9/12] max-h-48 flex items-center justify-center relative">
                  <video src={newUrl} controls className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-emerald-400">
                    Preview Ready
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF5E1E] hover:bg-[#ff6d31] text-white font-bold shadow-md shadow-orange-500/20 active:scale-95"
                >
                  Publish Clip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
