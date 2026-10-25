import React from 'react';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';

interface LegalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tab: 'terms' | 'privacy';
}

export const LegalTermsModal: React.FC<LegalTermsModalProps> = ({ isOpen, onClose, tab }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#13192B] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {tab === 'privacy' ? <Lock className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {tab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </h2>
            <p className="text-xs text-gray-400">COOK Professional Startup & Social Network</p>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-xs text-gray-300 leading-relaxed custom-scrollbar">
          {tab === 'privacy' ? (
            <>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">1. Information We Collect</h3>
                <p>
                  When you sign in with Google or create a COOK profile, we collect your name, email address, profile photo, username, and professional portfolio details you choose to share.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm mb-1">2. How We Protect Your Data</h3>
                <p>
                  COOK stores user data securely with encrypted sessions and protected backend storage. We do not sell your personal data or social media account links to third parties.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm mb-1">3. Social Links & External Media</h3>
                <p>
                  Any social media links (LinkedIn, X, Instagram, GitHub, etc.) and photos you add to your profile or work experience are subject to the visibility controls you configure (Public, Connections, or Private).
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm mb-1">4. Google OAuth Data</h3>
                <p>
                  Google Sign-In is used strictly for authentication and verifying your identity. COOK never accesses your Google Drive, Gmail, or private Google services without your explicit permission.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">1. Acceptance of Terms</h3>
                <p>
                  By creating an account or logging into COOK ("Got an Idea? Let It Cook."), you agree to comply with our community guidelines, professional networking policies, and respectful discourse standards.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm mb-1">2. Authentic Profiles & Intellectual Property</h3>
                <p>
                  You agree to represent your professional qualifications, roles, and startup ventures truthfully. You retain ownership of all ideas, project pitch decks, and work samples you upload.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm mb-1">3. 24-Hour Stories & Ephemeral Content</h3>
                <p>
                  COOK Stories automatically expire 24 hours after publishing. Expired stories and their attached comments are permanently purged from public view.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm mb-1">4. Account Termination</h3>
                <p>
                  COOK reserves the right to suspend or remove accounts that violate community safety, post unauthorized copyright material, or engage in malicious behavior.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="pt-5 mt-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
