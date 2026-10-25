import React from 'react';
import {
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Github,
  Globe,
  ExternalLink,
  Share2,
  UserPlus,
  Check,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { SocialLinkItem, User } from '../types';

interface ConnectWithMeProps {
  user: User;
  socialLinks?: SocialLinkItem[];
  legacySocials?: Record<string, string | undefined>;
  onConnect?: () => void;
  isConnected?: boolean;
}

export const ConnectWithMe: React.FC<ConnectWithMeProps> = ({
  user,
  socialLinks,
  legacySocials,
  onConnect,
  isConnected = false,
}) => {
  // Consolidate links from socialLinkItems and legacy socialLinks
  const items: { platform: string; name: string; url: string; icon: React.ReactNode; color: string }[] = [];

  const getPlatformMeta = (platform: string, customName?: string, rawUrl?: string) => {
    const p = platform.toLowerCase();
    switch (p) {
      case 'linkedin':
        return {
          name: customName || 'LinkedIn',
          color: 'hover:border-[#0A66C2] hover:bg-[#0A66C2]/10 text-[#0A66C2]',
          icon: <Linkedin className="w-4 h-4 text-[#0A66C2]" />,
        };
      case 'github':
        return {
          name: customName || 'GitHub',
          color: 'hover:border-white hover:bg-white/10 text-white',
          icon: <Github className="w-4 h-4 text-white" />,
        };
      case 'twitter':
      case 'x':
        return {
          name: customName || 'X (Twitter)',
          color: 'hover:border-sky-400 hover:bg-sky-400/10 text-sky-400',
          icon: <Twitter className="w-4 h-4 text-sky-400" />,
        };
      case 'instagram':
        return {
          name: customName || 'Instagram',
          color: 'hover:border-pink-500 hover:bg-pink-500/10 text-pink-400',
          icon: <Instagram className="w-4 h-4 text-pink-400" />,
        };
      case 'facebook':
        return {
          name: customName || 'Facebook',
          color: 'hover:border-blue-600 hover:bg-blue-600/10 text-blue-500',
          icon: <Facebook className="w-4 h-4 text-blue-500" />,
        };
      case 'youtube':
        return {
          name: customName || 'YouTube',
          color: 'hover:border-red-500 hover:bg-red-500/10 text-red-500',
          icon: <Youtube className="w-4 h-4 text-red-500" />,
        };
      case 'website':
      case 'portfolio':
        return {
          name: customName || 'Personal Portfolio',
          color: 'hover:border-indigo-400 hover:bg-indigo-400/10 text-indigo-400',
          icon: <Globe className="w-4 h-4 text-indigo-400" />,
        };
      case 'behance':
        return {
          name: customName || 'Behance',
          color: 'hover:border-blue-400 hover:bg-blue-400/10 text-blue-400',
          icon: <Globe className="w-4 h-4 text-blue-400" />,
        };
      case 'dribbble':
        return {
          name: customName || 'Dribbble',
          color: 'hover:border-pink-400 hover:bg-pink-400/10 text-pink-400',
          icon: <Globe className="w-4 h-4 text-pink-400" />,
        };
      case 'medium':
        return {
          name: customName || 'Medium',
          color: 'hover:border-emerald-400 hover:bg-emerald-400/10 text-emerald-400',
          icon: <Globe className="w-4 h-4 text-emerald-400" />,
        };
      default:
        return {
          name: customName || 'Website',
          color: 'hover:border-indigo-400 hover:bg-indigo-400/10 text-indigo-400',
          icon: <LinkIcon className="w-4 h-4 text-indigo-400" />,
        };
    }
  };

  // Add items from structured socialLinkItems (respecting visibility)
  if (socialLinks && socialLinks.length > 0) {
    socialLinks
      .filter((s) => s.visibility !== 'private' && s.url && s.url.trim() !== '')
      .forEach((s) => {
        const meta = getPlatformMeta(s.platform, s.platformName, s.url);
        items.push({
          platform: s.platform,
          name: meta.name,
          url: s.url,
          icon: meta.icon,
          color: meta.color,
        });
      });
  } else if (legacySocials) {
    // Fallback to legacy dictionary
    Object.entries(legacySocials).forEach(([key, val]) => {
      if (val && val.trim() !== '') {
        const meta = getPlatformMeta(key, undefined, val);
        items.push({
          platform: key,
          name: meta.name,
          url: val,
          icon: meta.icon,
          color: meta.color,
        });
      }
    });
  }

  // Also include user.website if not already in list
  if (user.website && !items.some((i) => i.url === user.website)) {
    const meta = getPlatformMeta('website', 'Personal Website', user.website);
    items.push({
      platform: 'website',
      name: meta.name,
      url: user.website,
      icon: meta.icon,
      color: meta.color,
    });
  }

  if (user.portfolioWebsite && !items.some((i) => i.url === user.portfolioWebsite)) {
    const meta = getPlatformMeta('portfolio', 'Design & Code Portfolio', user.portfolioWebsite);
    items.push({
      platform: 'portfolio',
      name: meta.name,
      url: user.portfolioWebsite,
      icon: meta.icon,
      color: meta.color,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-[#13192B]/90 backdrop-blur-xl border border-[#1F293D] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F293D]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <LinkIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Connect With Me</h3>
            <p className="text-[11px] text-gray-400">Verified links & professional social networks</p>
          </div>
        </div>

        {onConnect && (
          <button
            onClick={onConnect}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 ${
              isConnected
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-gradient-to-r from-indigo-600 to-[#6366F1] hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md shadow-indigo-500/20'
            }`}
          >
            {isConnected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Connect on COOK</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Grid of Social Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {items.map((item, idx) => (
          <a
            key={idx}
            href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between p-3 rounded-2xl bg-[#0B0F19] border border-gray-800 transition-all duration-200 group ${item.color}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-white/5 group-hover:bg-white/10 transition flex-shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-xs text-white block group-hover:text-white truncate">
                  {item.name}
                </span>
                <span className="text-[10px] text-gray-500 truncate block">
                  {item.url.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-300 flex-shrink-0 ml-2" />
          </a>
        ))}
      </div>
    </div>
  );
};
