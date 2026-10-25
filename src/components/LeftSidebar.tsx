import React from 'react';
import {
  Home,
  Compass,
  Briefcase,
  Users,
  Search,
  Sparkles,
  BookOpen,
  Calendar,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  Flame,
  ArrowRight,
  UserCheck,
  TrendingUp,
  User,
  LogOut,
} from 'lucide-react';
import { User as UserType } from '../types';
import { currentUser as defaultUser } from '../data/mockData';

interface LeftSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  unreadMessagesCount?: number;
  user?: UserType;
  onSignOut?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  darkMode,
  setDarkMode,
  unreadMessagesCount = 12,
  user = defaultUser,
  onSignOut,
}) => {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'funding', label: 'Startups & Funding', icon: Briefcase, highlight: true },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'opportunities', label: 'Opportunities', icon: TrendingUp },
    { id: 'investors', label: 'Investors', icon: UserCheck },
    { id: 'ai-mentor', label: 'AI Mentor', icon: Sparkles, badge: 'AI' },
    { id: 'learning', label: 'Learning Hub', icon: BookOpen },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badgeCount: unreadMessagesCount },
  ];

  return (
    <aside className="hidden lg:flex w-64 xl:w-72 flex-shrink-0 flex-col gap-5 select-none pb-8">
      {/* Profile Snapshot Card */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF5E1E] via-[#6366F1] to-[#3B82F6]" />
        
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="relative cursor-pointer" onClick={() => setActiveTab('profile')}>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/50"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#13192B]" />
          </div>
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setActiveTab('profile')}>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-white text-base truncate">{user.name}</h3>
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">{user.headline || user.title}</p>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed mb-4 italic line-clamp-2">
          "{user.bio}"
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#1F293D] mb-4 text-center">
          <div>
            <span className="block font-extrabold text-sm text-white">{user.postsCount}</span>
            <span className="text-[11px] text-gray-400">Posts</span>
          </div>
          <div>
            <span className="block font-extrabold text-sm text-white">{user.connectionsCount || 1840}</span>
            <span className="text-[11px] text-gray-400">Connects</span>
          </div>
          <div>
            <span className="block font-extrabold text-sm text-white">{user.followersCount}</span>
            <span className="text-[11px] text-gray-400">Followers</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className="flex-1 py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition text-center"
          >
            View Profile
          </button>
          <button
            onClick={onOpenProfile}
            className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition text-center"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-2.5 shadow-lg space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-[#FF5E1E]' : ''}`} />
                <span>{item.label}</span>
              </div>
              
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF5E1E] text-white">
                  {item.badge}
                </span>
              )}
              {item.badgeCount && item.badgeCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-[#FF5E1E] text-white text-[10px] font-bold">
                  {item.badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Promo Card: Turn Ideas Into Reality */}
      <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13192B] border border-indigo-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5E1E] to-[#6366F1] flex items-center justify-center text-white mb-2.5 shadow-md shadow-orange-500/20">
          <Flame className="w-4 h-4 fill-white" />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">Turn your ideas into reality</h4>
        <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
          Join the world's most creative startup and creator community.
        </p>
        <button
          onClick={() => setActiveTab('funding')}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition"
        >
          <span>Explore Startups</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dark / Light Mode Switch */}
      <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
          {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            darkMode ? 'bg-indigo-600' : 'bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              darkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {onSignOut && (
        <button
          onClick={onSignOut}
          className="w-full py-2.5 px-3.5 rounded-2xl bg-[#13192B] hover:bg-rose-500/10 border border-[#1F293D] hover:border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      )}
    </aside>
  );
};
