import React, { useState } from 'react';
import {
  Search,
  Home,
  Compass,
  Film,
  Users,
  MessageSquare,
  Bell,
  Sparkles,
  DollarSign,
  Briefcase,
  Flame,
  ChevronDown,
  User,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  PlusCircle,
  Menu,
  X,
  TrendingUp,
  BookOpen,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { User as UserType } from '../types';
import { currentUser as defaultUser } from '../data/mockData';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  onOpenRaiseFundsModal: () => void;
  onOpenProfile: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
  onSearch: (query: string) => void;
  user?: UserType;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  onOpenRaiseFundsModal,
  onOpenProfile,
  darkMode,
  setDarkMode,
  unreadMessagesCount = 12,
  unreadNotificationsCount = 5,
  onSearch,
  user = defaultUser,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setMobileSearchOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'clips', label: 'Clips', icon: Film, badge: 'HOT' },
    { id: 'funding', label: 'Funding Hub', icon: DollarSign },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badgeCount: unreadMessagesCount },
    { id: 'notifications', label: 'Notifications', icon: Bell, badgeCount: unreadNotificationsCount },
  ];

  const drawerLinks = [
    { id: 'home', label: 'Home Feed', icon: Home },
    { id: 'profile', label: 'My Profile & Experience', icon: User },
    { id: 'discover', label: 'Explore & Discover', icon: Compass },
    { id: 'funding', label: 'Startups & Funding Hub', icon: DollarSign, highlight: true },
    { id: 'clips', label: 'COOK Clips (Shorts)', icon: Film, badge: 'HOT' },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'opportunities', label: 'Co-founders & Roles', icon: TrendingUp },
    { id: 'investors', label: 'Investor Directory', icon: UserCheck },
    { id: 'ai-mentor', label: 'AI Startup Mentor', icon: Sparkles, badge: 'AI' },
    { id: 'learning', label: 'Learning Hub', icon: BookOpen },
    { id: 'events', label: 'Events & Demo Days', icon: Calendar },
    { id: 'messages', label: 'Messages & Calling', icon: MessageSquare, badgeCount: unreadMessagesCount },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F19]/95 backdrop-blur-xl border-b border-[#1F293D]/80 transition-colors">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Hamburger (Visible on < xl screens) */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="xl:hidden w-10 h-10 -ml-1 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition active:scale-95"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer select-none group flex-shrink-0"
          >
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#13192B] to-[#1E2742] border border-orange-500/40 p-1 flex items-center justify-center shadow-lg shadow-orange-500/10 group-hover:border-orange-400 transition">
              <img
                src="/assets/aistudio/image_a5d9fbb6.png"
                alt="COOK"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5E1E] fill-[#FF5E1E] absolute inset-auto opacity-30" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-white flex items-center">
                  COOK<span className="text-[#FF5E1E]">.</span>
                </span>
                <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FF5E1E]/20 text-[#FF5E1E] border border-[#FF5E1E]/30">
                  AI STARTUPS
                </span>
              </div>
              <span className="hidden sm:inline text-[10px] text-gray-400 font-medium tracking-tight">
                Got an Idea? Let It Cook.
              </span>
            </div>
          </div>
        </div>

        {/* Global Search Bar (Desktop / Laptop) */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-xs xl:max-w-md hidden md:block"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="Search startups, ideas, people... (⌘K)"
              className="w-full pl-10 pr-12 py-2 text-xs sm:text-sm bg-[#13192B] border border-[#1F293D] rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5E1E] focus:ring-1 focus:ring-[#FF5E1E]/40 transition"
            />
            <div className="absolute right-3 hidden lg:flex items-center gap-0.5 text-[10px] font-mono text-gray-400 bg-gray-800/80 px-1.5 py-0.5 rounded border border-gray-700">
              ⌘K
            </div>
          </div>
        </form>

        {/* Desktop Navigation Links (xl+ screens) */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'notifications') {
                    setNotificationsOpen(!notificationsOpen);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`relative px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#1E2640] text-white shadow-sm border border-indigo-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-[#13192B]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF5E1E]' : ''}`} />
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#FF5E1E] text-white text-[9px] font-bold flex items-center justify-center leading-none ring-2 ring-[#0B0F19]">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </div>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FF5E1E] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Search Toggle Icon */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden w-10 h-10 rounded-xl text-gray-400 hover:text-white flex items-center justify-center active:scale-95 transition"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Quick Raise Funds Button (Tablet & Desktop) */}
          <button
            onClick={onOpenRaiseFundsModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF5E1E]/15 hover:bg-[#FF5E1E]/25 text-[#FF5E1E] border border-[#FF5E1E]/40 text-xs font-bold transition whitespace-nowrap active:scale-95"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Raise Funds</span>
          </button>

          {/* Quick Create Post Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/25 transition cursor-pointer whitespace-nowrap active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Post Idea</span>
          </button>

          {/* Theme Switcher Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle theme"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#13192B] border border-[#1F293D] text-gray-400 hover:text-white flex items-center justify-center transition active:scale-95"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full bg-[#13192B] border border-[#1F293D] hover:border-gray-700 transition active:scale-95 min-h-[40px]"
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-indigo-500/40"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";
                  }}
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#13192B]" />
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:inline mr-1" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#13192B] border border-[#1F293D] shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-[#1F293D] flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-white truncate">{user.name}</p>
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">@{user.username}</p>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-medium mt-1">
                      {user.primaryRole || user.role}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenProfile();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>View & Edit Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('funding');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    <span>My Startup Pitches</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai-mentor');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <Sparkles className="w-4 h-4 text-[#FF5E1E]" />
                    <span>AI Startup Mentor</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[#1F293D]">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onSignOut?.();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {mobileSearchOpen && (
        <div className="md:hidden p-3 bg-[#0B0F19] border-b border-[#1F293D] animate-in slide-in-from-top-2">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search startups, posts, people..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#13192B] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5E1E]"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-[#FF5E1E] text-white text-xs font-bold rounded-xl"
            >
              Go
            </button>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Slide-Over Navigation Drawer (For iPhones, Android & Tablets) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 xl:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative w-80 max-w-[85vw] bg-[#13192B] border-r border-[#1F293D] flex flex-col h-full shadow-2xl z-10 p-5 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1F293D]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1E2742] border border-orange-500/40 p-1 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-[#FF5E1E] fill-[#FF5E1E]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">COOK</h3>
                  <p className="text-[10px] text-gray-400">Got an Idea? Let It Cook.</p>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Snapshot in Drawer */}
            <div className="my-4 p-3 rounded-2xl bg-[#0B0F19] border border-gray-800 flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-11 h-11 rounded-full object-cover border border-indigo-500"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white text-xs truncate">{user.name}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                </div>
                <p className="text-[10px] text-gray-400 truncate">{user.headline || user.title}</p>
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setActiveTab('profile');
                    onOpenProfile();
                  }}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 mt-0.5 block"
                >
                  View Profile & Experience →
                </button>
              </div>
            </div>

            {/* Full Drawer Navigation Links */}
            <div className="space-y-1 flex-1">
              {drawerLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => {
                      setActiveTab(link.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : link.highlight ? 'text-[#FF5E1E]' : 'text-gray-400'}`} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FF5E1E] text-white">
                        {link.badge}
                      </span>
                    )}
                    {link.badgeCount && link.badgeCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FF5E1E] text-white text-[10px] font-bold">
                        {link.badgeCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 mt-auto border-t border-[#1F293D] space-y-2">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onOpenRaiseFundsModal();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FF5E1E] to-[#FF7A00] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <DollarSign className="w-4 h-4" />
                <span>Raise Funds for Startup</span>
              </button>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                <span>Theme: {darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="px-2.5 py-1 rounded-lg bg-gray-800 text-white text-xs font-semibold"
                >
                  Toggle
                </button>
              </div>

              {onSignOut && (
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onSignOut();
                  }}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of COOK</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {notificationsOpen && (
        <div className="absolute right-4 sm:right-24 top-14 sm:top-16 w-80 sm:w-96 rounded-2xl bg-[#13192B] border border-[#1F293D] shadow-2xl p-4 z-50 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
            <h4 className="font-bold text-white text-sm">Notifications</h4>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 py-3 max-h-80 overflow-y-auto">
            <div className="flex gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
              <span className="w-8 h-8 rounded-full bg-[#FF5E1E]/20 text-[#FF5E1E] flex items-center justify-center font-bold">
                🔥
              </span>
              <div>
                <p className="text-gray-200">
                  <span className="font-bold text-white">Elena Rostova</span> expressed interest in your startup{' '}
                  <span className="text-[#FF5E1E]">TechNova</span>.
                </p>
                <span className="text-[10px] text-gray-500">10m ago</span>
              </div>
            </div>
            <div className="flex gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
              <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                💬
              </span>
              <div>
                <p className="text-gray-200">
                  <span className="font-bold text-white">Sarah Ahmed</span> commented on your post: "The glassmorphic..."
                </p>
                <span className="text-[10px] text-gray-500">1h ago</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
