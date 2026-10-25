import React, { useState } from 'react';
import {
  Flame,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  Check,
  Plus,
  Compass,
} from 'lucide-react';
import { trendingTopics, recentActivity } from '../data/mockData';

interface RightSidebarProps {
  onSelectTopic: (tag: string) => void;
  onViewStartup: (startupName: string) => void;
  setActiveTab: (tab: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onSelectTopic,
  onViewStartup,
  setActiveTab,
}) => {
  const [joinedCommunities, setJoinedCommunities] = useState<Record<string, boolean>>({
    'AI & Technology': true,
  });

  const [followedStartups, setFollowedStartups] = useState<Record<string, boolean>>({
    NovaLearn: true,
  });

  const toggleJoin = (name: string) => {
    setJoinedCommunities(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleFollow = (name: string) => {
    setFollowedStartups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className="w-80 2xl:w-88 flex-shrink-0 flex flex-col gap-5 select-none pb-8 hidden xl:flex">
      {/* Trending Topics */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF5E1E] fill-[#FF5E1E]" />
            <h3 className="font-bold text-white text-sm">Trending Topics</h3>
          </div>
          <button
            onClick={() => setActiveTab('discover')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {trendingTopics.slice(0, 5).map(item => (
            <div
              key={item.tag}
              onClick={() => onSelectTopic(item.tag)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition group"
            >
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-[#FF5E1E] transition">
                  {item.tag}
                </p>
                <span className="text-[11px] text-gray-400">{item.count}</span>
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#FF5E1E] transition" />
            </div>
          ))}
        </div>
      </div>

      {/* Featured Startup Spotlight */}
      <div className="bg-gradient-to-br from-[#13192B] to-[#1C1F33] border border-indigo-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Featured Startup
          </span>
          <button
            onClick={() => setActiveTab('funding')}
            className="text-[11px] font-semibold text-gray-400 hover:text-white"
          >
            View all
          </button>
        </div>

        {/* Startup Card Mini */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-md">
              NL
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">NovaLearn</h4>
              <p className="text-xs text-gray-300">AI-Powered Learning Platform</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 line-clamp-2">
            Personalized learning paths, AI tutors, and interactive courses for better learning outcomes.
          </p>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              MVP
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Education
            </span>
          </div>

          {/* Target Financials */}
          <div className="grid grid-cols-3 gap-1 py-2 px-2.5 bg-[#0B0F19] rounded-xl border border-gray-800 text-center">
            <div>
              <span className="block text-xs font-bold text-white">$250K</span>
              <span className="text-[10px] text-gray-500">Goal</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-white">12%</span>
              <span className="text-[10px] text-gray-500">Equity</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-white">6 mo</span>
              <span className="text-[10px] text-gray-500">Runway</span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-400">$80K raised</span>
              <span className="font-semibold text-emerald-400">32%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-[#FF5E1E] w-[32%]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                setActiveTab('funding');
                onViewStartup('NovaLearn');
              }}
              className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold text-center transition shadow-md"
            >
              View Startup
            </button>
            <button
              onClick={() => {
                setActiveTab('funding');
                onViewStartup('NovaLearn');
              }}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold text-center transition"
            >
              Support Idea
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Communities */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Suggested Communities</h3>
          </div>
          <button
            onClick={() => setActiveTab('communities')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
          >
            View all
          </button>
        </div>

        <div className="space-y-3">
          {[
            { name: 'AI & Technology', members: '12.5K members', icon: '🤖' },
            { name: 'Design & Creativity', members: '4.8K members', icon: '🎨' },
            { name: 'Gaming Zone', members: '5.2K members', icon: '🎮' },
            { name: 'Travel & Adventure', members: '6.7K members', icon: '✈️' },
          ].map(comm => (
            <div key={comm.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate mr-2">
                <span className="w-8 h-8 rounded-lg bg-[#0B0F19] border border-gray-800 flex items-center justify-center text-sm flex-shrink-0">
                  {comm.icon}
                </span>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{comm.name}</p>
                  <span className="text-[10px] text-gray-500">{comm.members}</span>
                </div>
              </div>
              <button
                onClick={() => toggleJoin(comm.name)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  joinedCommunities[comm.name]
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {joinedCommunities[comm.name] ? 'Joined' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Top Startups to Follow */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Top Startups</h3>
          </div>
          <button
            onClick={() => setActiveTab('funding')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
          >
            View all
          </button>
        </div>

        <div className="space-y-3">
          {[
            { name: 'GreenCycle', desc: 'CleanTech • Plastic sorting AI' },
            { name: 'MedlAI', desc: 'HealthTech • Ambient clinical scribe' },
            { name: 'SnapFit', desc: 'Fitness & Health • Motion coach' },
          ].map(st => (
            <div key={st.name} className="flex items-center justify-between">
              <div className="truncate mr-2">
                <p className="text-xs font-semibold text-white truncate">{st.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{st.desc}</p>
              </div>
              <button
                onClick={() => toggleFollow(st.name)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  followedStartups[st.name]
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {followedStartups[st.name] ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white text-sm">Recent Activity</h3>
          <span className="text-[10px] text-gray-400">Live</span>
        </div>
        <div className="space-y-3">
          {recentActivity.map(act => (
            <div key={act.id} className="flex gap-2.5 items-start text-xs">
              <img
                src={act.avatar}
                alt={act.user}
                className="w-7 h-7 rounded-full object-cover border border-gray-800 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 leading-tight">
                  <span className="font-semibold text-white">{act.user}</span> {act.action}
                </p>
                {act.detail && <p className="text-gray-500 text-[11px] truncate mt-0.5">{act.detail}</p>}
                <span className="text-[10px] text-gray-500 mt-1 block">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
