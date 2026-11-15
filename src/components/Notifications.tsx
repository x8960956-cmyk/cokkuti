import React, { useState } from 'react';
import {
  Bell,
  Heart,
  MessageSquare,
  DollarSign,
  UserPlus,
  Check,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  Flame,
  Sparkles,
  Filter,
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../types';

interface NotificationsProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNavigateToTarget?: (targetType?: string, targetId?: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNavigateToTarget,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'likes' | 'comments' | 'funding'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'likes') return n.type === 'like';
    if (filter === 'comments') return n.type === 'comment';
    if (filter === 'funding') return n.type === 'funding_interest';
    return true;
  });

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 fill-rose-500" />
          </div>
        );
      case 'comment':
        return (
          <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 fill-indigo-400/20" />
          </div>
        );
      case 'funding_interest':
        return (
          <div className="w-8 h-8 rounded-full bg-[#FF5E1E]/20 text-[#FF5E1E] border border-[#FF5E1E]/40 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        );
      case 'follow':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  const getBadgeStyle = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'comment':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'funding_interest':
        return 'bg-[#FF5E1E]/15 text-[#FF5E1E] border-[#FF5E1E]/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatRelativeTime = (timestamp: number | string) => {
    if (typeof timestamp === 'string') return timestamp;
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <>
      {/* Invisible backdrop to dismiss on click outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Main Notification Popover Panel */}
      <div className="fixed right-2 sm:right-6 top-16 sm:top-[68px] w-[calc(100vw-1rem)] sm:w-[400px] max-w-[420px] rounded-2xl sm:rounded-3xl bg-[#13192B]/95 backdrop-blur-xl border border-[#1F293D] shadow-2xl z-50 text-xs overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-[#1F293D] bg-[#0B0F19]/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF5E1E]/15 border border-[#FF5E1E]/30 flex items-center justify-center text-[#FF5E1E]">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                Activity & Alerts
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF5E1E] text-white text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-white/5 transition flex items-center gap-1 text-[11px]"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  title="Clear all alerts"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'likes', label: '❤️ Likes' },
              { id: 'comments', label: '💬 Comments' },
              { id: 'funding', label: '🚀 Funding' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                  filter === tab.id
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List Container */}
        <div className="max-h-[380px] sm:max-h-[440px] overflow-y-auto divide-y divide-[#1F293D]/50">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                <Bell className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-semibold text-xs">No notifications yet</p>
                <p className="text-gray-400 text-[11px] max-w-xs mx-auto leading-relaxed">
                  Real-time alerts for post likes, community comments, and investor funding interest will appear here as builders interact with you.
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) onMarkAsRead(notif.id);
                  if (onNavigateToTarget && notif.targetType) {
                    onNavigateToTarget(notif.targetType, notif.targetId);
                  }
                }}
                className={`p-3.5 sm:p-4 flex gap-3 items-start transition cursor-pointer group ${
                  notif.read ? 'hover:bg-white/5 bg-transparent' : 'bg-indigo-950/20 hover:bg-indigo-950/30'
                }`}
              >
                {/* Notification Avatar / Icon */}
                <div className="relative shrink-0">
                  <img
                    src={notif.actorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={notif.actorName}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {getIconForType(notif.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs truncate">
                      {notif.actorName}
                    </span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {formatRelativeTime(notif.createdAt || notif.timestamp)}
                    </span>
                  </div>

                  <p className="text-gray-200 text-xs leading-snug break-words">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${getBadgeStyle(
                        notif.type
                      )}`}
                    >
                      {notif.type === 'funding_interest'
                        ? 'Investor Interest'
                        : notif.type === 'like'
                        ? 'Post Like'
                        : notif.type === 'comment'
                        ? 'Discussion'
                        : 'Alert'}
                    </span>

                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#FF5E1E] ring-4 ring-[#FF5E1E]/20" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#0B0F19]/80 border-t border-[#1F293D] flex items-center justify-between text-[11px] text-gray-400 px-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live real-time feed alerts</span>
          </div>
          <span className="text-gray-500 text-[10px]">COOK Real-Time Network</span>
        </div>
      </div>
    </>
  );
};
