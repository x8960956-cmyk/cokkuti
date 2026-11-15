import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Repeat2,
  Bookmark,
  Share2,
  MoreHorizontal,
  ShieldCheck,
  Globe,
  DollarSign,
  Briefcase,
  Users,
  Copy,
  Trash2,
  Edit3,
  Flag,
  Send,
  ExternalLink,
  Flame,
  BarChart2,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Post } from '../types';
import { ShareItem } from './ShareModal';
import { VideoPlayer } from './VideoPlayer';
import { formatDuration } from '../utils/mediaUpload';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onRepost: (postId: string) => void;
  onShare: (item: ShareItem) => void;
  onDelete?: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onVideoView?: (postId: string, completed?: boolean) => void;
  onFilterTag?: (tag: string) => void;
  onViewStartup?: (startupName: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onSave,
  onRepost,
  onShare,
  onDelete,
  onAddComment,
  onVideoView,
  onFilterTag,
  onViewStartup,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [selectedPollOption, setSelectedPollOption] = useState<number | undefined>(post.poll?.userVote);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const isVideoPost = post.type === 'video' || Boolean(post.media?.some(m => m.type === 'video'));
  const viewsCount = post.viewsCount || 0;
  const watchCompletions = post.watchCompletions || 0;
  const totalInteractions =
    (post.likes || 0) +
    (post.comments?.length || 0) +
    (post.reposts || 0) +
    (post.saves || 0) +
    (post.shareCount || 0);
  const engagementRate =
    viewsCount > 0 ? ((totalInteractions / viewsCount) * 100).toFixed(1) : '0.0';

  const handleShareClick = () => {
    onShare({
      id: post.id,
      type: post.startupDetails ? 'startup' : 'post',
      title: post.title || `${post.author.name}'s Post on COOK`,
      description: post.content,
      imageUrl: post.media?.[0]?.url,
      authorName: post.author.name,
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(post.id, commentInput.trim());
    setCommentInput('');
  };

  return (
    <article className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 sm:p-5 shadow-lg relative transition-all hover:border-gray-700/80">
      {/* Post Header */}
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-indigo-500/40"
            />
            {post.author.verified && (
              <ShieldCheck className="w-4 h-4 text-blue-400 absolute -bottom-0.5 -right-0.5 bg-[#13192B] rounded-full" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base hover:text-indigo-300 cursor-pointer transition truncate">
                {post.author.name}
              </h3>
              <span className="text-xs text-gray-500 flex-shrink-0">•</span>
              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{post.timestamp}</span>
              <Globe className="w-3 h-3 text-gray-500 flex-shrink-0 hidden sm:inline" />
            </div>
            <p className="text-xs text-gray-400 truncate">{post.author.role}</p>
          </div>
        </div>

        {/* Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 rounded-xl bg-[#0B0F19] border border-[#1F293D] shadow-2xl p-1.5 z-30 text-xs animate-in fade-in">
              <button
                onClick={() => {
                  handleShareClick();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Share Post</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(post.content);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copy Text</span>
              </button>
              {onDelete && currentUserId && post.author.id === currentUserId && (
                <button
                  onClick={() => {
                    onDelete(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              )}
              <button
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {post.title && <h2 className="text-base sm:text-lg font-bold text-white mb-2">{post.title}</h2>}
        <p className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-line">
          {post.content}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {post.tags.map(tag => (
              <button
                key={tag}
                onClick={() => onFilterTag && onFilterTag(tag)}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Startup Pitch Details Card if this is a startup post */}
      {post.startupDetails && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-xl bg-[#0B0F19] border border-indigo-500/30 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-[#FF5E1E] flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                {post.startupDetails.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm truncate">{post.startupDetails.name}</h4>
                <p className="text-[11px] text-gray-400 truncate">{post.startupDetails.tagline}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                {post.startupDetails.stage}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                {post.startupDetails.industry}
              </span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-[#13192B] rounded-lg border border-gray-800 text-center text-xs">
            {post.startupDetails.fundingGoal && (
              <div>
                <span className="text-[10px] text-gray-500 block">Funding Goal</span>
                <span className="font-extrabold text-white text-sm text-[#FF5E1E]">
                  {post.startupDetails.fundingGoal}
                </span>
              </div>
            )}
            {post.startupDetails.equityOffered && (
              <div>
                <span className="text-[10px] text-gray-500 block">Equity Offered</span>
                <span className="font-extrabold text-white text-sm">{post.startupDetails.equityOffered}</span>
              </div>
            )}
            {post.startupDetails.runway && (
              <div>
                <span className="text-[10px] text-gray-500 block">Runway</span>
                <span className="font-extrabold text-white text-sm">{post.startupDetails.runway}</span>
              </div>
            )}
            {post.startupDetails.amountRaised && (
              <div>
                <span className="text-[10px] text-gray-500 block">Raised to Date</span>
                <span className="font-extrabold text-emerald-400 text-sm">{post.startupDetails.amountRaised}</span>
              </div>
            )}
          </div>

          {/* Team Needed Tags */}
          {post.startupDetails.teamNeeded && (
            <div className="flex items-center gap-2 text-xs">
              <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 text-[11px]">Team Needed:</span>
              <div className="flex flex-wrap gap-1">
                {post.startupDetails.teamNeeded.map(role => (
                  <span
                    key={role}
                    className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-gray-700 text-gray-300"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Startup Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => onViewStartup && onViewStartup(post.startupDetails!.name)}
              className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              View Startup
            </button>
            <button
              onClick={() => onViewStartup && onViewStartup(post.startupDetails!.name)}
              className="py-1.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
            >
              Support Idea
            </button>
            <button
              onClick={handleShareClick}
              className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium flex items-center gap-1.5 transition ml-auto"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Startup</span>
            </button>
          </div>
        </div>
      )}

      {/* Media Attachments */}
      {post.media && post.media.length > 0 && (
        <div className="mb-4 rounded-2xl overflow-hidden border border-gray-800 bg-[#0B0F19]">
          {post.media[0].type === 'video' ? (
            <VideoPlayer
              src={post.media[0].url}
              caption={post.media[0].caption || post.title}
              viewsCount={viewsCount}
              initialDurationSeconds={post.videoDurationSeconds}
              onFirstPlay={() => onVideoView?.(post.id, false)}
              onWatchComplete={() => onVideoView?.(post.id, true)}
            />
          ) : (
            <div
              className={`grid gap-1.5 ${
                post.media.length === 1
                  ? 'grid-cols-1'
                  : post.media.length === 2
                  ? 'grid-cols-2'
                  : post.media.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-4'
              }`}
            >
              {post.media.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxImage(img.url)}
                  className="relative aspect-[4/3] overflow-hidden group cursor-pointer bg-slate-900"
                >
                  <img
                    src={img.url}
                    alt={img.caption || `Post media ${idx}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      // Fallback gradient if URL is slow or blocked
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-gradient-to-br', 'from-indigo-900/50', 'to-slate-900');
                    }}
                  />
                  {post.media && post.media.length > 1 && idx === 0 && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/75 text-white backdrop-blur-sm">
                      1/{post.media.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal for Full Image Inspection */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxImage} alt="Enlarged" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black/80 border border-white/20 text-white flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Poll Component */}
      {post.poll && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#0B0F19] border border-[#1F293D] space-y-2">
          <p className="text-xs font-bold text-white mb-2">{post.poll.question}</p>
          <div className="space-y-1.5">
            {post.poll.options.map((option, idx) => {
              const isSelected = selectedPollOption === idx;
              const percent = Math.round((option.votes / (post.poll?.totalVotes || 1)) * 100);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedPollOption(idx)}
                  className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium relative overflow-hidden transition ${
                    isSelected
                      ? 'border-[#FF5E1E] bg-[#FF5E1E]/10 text-white'
                      : 'border-gray-800 bg-[#13192B] text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-indigo-500/20 -z-0"
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative z-10 flex items-center justify-between">
                    <span>{option.text}</span>
                    <span className="font-bold text-[11px] text-gray-400">{percent}%</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 text-right mt-1">
            {post.poll.totalVotes} total votes
          </p>
        </div>
      )}

      {/* Engagement Counts Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400 py-2 border-y border-[#1F293D]/70 mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center -space-x-1">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center text-[10px]">
                ❤️
              </span>
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px]">
                🔥
              </span>
            </div>
            <span>{post.likes}</span>
          </div>
          {isVideoPost && (
            <span className="flex items-center gap-1 text-gray-300 font-medium">
              <Eye className="w-3.5 h-3.5 text-[#FF5E1E]" />
              <span>{viewsCount} views</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowComments(!showComments)}
            className="hover:text-white transition"
          >
            {post.comments.length} comments
          </button>
          <span>•</span>
          <span>{post.reposts} reposts</span>
          <span>•</span>
          <span>{post.shareCount || 0} shares</span>
          {isVideoPost && (
            <>
              <span>•</span>
              <button
                type="button"
                onClick={() => setShowMetrics(!showMetrics)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold transition ${
                  showMetrics
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-[#0B0F19] border-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3 h-3 text-indigo-400" />
                <span>Metrics</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expandable Real Video Engagement Metrics Card */}
      {isVideoPost && showMetrics && (
        <div className="mb-3 p-3.5 rounded-xl bg-[#0B0F19] border border-indigo-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-[#FF5E1E]" />
              <span>Video Engagement Analytics (Real Data)</span>
            </span>
            {post.videoDurationSeconds ? (
              <span className="text-[11px] font-mono text-gray-400">
                Duration {formatDuration(post.videoDurationSeconds)}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-[#13192B] border border-gray-800">
              <span className="text-[10px] text-gray-400 block">Total Views</span>
              <span className="text-sm font-extrabold text-white">{viewsCount.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#13192B] border border-gray-800">
              <span className="text-[10px] text-gray-400 block">Engagement Rate</span>
              <span className="text-sm font-extrabold text-emerald-400">{engagementRate}%</span>
            </div>
            <div className="p-2 rounded-lg bg-[#13192B] border border-gray-800">
              <span className="text-[10px] text-gray-400 block">Full Watches</span>
              <span className="text-sm font-extrabold text-indigo-300 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{watchCompletions}</span>
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[#13192B] border border-gray-800">
              <span className="text-[10px] text-gray-400 block">Saves & Shares</span>
              <span className="text-sm font-extrabold text-[#FF5E1E]">
                {(post.saves || 0) + (post.shareCount || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between gap-1 text-xs font-semibold text-gray-400 pt-1">
        <button
          onClick={() => onLike(post.id)}
          aria-label="Like"
          className={`min-h-[38px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
            post.likedByMe
              ? 'text-rose-500 bg-rose-500/10'
              : 'hover:text-white hover:bg-white/5'
          }`}
        >
          <Heart className={`w-4 h-4 flex-shrink-0 ${post.likedByMe ? 'fill-rose-500' : ''}`} />
          <span className="hidden min-[420px]:inline">Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          aria-label="Comment"
          className="min-h-[38px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span className="hidden min-[420px]:inline">Comment</span>
        </button>

        <button
          onClick={() => onRepost(post.id)}
          aria-label="Repost"
          className={`min-h-[38px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
            post.repostedByMe
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'hover:text-white hover:bg-white/5'
          }`}
        >
          <Repeat2 className="w-4 h-4 flex-shrink-0" />
          <span className="hidden min-[420px]:inline">Repost</span>
        </button>

        <button
          onClick={() => onSave(post.id)}
          aria-label="Save"
          className={`min-h-[38px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg transition cursor-pointer ${
            post.savedByMe
              ? 'text-indigo-400 bg-indigo-500/10'
              : 'hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark className={`w-4 h-4 flex-shrink-0 ${post.savedByMe ? 'fill-indigo-400' : ''}`} />
          <span className="hidden min-[420px]:inline">Save</span>
        </button>

        <button
          onClick={handleShareClick}
          aria-label="Share"
          className="min-h-[38px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[#FF5E1E] hover:bg-[#FF5E1E]/10 transition cursor-pointer"
        >
          <Share2 className="w-4 h-4 flex-shrink-0" />
          <span className="hidden min-[420px]:inline">Share</span>
        </button>
      </div>

      {/* Comments Accordion */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-[#1F293D] space-y-3">
          {/* Add Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="Write a constructive comment or feedback..."
              className="flex-1 px-3 py-2 text-xs bg-[#0B0F19] border border-[#1F293D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {post.comments.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">
                No comments yet. Be the first to start the conversation!
              </p>
            ) : (
              post.comments.map(c => (
                <div key={c.id} className="p-2.5 bg-[#0B0F19] rounded-xl border border-gray-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={c.author.avatar}
                        alt={c.author.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="font-semibold text-white">{c.author.name}</span>
                      <span className="text-[10px] text-gray-500">{c.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 pl-7">{c.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
};
