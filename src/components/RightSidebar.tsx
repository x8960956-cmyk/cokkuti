import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  Sparkles,
  Compass,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { FundingRequest, Post, Community } from '../types';

interface RightSidebarProps {
  onSelectTopic: (tag: string) => void;
  onViewStartup: (startupName: string) => void;
  setActiveTab: (tab: string) => void;
  fundings?: FundingRequest[];
  posts?: Post[];
  onOpenRaiseFundsModal?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onSelectTopic,
  onViewStartup,
  setActiveTab,
  fundings = [],
  posts = [],
  onOpenRaiseFundsModal,
}) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [followedStartups, setFollowedStartups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const token = localStorage.getItem('cook_auth_token');
        const res = await fetch('/api/communities', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (Array.isArray(data.communities)) {
          setCommunities(data.communities);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchCommunities();
  }, []);

  // Compute genuine trending hashtags directly from real posts
  const realTrends = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          const clean = t.startsWith('#') ? t : `#${t}`;
          counts[clean] = (counts[clean] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([tag, count]) => ({
        tag,
        count,
        label: `${count} ${count === 1 ? 'post' : 'posts'}`,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [posts]);

  const toggleJoinCommunity = async (id: string) => {
    const token = localStorage.getItem('cook_auth_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/communities/${id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.community) {
        setCommunities((prev) => prev.map((c) => (c.id === id ? data.community : c)));
      }
    } catch (err) {
      // ignore
    }
  };

  const toggleFollow = (name: string) => {
    setFollowedStartups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const featuredStartup = fundings.length > 0 ? fundings[0] : null;

  return (
    <aside className="w-72 2xl:w-80 flex-shrink-0 space-y-4 select-none sticky top-20 self-start max-h-[calc(100dvh-5.5rem)] overflow-y-auto pr-1 pb-6 hidden xl:block">
      {/* Real Trending Topics */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF5E1E] fill-[#FF5E1E]" />
            <h3 className="font-bold text-white text-sm">Trending Topics</h3>
          </div>
          <button
            onClick={() => setActiveTab('discover')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {realTrends.length === 0 ? (
          <div className="p-3 rounded-xl bg-[#0B0F19] border border-gray-800/80 text-[11px] text-gray-400 leading-relaxed">
            No trending tags yet. Publish a post with <span className="text-indigo-400 font-semibold">#hashtags</span> to surface real trends.
          </div>
        ) : (
          <div className="space-y-2">
            {realTrends.map((item) => (
              <div
                key={item.tag}
                onClick={() => onSelectTopic(item.tag)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition group"
              >
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-[#FF5E1E] transition">
                    {item.tag}
                  </p>
                  <span className="text-[11px] text-gray-400">{item.label}</span>
                </div>
                <TrendingUp className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#FF5E1E] transition" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Startup Spotlight or Raise Capital CTA */}
      {featuredStartup ? (
        <div className="bg-gradient-to-br from-[#13192B] to-[#1C1F33] border border-indigo-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Featured Startup
            </span>
            <button
              onClick={() => setActiveTab('funding')}
              className="text-[11px] font-semibold text-gray-400 hover:text-white cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={featuredStartup.logo}
                alt={featuredStartup.startupName}
                className="w-12 h-12 rounded-xl object-cover border border-indigo-500/30 shadow-md"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm truncate">{featuredStartup.startupName}</h4>
                <p className="text-xs text-gray-300 truncate">{featuredStartup.tagline}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {featuredStartup.description}
            </p>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {featuredStartup.stage}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 truncate">
                {featuredStartup.industry}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 py-2 px-2.5 bg-[#0B0F19] rounded-xl border border-gray-800 text-center">
              <div>
                <span className="block text-xs font-bold text-white">
                  ${Math.round(featuredStartup.fundingGoal / 1000)}K
                </span>
                <span className="text-[10px] text-gray-500">Goal</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-white">{featuredStartup.equityOffered}</span>
                <span className="text-[10px] text-gray-500">Equity</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-white">{featuredStartup.runwayMonths} mo</span>
                <span className="text-[10px] text-gray-500">Runway</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-400">
                  ${Math.round(featuredStartup.amountRaised / 1000)}K raised
                </span>
                <span className="font-semibold text-emerald-400">
                  {Math.round((featuredStartup.amountRaised / featuredStartup.fundingGoal) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#FF5E1E]"
                  style={{
                    width: `${Math.min(100, Math.round((featuredStartup.amountRaised / featuredStartup.fundingGoal) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('funding');
                onViewStartup(featuredStartup.startupName);
              }}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold text-center transition shadow-md cursor-pointer"
            >
              View Startup Round
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#13192B] via-[#161D36] to-[#1E1B4B] border border-indigo-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#FF5E1E]/20 text-[#FF5E1E] text-[10px] font-bold border border-[#FF5E1E]/30">
              VENTURE ENGINE
            </span>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Raise Pre-Seed on COOK</h4>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              Publish your pitch deck, track investor interest, and recruit co-founders directly on COOK.
            </p>
          </div>
          <button
            onClick={() => {
              if (onOpenRaiseFundsModal) onOpenRaiseFundsModal();
              else setActiveTab('funding');
            }}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF5E1E] to-[#FF7A00] hover:from-[#ff6d31] hover:to-[#ff8d1e] text-white text-xs font-bold text-center transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Launch a Funding Round</span>
          </button>
        </div>
      )}

      {/* Real Communities */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Communities</h3>
          </div>
          <button
            onClick={() => setActiveTab('communities')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            View all
          </button>
        </div>

        {communities.length === 0 ? (
          <div className="space-y-2.5">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              No communities created yet. Start the first founder hub on COOK.
            </p>
            <button
              onClick={() => setActiveTab('communities')}
              className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer"
            >
              Create Community
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {communities.slice(0, 4).map((comm) => (
              <div key={comm.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate mr-2">
                  {comm.customPhotoUrl ? (
                    <img
                      src={comm.customPhotoUrl}
                      alt={comm.name}
                      className="w-8 h-8 rounded-lg object-cover border border-gray-800 flex-shrink-0"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-lg bg-[#0B0F19] border border-gray-800 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                      {comm.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">{comm.name}</p>
                    <span className="text-[10px] text-gray-500">{comm.memberCount}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleJoinCommunity(comm.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    comm.joined
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {comm.joined ? 'Joined' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real Venture Pipeline */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Venture Pipeline</h3>
          </div>
          <button
            onClick={() => setActiveTab('funding')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            Explore
          </button>
        </div>

        {fundings.length > 0 ? (
          <div className="space-y-3">
            {fundings.slice(0, 3).map((st) => (
              <div key={st.id} className="flex items-center justify-between">
                <div className="truncate mr-2">
                  <p className="text-xs font-semibold text-white truncate">{st.startupName}</p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {st.industry} • {st.stage}
                  </p>
                </div>
                <button
                  onClick={() => toggleFollow(st.startupName)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    followedStartups[st.startupName]
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {followedStartups[st.startupName] ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#0B0F19] border border-gray-800/80 text-[11px] text-gray-400 leading-relaxed">
            No live startups raising yet. Launch the first round from the Venture Engine above.
          </div>
        )}
      </div>

      {/* Founder Toolkit */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Founder Toolkit</h3>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('ai-mentor')}
          className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3 text-left transition cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">AI Startup Mentor</p>
            <p className="text-[10px] text-gray-400 truncate">Score ideas & get pitch advice</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('investors')}
          className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3 text-left transition cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">Angel Directory</p>
            <p className="text-[10px] text-gray-400 truncate">Connect with verified backers</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('learning')}
          className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3 text-left transition cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">Founder Guides</p>
            <p className="text-[10px] text-gray-400 truncate">SAFEs, vesting & PLG</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3 text-left transition cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">Demo Days & Events</p>
            <p className="text-[10px] text-gray-400 truncate">Live virtual pitch events</p>
          </div>
        </button>
      </div>
    </aside>
  );
};
