import React, { useState } from 'react';
import {
  Users,
  Bot,
  Code,
  Palette,
  GraduationCap,
  Leaf,
  Gamepad2,
  Plus,
  Share2,
  Search,
  Check,
  Camera,
  Image as ImageIcon,
  X,
  Sparkles,
} from 'lucide-react';
import { Community } from '../types';
import { communitiesData } from '../data/mockData';
import { ShareItem } from './ShareModal';
import { SinglePhotoUpload } from './PhotoUpload';

interface CommunitiesViewProps {
  onShare: (item: ShareItem) => void;
}

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({ onShare }) => {
  const [communities, setCommunities] = useState<Community[]>(communitiesData);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('Technology');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [pinnedPost, setPinnedPost] = useState('');

  const categories = ['All', 'Technology', 'Engineering', 'Design', 'Startups', 'Climate', 'Gaming'];

  const toggleJoin = (id: string) => {
    setCommunities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, joined: !c.joined } : c))
    );
  };

  const handleOpenCreate = () => {
    setName('');
    setTagline('');
    setCategory('Technology');
    setCustomPhotoUrl('');
    setBannerUrl('');
    setPinnedPost('');
    setEditingCommunity(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditPhoto = (comm: Community) => {
    setEditingCommunity(comm);
    setName(comm.name);
    setTagline(comm.tagline);
    setCategory(comm.category);
    setCustomPhotoUrl(comm.customPhotoUrl || '');
    setBannerUrl(comm.bannerUrl || '');
    setPinnedPost(comm.pinnedPost || '');
    setIsCreateModalOpen(true);
  };

  const handleSaveCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCommunity) {
      // Update existing community
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === editingCommunity.id
            ? {
                ...c,
                name,
                tagline,
                category,
                customPhotoUrl: customPhotoUrl || undefined,
                bannerUrl: bannerUrl || undefined,
                pinnedPost: pinnedPost || undefined,
              }
            : c
        )
      );
    } else {
      // Create new community
      const newComm: Community = {
        id: `comm-${Date.now()}`,
        name,
        tagline: tagline || 'A collective space for COOK builders and creators.',
        category,
        icon: 'Users',
        customPhotoUrl: customPhotoUrl || undefined,
        bannerUrl: bannerUrl || undefined,
        memberCount: '1 member',
        joined: true,
        moderators: ['You'],
        rules: ['Be respectful', 'Share high signal updates', 'Let it cook'],
        pinnedPost: pinnedPost || undefined,
      };
      setCommunities([newComm, ...communities]);
    }

    setIsCreateModalOpen(false);
  };

  const filtered = communities.filter((c) => {
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q);
    }
    return true;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bot':
        return <Bot className="w-5 h-5 text-indigo-400" />;
      case 'Code':
        return <Code className="w-5 h-5 text-blue-400" />;
      case 'Palette':
        return <Palette className="w-5 h-5 text-rose-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-amber-400" />;
      case 'Leaf':
        return <Leaf className="w-5 h-5 text-emerald-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-purple-400" />;
      default:
        return <Users className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="flex-1 max-w-5xl space-y-6 pb-16">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#13192B] via-[#1E1B4B] to-[#13192B] border border-indigo-500/30 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300">
              COMMUNITY HUBS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Connect with founders and specialists
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
            Join vetted niche communities to share daily work, find co-founders, get peer reviews, and upload custom community photos directly from your device.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-[#FF5E1E] hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Community</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#13192B] border border-[#1F293D] rounded-2xl p-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0B0F19] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#0B0F19] text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((comm) => (
          <div
            key={comm.id}
            className="bg-[#13192B] border border-[#1F293D] rounded-2xl overflow-hidden hover:border-gray-700 transition flex flex-col"
          >
            {/* Optional Banner Image */}
            {comm.bannerUrl ? (
              <div className="h-28 w-full overflow-hidden relative">
                <img
                  src={comm.bannerUrl}
                  alt={comm.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#13192B] to-transparent opacity-80" />
                <button
                  onClick={() => handleOpenEditPhoto(comm)}
                  className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-[10px] text-white flex items-center gap-1 border border-white/20 transition"
                  title="Change banner/photo from your PC"
                >
                  <Camera className="w-3 h-3 text-indigo-400" />
                  <span>Change Photo</span>
                </button>
              </div>
            ) : null}

            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {comm.customPhotoUrl ? (
                      <img
                        src={comm.customPhotoUrl}
                        alt={comm.name}
                        className="w-12 h-12 rounded-xl object-cover border border-purple-500/40 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#0B0F19] border border-gray-800 flex items-center justify-center">
                        {getIcon(comm.icon)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white text-sm">{comm.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{comm.memberCount}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300">
                          {comm.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!comm.bannerUrl && (
                      <button
                        onClick={() => handleOpenEditPhoto(comm)}
                        className="w-8 h-8 rounded-lg bg-[#0B0F19] text-gray-400 hover:text-white border border-gray-800 flex items-center justify-center transition"
                        title="Upload Custom Photo / Banner from PC"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        onShare({
                          id: comm.id,
                          type: 'community',
                          title: `Join ${comm.name} on COOK`,
                          description: comm.tagline,
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-[#0B0F19] text-gray-400 hover:text-white border border-gray-800 flex items-center justify-center transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{comm.tagline}</p>

                {comm.pinnedPost && (
                  <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-gray-800 text-[11px] text-gray-400">
                    <span className="font-bold text-indigo-400 block mb-0.5">
                      📌 Pinned Announcement:
                    </span>
                    {comm.pinnedPost}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between mt-auto">
                <span className="text-[11px] text-gray-500 truncate max-w-[170px]">
                  Moderated by {comm.moderators.join(', ')}
                </span>
                <button
                  onClick={() => toggleJoin(comm.id)}
                  className={`py-1.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                    comm.joined
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  }`}
                >
                  {comm.joined ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{comm.joined ? 'Joined' : 'Join Community'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT COMMUNITY PHOTO MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#13192B] border border-gray-800 rounded-3xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E1E]" />
              <h2 className="text-lg font-bold text-white">
                {editingCommunity ? `Update ${editingCommunity.name}` : 'Create New Community'}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Upload photos from your computer or phone for your community avatar and wide banner.
            </p>

            <form onSubmit={handleSaveCommunity} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Community Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NextGen Robotics Club, Web3 Builders"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Startups">Startups</option>
                  <option value="Climate">Climate</option>
                  <option value="Gaming">Gaming</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Short Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Brief summary of what your community cooks together"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* REAL PHOTO UPLOADS FROM DEVICE */}
              <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-gray-800 space-y-3.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  Upload Community Photos (From PC / Mobile)
                </span>

                <SinglePhotoUpload
                  label="Community Avatar / Icon Photo"
                  currentUrl={customPhotoUrl}
                  onUploaded={(url) => setCustomPhotoUrl(url)}
                  aspect="square"
                  sublabel="Select an icon or logo from your computer files."
                />

                <SinglePhotoUpload
                  label="Wide Community Cover Banner"
                  currentUrl={bannerUrl}
                  onUploaded={(url) => setBannerUrl(url)}
                  aspect="cover"
                  sublabel="Select a wide banner (16:9 or 3:1) from your computer."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Pinned Announcement (Optional)</label>
                <textarea
                  rows={2}
                  value={pinnedPost}
                  onChange={(e) => setPinnedPost(e.target.value)}
                  placeholder="First message to pin to the community board"
                  className="w-full px-3.5 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingCommunity ? 'Save Changes' : 'Publish Community'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
