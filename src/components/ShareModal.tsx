import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Mail,
  MessageSquare,
  Globe,
  ExternalLink,
  FileText,
  Bookmark,
  Send,
} from 'lucide-react';

export interface ShareItem {
  id: string;
  type: 'post' | 'startup' | 'funding' | 'clip' | 'profile' | 'community' | 'event' | 'resource';
  title: string;
  description: string;
  url?: string;
  imageUrl?: string;
  authorName?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShareItem | null;
  onShareComplete?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, item, onShareComplete }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://cook.app';
  const canonicalUrl = item.url || `${currentOrigin}/${item.type}/${item.id}`;
  const shareTitle = item.title || 'Check this out on COOK — Got an Idea? Let It Cook.';
  const shareText = `${item.title ? item.title + ': ' : ''}${item.description || ''}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const copyToClipboard = async (text: string, key: string, label: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedKey(key);
      showToast(`${label} copied to clipboard!`);
      if (onShareComplete) onShareComplete();
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      showToast('Could not copy automatically. Please copy manually.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: canonicalUrl,
        });
        showToast('Shared successfully!');
        if (onShareComplete) onShareComplete();
        onClose();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          showToast('Native share closed');
        }
      }
    } else {
      copyToClipboard(canonicalUrl, 'link', 'Link');
    }
  };

  const safeOpenUrl = (targetUrl: string) => {
    try {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.location.href = targetUrl;
    }
  };

  // Direct platform sharing links
  const socialPlatforms = [
    {
      name: 'WhatsApp',
      icon: '💬',
      bgColor: 'bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border-[#25D366]/30',
      action: () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n\n' + canonicalUrl)}`;
        safeOpenUrl(url);
        if (onShareComplete) onShareComplete();
      },
    },
    {
      name: 'Telegram',
      icon: '✈️',
      bgColor: 'bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#0088cc] border-[#0088cc]/30',
      action: () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(shareTitle)}`;
        safeOpenUrl(url);
        if (onShareComplete) onShareComplete();
      },
    },
    {
      name: 'X (Twitter)',
      icon: '𝕏',
      bgColor: 'bg-white/10 hover:bg-white/20 text-white border-white/20',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.slice(0, 200))}&url=${encodeURIComponent(canonicalUrl)}&hashtags=COOK,Startups,BuildingInPublic`;
        safeOpenUrl(url);
        if (onShareComplete) onShareComplete();
      },
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      bgColor: 'bg-[#0077b5]/20 hover:bg-[#0077b5]/30 text-[#0077b5] border-[#0077b5]/30',
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`;
        safeOpenUrl(url);
        if (onShareComplete) onShareComplete();
      },
    },
    {
      name: 'Reddit',
      icon: '🤖',
      bgColor: 'bg-[#ff4500]/20 hover:bg-[#ff4500]/30 text-[#ff4500] border-[#ff4500]/30',
      action: () => {
        const url = `https://reddit.com/submit?url=${encodeURIComponent(canonicalUrl)}&title=${encodeURIComponent(shareTitle)}`;
        safeOpenUrl(url);
        if (onShareComplete) onShareComplete();
      },
    },
    {
      name: 'Facebook',
      icon: '📘',
      bgColor: 'bg-[#1877f2]/20 hover:bg-[#1877f2]/30 text-[#1877f2] border-[#1877f2]/30',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`;
        safeOpenUrl(url);
        if (onShareComplete) onShareComplete();
      },
    },
    {
      name: 'Email',
      icon: '✉️',
      bgColor: 'bg-[#6366F1]/20 hover:bg-[#6366F1]/30 text-[#818CF8] border-[#6366F1]/30',
      action: () => {
        const url = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\nRead more on COOK: ' + canonicalUrl)}`;
        window.location.href = url;
        if (onShareComplete) onShareComplete();
      },
    },
    {
      name: 'SMS / Text',
      icon: '📱',
      bgColor: 'bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#34D399] border-[#10B981]/30',
      action: () => {
        const url = `sms:?body=${encodeURIComponent(shareTitle + ' ' + canonicalUrl)}`;
        window.location.href = url;
        if (onShareComplete) onShareComplete();
      },
    },
  ];

  const fullPostContent = `${item.title ? item.title + '\n\n' : ''}${item.description}\n\nShared via COOK — Got an Idea? Let It Cook.\n${canonicalUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-[#FF5E1E] text-white px-5 py-2.5 rounded-full font-medium shadow-2xl flex items-center gap-2 border border-orange-400 text-sm animate-bounce">
          <Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      <div className="bg-[#13192B] border-t sm:border border-[#1F293D] rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col pb-safe">
        {/* Mobile Drag Handle Bar */}
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#1F293D]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF5E1E]/15 flex items-center justify-center text-[#FF5E1E] border border-[#FF5E1E]/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Share this {item.type}</h3>
              <p className="text-[11px] text-gray-400">Share anywhere or copy content</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Preview Card */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="bg-[#0B0F19] border border-[#1F293D] rounded-xl p-3.5 flex gap-3.5 items-center">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-800"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#6366F1]/30 to-[#FF5E1E]/30 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-xl font-bold text-white">
                C
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white truncate">{item.title || 'COOK Item'}</h4>
              <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{item.description}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[#FF5E1E]">
                <Globe className="w-3 h-3" />
                <span className="truncate">{canonicalUrl}</span>
              </div>
            </div>
          </div>

          {/* Native Web Share button if available */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF5E1E] to-[#FF7A00] hover:from-[#ff6b2d] hover:to-[#ff8d1e] text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-[#FF5E1E]/25 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via Device Menu (Any Installed App)</span>
            </button>
          )}

          {/* Direct Platform Sharing */}
          <div>
            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Share to Platform
            </h5>
            <div className="grid grid-cols-4 gap-2.5">
              {socialPlatforms.map(platform => (
                <button
                  key={platform.name}
                  onClick={platform.action}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition ${platform.bgColor}`}
                >
                  <span className="text-lg">{platform.icon}</span>
                  <span className="text-[11px] text-gray-200">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy Options */}
          <div>
            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Copy to Clipboard
            </h5>
            <div className="space-y-2">
              {/* Copy Link */}
              <div className="flex items-center justify-between p-2.5 bg-[#0B0F19] border border-[#1F293D] rounded-xl hover:border-gray-700 transition">
                <div className="flex items-center gap-2.5 truncate mr-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate text-left">
                    <p className="text-xs font-medium text-white">Copy Canonical Link</p>
                    <p className="text-[11px] text-gray-500 truncate">{canonicalUrl}</p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(canonicalUrl, 'link', 'Link')}
                  className="px-3 py-1.5 rounded-lg bg-[#6366F1]/20 hover:bg-[#6366F1]/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition flex-shrink-0"
                >
                  {copiedKey === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'link' ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>

              {/* Copy Text */}
              <div className="flex items-center justify-between p-2.5 bg-[#0B0F19] border border-[#1F293D] rounded-xl hover:border-gray-700 transition">
                <div className="flex items-center gap-2.5 truncate mr-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate text-left">
                    <p className="text-xs font-medium text-white">Copy Text / Description</p>
                    <p className="text-[11px] text-gray-500 truncate">Copies content body without link</p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(item.description, 'text', 'Text')}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium flex items-center gap-1.5 transition flex-shrink-0"
                >
                  {copiedKey === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'text' ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              {/* Copy Full Post */}
              <div className="flex items-center justify-between p-2.5 bg-[#0B0F19] border border-[#1F293D] rounded-xl hover:border-gray-700 transition">
                <div className="flex items-center gap-2.5 truncate mr-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Bookmark className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate text-left">
                    <p className="text-xs font-medium text-white">Copy Full Post</p>
                    <p className="text-[11px] text-gray-500 truncate">Includes title, description, and link</p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(fullPostContent, 'full', 'Full post')}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium flex items-center gap-1.5 transition flex-shrink-0"
                >
                  {copiedKey === 'full' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'full' ? 'Copied' : 'Copy Full'}</span>
                </button>
              </div>

              {/* Contextual Copy Button (Profile / Startup Link) */}
              {(item.type === 'profile' || item.type === 'startup' || item.type === 'funding') && (
                <div className="flex items-center justify-between p-2.5 bg-[#0B0F19] border border-[#1F293D] rounded-xl hover:border-gray-700 transition">
                  <div className="flex items-center gap-2.5 truncate mr-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate text-left">
                      <p className="text-xs font-medium text-white">
                        Copy {item.type === 'profile' ? 'Profile' : 'Startup'} Link
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">For direct outreach & bio links</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(canonicalUrl, 'special', `${item.type} link`)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium flex items-center gap-1.5 transition flex-shrink-0"
                  >
                    {copiedKey === 'special' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'special' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0B0F19]/80 border-t border-[#1F293D] flex items-center justify-between text-xs text-gray-500">
          <span>COOK Universal Share Protocol</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
