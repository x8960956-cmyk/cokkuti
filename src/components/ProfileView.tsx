import React, { useState } from 'react';
import {
  MapPin,
  Globe,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  Edit2,
  Camera,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
  FolderGit2,
  DollarSign,
  Film,
  Users,
  MessageSquare,
  UserPlus,
  Flame,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  Lock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { User, ExperienceItem, EducationItem, Post, FundingRequest, Clip, RecordPhoto } from '../types';
import { ShareItem } from './ShareModal';
import { PostCard } from './PostCard';
import { PhotoCropModal } from './PhotoCropModal';
import { ConnectWithMe } from './ConnectWithMe';

interface ProfileViewProps {
  user: User;
  posts: Post[];
  fundings: FundingRequest[];
  clips: Clip[];
  isOwner?: boolean;
  onEditProfile: () => void;
  onShare: (item: ShareItem) => void;
  onOpenRaiseFundsModal?: () => void;
  onContactUser?: () => void;
  onUpdateUser?: (updated: Partial<User>) => void;
  onLikePost?: (postId: string) => void;
  onSavePost?: (postId: string) => void;
  onRepostPost?: (postId: string) => void;
  onAddComment?: (postId: string, text: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  posts,
  fundings,
  clips,
  isOwner = true,
  onEditProfile,
  onShare,
  onOpenRaiseFundsModal,
  onContactUser,
  onUpdateUser,
  onLikePost,
  onSavePost,
  onRepostPost,
  onAddComment,
}) => {
  const [showFullBio, setShowFullBio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'experience' | 'education' | 'projects' | 'posts' | 'startups'>('all');
  const [isConnected, setIsConnected] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Photo Crop Modal trigger for quick avatar or cover updates
  const [photoCropOpen, setPhotoCropOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<'avatar' | 'cover'>('avatar');
  const [activeImagePreview, setActiveImagePreview] = useState<{ url: string; caption?: string; title?: string } | null>(null);

  // Filter posts created by this user
  const userPosts = posts.filter(
    (p) =>
      p.author.name.toLowerCase() === user.name.toLowerCase() ||
      p.author.username.toLowerCase() === user.username.toLowerCase() ||
      p.author.id === user.id
  );

  // Filter funding requests for this founder
  const userFundings = fundings.filter(
    (f) =>
      f.founderName.toLowerCase() === user.name.toLowerCase() ||
      f.startupName.toLowerCase() === 'technova' ||
      user.name.toLowerCase().includes('arjun')
  );

  // Filter clips for this creator
  const userClips = clips.filter(
    (c) =>
      c.creator.name.toLowerCase() === user.name.toLowerCase() ||
      c.creator.username.toLowerCase() === user.username.toLowerCase()
  );

  const handleCopyProfileLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cook.app';
    const profileUrl = `${origin}/profile/${user.username}`;
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareProfile = () => {
    onShare({
      id: user.id,
      type: 'profile',
      title: `${user.name} (@${user.username}) on COOK`,
      description: user.headline || user.bio || `${user.role} on COOK`,
      imageUrl: user.avatar,
      authorName: user.name,
    });
  };

  const completionScore = user.profileCompletionPercentage || 96;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 pb-20 select-none">
      {/* Photo Crop Modal */}
      <PhotoCropModal
        isOpen={photoCropOpen}
        onClose={() => setPhotoCropOpen(false)}
        initialImage={cropTarget === 'avatar' ? user.avatar : user.coverImage || ''}
        isCover={cropTarget === 'cover'}
        title={cropTarget === 'avatar' ? 'Update Profile Avatar' : 'Update Cover Banner'}
        onSave={(dataUrl) => {
          if (onUpdateUser) {
            onUpdateUser(cropTarget === 'avatar' ? { avatar: dataUrl } : { coverImage: dataUrl });
          }
        }}
      />

      {/* Copy Toast Alert */}
      {copiedLink && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-2xl flex items-center gap-1.5 animate-bounce">
          <Check className="w-4 h-4" />
          <span>Profile link copied to clipboard!</span>
        </div>
      )}

      {/* SECTION 1: Master Profile Header Card */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Cover Banner */}
        <div className="relative h-44 sm:h-64 2xl:h-72 w-full bg-gradient-to-r from-[#1E1B4B] via-[#0B0F19] to-[#1E1B4B] overflow-hidden group">
          <img
            src={
              user.coverImage ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80'
            }
            alt="Cover banner"
            className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.01]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#13192B] via-transparent to-black/30" />

          {/* Edit Cover Button (Owner only) */}
          {isOwner && (
            <button
              onClick={() => {
                setCropTarget('cover');
                setPhotoCropOpen(true);
              }}
              className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 transition cursor-pointer active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 text-[#FF5E1E]" />
              <span className="hidden sm:inline">Change Cover</span>
            </button>
          )}
        </div>

        {/* Profile Info Container */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* Circular Overlapping Avatar */}
            <div className="relative inline-block">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#13192B] shadow-2xl ring-2 ring-indigo-500/40 bg-[#0B0F19]">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-[#13192B]" />

              {/* Edit Avatar Button badge */}
              {isOwner && (
                <button
                  onClick={() => {
                    setCropTarget('avatar');
                    setPhotoCropOpen(true);
                  }}
                  className="absolute bottom-1 -right-1 w-9 h-9 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white flex items-center justify-center shadow-lg border-2 border-[#13192B] transition active:scale-95 cursor-pointer"
                  title="Change profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {isOwner ? (
                <>
                  <button
                    onClick={onEditProfile}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED] text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={handleShareProfile}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
                  >
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    <span className="hidden sm:inline">Share</span>
                  </button>

                  <button
                    onClick={handleCopyProfileLink}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs transition"
                    title="Copy Profile Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsConnected(!isConnected)}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-md ${
                      isConnected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isConnected ? 'Connected' : 'Connect'}</span>
                  </button>

                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition ${
                      isFollowing
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-transparent border-indigo-500 text-indigo-300 hover:bg-indigo-500/10'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>

                  <button
                    onClick={onContactUser}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Name, Badges, & Headline */}
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {user.name}
              </h1>
              {user.verified && (
                <span title="Verified Founder / Creator" className="inline-flex">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </span>
              )}
              <span className="text-xs text-gray-400 font-mono">@{user.username}</span>

              {/* Primary Role Chip */}
              {user.primaryRole && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF5E1E]/20 text-[#FF5E1E] border border-[#FF5E1E]/30 inline-flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-[#FF5E1E]" />
                  <span>{user.primaryRole}</span>
                </span>
              )}
            </div>

            {/* Custom Roles List */}
            {user.customRoles && user.customRoles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {user.customRoles.map((r) => (
                  <span
                    key={r.id}
                    className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-white/5 text-gray-300 border border-white/10"
                  >
                    {r.name}
                  </span>
                ))}
              </div>
            )}

            {/* Headline */}
            <p className="text-sm sm:text-base text-gray-200 font-medium leading-relaxed pt-1">
              {user.headline || user.title}
            </p>

            {/* Location & Links */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{user.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>{user.connectionsCount || 1840} connections</span>
                <span className="text-gray-600">•</span>
                <span>{user.followersCount.toLocaleString()} followers</span>
              </div>
            </div>
          </div>

          {/* Profile Strength Bar (Owner view) */}
          {isOwner && (
            <div className="mt-5 p-3.5 rounded-2xl bg-[#0B0F19] border border-[#1F293D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Profile Strength: All-Star</span>
                  </div>
                  <span className="font-mono text-indigo-400 font-bold">{completionScore}% Complete</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-[#FF5E1E] transition-all duration-500 rounded-full"
                    style={{ width: `${completionScore}%` }}
                  />
                </div>
              </div>
              <button
                onClick={onEditProfile}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 sm:self-center flex-shrink-0"
              >
                Enhance Profile →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Profile Content & Right Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* SECTION 2: About Section */}
          <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl p-6 sm:p-7 shadow-lg space-y-3 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white">About & Summary</h2>
              {isOwner && (
                <button
                  onClick={onEditProfile}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                  title="Edit bio"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className={`text-xs sm:text-sm text-gray-300 leading-relaxed ${!showFullBio && 'line-clamp-4'}`}>
              {user.bio}
            </p>

            {user.bio && user.bio.length > 250 && (
              <button
                onClick={() => setShowFullBio(!showFullBio)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pt-1"
              >
                <span>{showFullBio ? 'Show less' : 'Show more'}</span>
                {showFullBio ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Quick Skills highlights */}
            {user.skills && user.skills.length > 0 && (
              <div className="pt-3 border-t border-gray-800/80">
                <span className="text-xs font-bold text-gray-400 block mb-2">Core Competencies:</span>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#0B0F19] border border-gray-800 text-indigo-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Experience Section */}
          <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl p-6 sm:p-7 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base sm:text-lg font-bold text-white">Experience</h2>
              </div>
              {isOwner && (
                <button
                  onClick={onEditProfile}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add / Edit</span>
                </button>
              )}
            </div>

            <div className="space-y-6">
              {(user.experience || []).map((exp) => (
                <div key={exp.id} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                    {exp.companyLogo ? (
                      <img src={exp.companyLogo} alt={exp.company} className="w-full h-full object-cover" />
                    ) : (
                      <Briefcase className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm sm:text-base">{exp.title}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {exp.employmentType}
                      </span>
                    </div>

                    <p className="text-xs text-indigo-400 font-medium mt-0.5">
                      {exp.company} • <span className="text-gray-400">{exp.workplaceType}</span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {exp.startDate} - {exp.endDate || (exp.current ? 'Present' : '')}
                    </p>

                    {exp.description && (
                      <p className="text-xs sm:text-sm text-gray-300 mt-2.5 leading-relaxed">
                        {exp.description}
                      </p>
                    )}

                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.achievements.map((ach, idx) => (
                          <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>{ach}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {exp.skillsUsed.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] font-medium text-gray-300 bg-[#0B0F19] border border-gray-800 px-2 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Work Experience Photo Gallery */}
                    {exp.photos && exp.photos.length > 0 && (
                      <div className="mt-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Workplace Photos & Highlights ({exp.photos.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {exp.photos
                            .filter((p) => isOwner || p.visibility !== 'private')
                            .map((p) => (
                              <div
                                key={p.id}
                                onClick={() => setActiveImagePreview({ url: p.url, caption: p.caption, title: `${exp.title} @ ${exp.company}` })}
                                className="group/photo relative aspect-video rounded-xl overflow-hidden border border-gray-800 bg-black cursor-pointer hover:border-indigo-500/60 transition"
                              >
                                <img src={p.url} alt={p.caption || 'Work photo'} className="w-full h-full object-cover group-hover/photo:scale-105 transition duration-300" />
                                {p.caption && (
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-1.5 text-[10px] text-gray-200 truncate">
                                    {p.caption}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Education & Learning */}
          <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl p-6 sm:p-7 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base sm:text-lg font-bold text-white">Education & Learning</h2>
              </div>
              {isOwner && (
                <button
                  onClick={onEditProfile}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add / Edit</span>
                </button>
              )}
            </div>

            <div className="space-y-5">
              {(user.education || []).map((edu) => (
                <div key={edu.id} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                    {edu.institutionLogo ? (
                      <img src={edu.institutionLogo} alt={edu.institution} className="w-full h-full object-cover" />
                    ) : (
                      <GraduationCap className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm sm:text-base">{edu.institution}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                        {edu.qualificationType}
                      </span>
                    </div>

                    <p className="text-xs text-indigo-400 font-medium mt-0.5">
                      {edu.degree} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {edu.startDate} - {edu.endDate || (edu.currentlyStudying ? 'Present' : '')}
                      {edu.grade && user.privacySettings?.showEducationGrades ? ` • ${edu.grade}` : ''}
                    </p>

                    {edu.description && (
                      <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                        {edu.description}
                      </p>
                    )}

                    {edu.activities && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        Activities: {edu.activities}
                      </p>
                    )}

                    {/* Education Photo Gallery */}
                    {edu.photos && edu.photos.length > 0 && (
                      <div className="mt-3.5 space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Campus & Academic Highlights ({edu.photos.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {edu.photos
                            .filter((p) => isOwner || p.visibility !== 'private')
                            .map((p) => (
                              <div
                                key={p.id}
                                onClick={() => setActiveImagePreview({ url: p.url, caption: p.caption, title: `${edu.degree} @ ${edu.institution}` })}
                                className="group/photo relative aspect-video rounded-xl overflow-hidden border border-gray-800 bg-black cursor-pointer hover:border-indigo-500/60 transition"
                              >
                                <img src={p.url} alt={p.caption || 'Education photo'} className="w-full h-full object-cover group-hover/photo:scale-105 transition duration-300" />
                                {p.caption && (
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-1.5 text-[10px] text-gray-200 truncate">
                                    {p.caption}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: Projects & Portfolio */}
          {user.projects && user.projects.length > 0 && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base sm:text-lg font-bold text-white">Projects & Portfolio</h2>
                </div>
                {isOwner && (
                  <button
                    onClick={onEditProfile}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Manage →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-2xl bg-[#0B0F19] border border-gray-800 flex flex-col justify-between hover:border-indigo-500/40 transition group"
                  >
                    <div>
                      {proj.imageUrl && (
                        <div className="h-32 rounded-xl overflow-hidden mb-3 border border-gray-800">
                          <img
                            src={proj.imageUrl}
                            alt={proj.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                      )}
                      <h3 className="font-bold text-white text-sm">{proj.title}</h3>
                      <span className="text-[11px] text-indigo-400 block mt-0.5">{proj.role}</span>
                      <p className="text-xs text-gray-300 mt-2 line-clamp-3 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-gray-800/80 mt-3">
                      <div className="flex flex-wrap gap-1">
                        {(proj.tags || []).slice(0, 3).map((t) => (
                          <span key={t} className="text-[9px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-indigo-400 hover:text-white flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: Startups & Funding Rounds (COOK native integration) */}
          {userFundings.length > 0 && (
            <div className="bg-[#13192B] border border-orange-500/30 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#FF5E1E] fill-[#FF5E1E]" />
                  <h2 className="text-base sm:text-lg font-bold text-white">Startups & Venture Rounds</h2>
                </div>
                {isOwner && onOpenRaiseFundsModal && (
                  <button
                    onClick={onOpenRaiseFundsModal}
                    className="px-3 py-1.5 rounded-xl bg-[#FF5E1E] hover:bg-[#ff6d31] text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-orange-500/25 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Raise Funds</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {userFundings.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-2xl bg-[#0B0F19] border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={f.logo}
                        alt={f.startupName}
                        className="w-12 h-12 rounded-2xl object-cover border border-orange-500/30 flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm sm:text-base">{f.startupName}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-[#FF5E1E] font-bold">
                            {f.stage}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-0.5">{f.tagline}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Seeking <strong className="text-white">${f.amountSeeking.toLocaleString()}</strong> for{' '}
                          <span className="text-indigo-400">{f.equityOffered} equity</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        onShare({
                          id: f.id,
                          type: 'funding',
                          title: `${f.startupName} is raising funds on COOK`,
                          description: f.description,
                          imageUrl: f.logo,
                          authorName: f.founderName,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Round</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 7: External Portfolio Website */}
          {(user.portfolioWebsite || user.website) && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl p-6 sm:p-7 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base sm:text-lg font-bold text-white">External Portfolio & Live Work</h2>
                </div>
                {isOwner && (
                  <button onClick={onEditProfile} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                    Edit →
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-300">
                Explore standalone case studies, technical whitepapers, live app deployments, and client deliverables.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                {user.portfolioWebsite && (
                  <a
                    href={user.portfolioWebsite.startsWith('http') ? user.portfolioWebsite : `https://${user.portfolioWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0B0F19] border border-indigo-500/30 hover:border-indigo-400 text-xs font-semibold text-indigo-300 hover:text-white transition group"
                  >
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>View Interactive Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
                  </a>
                )}
                {user.website && user.website !== user.portfolioWebsite && (
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0B0F19] border border-gray-800 hover:border-gray-700 text-xs font-semibold text-gray-300 hover:text-white transition group"
                  >
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span>{user.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* SECTION 8: Connect With Me — Social Media Links */}
          <ConnectWithMe
            user={user}
            socialLinks={user.socialLinkItems}
            legacySocials={user.socialLinks}
            onConnect={() => setIsConnected(!isConnected)}
            isConnected={isConnected}
          />

          {/* SECTION 9: User Posts & Activity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white">Public Activity & Posts</h2>
              <span className="text-xs text-gray-400">{userPosts.length} posts</span>
            </div>

            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => onLikePost && onLikePost(post.id)}
                  onSave={() => onSavePost && onSavePost(post.id)}
                  onRepost={() => onRepostPost && onRepostPost(post.id)}
                  onShare={(item) => onShare(item)}
                  onAddComment={(text) => onAddComment && onAddComment(post.id, text)}
                />
              ))
            ) : (
              <div className="p-8 rounded-2xl bg-[#13192B] border border-[#1F293D] text-center text-xs text-gray-400">
                No posts shared yet. Start cooking an idea!
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Profile Completion, Recommendations, Certs */}
        <div className="lg:col-span-4 space-y-5">
          {/* Certifications Card */}
          {user.certifications && user.certifications.length > 0 && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl p-5 shadow-lg space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">Licenses & Certifications</h3>
                </div>
                {isOwner && (
                  <button onClick={onEditProfile} className="text-[11px] text-indigo-400 hover:text-indigo-300">
                    Edit
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {user.certifications.map((cert) => (
                  <div key={cert.id} className="p-3 rounded-2xl bg-[#0B0F19] border border-gray-800">
                    <h4 className="font-bold text-white text-xs">{cert.name}</h4>
                    <p className="text-[11px] text-indigo-400 mt-0.5">{cert.issuingOrg}</p>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Issued {cert.issueDate}</span>
                    {cert.credentialId && (
                      <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                        ID: {cert.credentialId}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links Card */}
          {user.socialLinks && (
            <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl p-5 shadow-lg space-y-3">
              <h3 className="font-bold text-white text-sm">Connect & Socials</h3>
              <div className="space-y-2">
                {user.socialLinks.github && (
                  <a
                    href={user.socialLinks.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-gray-800 hover:border-indigo-500/40 text-xs text-gray-300 hover:text-white transition"
                  >
                    <span>GitHub Profile</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                )}
                {user.socialLinks.linkedin && (
                  <a
                    href={user.socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-gray-800 hover:border-indigo-500/40 text-xs text-gray-300 hover:text-white transition"
                  >
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                )}
                {user.socialLinks.twitter && (
                  <a
                    href={user.socialLinks.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-gray-800 hover:border-indigo-500/40 text-xs text-gray-300 hover:text-white transition"
                  >
                    <span>X (Twitter)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Suggested Founders & Co-Founders */}
          <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl p-5 shadow-lg space-y-3.5">
            <h3 className="font-bold text-white text-sm">Suggested Connections</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                    alt="Sarah Ahmed"
                    className="w-9 h-9 rounded-full object-cover border border-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-white text-xs block">Sarah Ahmed</span>
                    <span className="text-[10px] text-gray-400">Product Designer @ Lumina</span>
                  </div>
                </div>
                <button className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-[11px] font-bold transition">
                  Connect
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                    alt="Elena Rostova"
                    className="w-9 h-9 rounded-full object-cover border border-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-white text-xs block">Elena Rostova</span>
                    <span className="text-[10px] text-gray-400">Partner @ Horizon VC</span>
                  </div>
                </div>
                <button className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-[11px] font-bold transition">
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / High-Res Image Preview Modal */}
      {activeImagePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setActiveImagePreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#13192B] border border-gray-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#0B0F19]">
              <span className="text-sm font-bold text-white truncate pr-4">
                {activeImagePreview.title || 'Photo Preview'}
              </span>
              <button
                onClick={() => setActiveImagePreview(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-hidden bg-black flex items-center justify-center p-2">
              <img
                src={activeImagePreview.url}
                alt={activeImagePreview.caption || 'Preview'}
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>

            {activeImagePreview.caption && (
              <div className="p-3.5 bg-[#0B0F19] border-t border-gray-800 text-xs sm:text-sm text-gray-300 text-center font-medium">
                {activeImagePreview.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
