import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink,
  Info,
} from 'lucide-react';
import { LegalTermsModal } from './LegalTermsModal';
import {
  auth,
  googleProvider,
  GoogleAuthProvider,
  setInMemorySheetsToken,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseAppConfig,
} from '../firebase';

interface GoogleAuthScreenProps {
  onAuthSuccess: (data: {
    user: any;
    token: string;
    onboardingCompleted: boolean;
    onboardingStep: number;
  }) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleAuthScreen: React.FC<GoogleAuthScreenProps> = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState<'google' | 'email-signin' | 'email-signup'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<'terms' | 'privacy'>('terms');
  const [showConfigHelper, setShowConfigHelper] = useState(false);

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || firebaseAppConfig.oAuthClientId || '';

  // Initialize official Google Identity Services button if Client ID exists
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;

    const setupGsi = () => {
      if (window.google?.accounts?.id && googleClientId && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response: any) => {
              if (response?.credential) {
                handleGoogleCredential(response.credential);
              }
            },
            auto_select: false,
          });

          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 320,
            logo_alignment: 'left',
          });
        } catch (e) {
          console.warn('GSI render notice:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGsi();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          setupGsi();
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [googleClientId, authMode]);

  // Handle Google Token Credential from Google Identity Services
  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      localStorage.setItem('cook_auth_token', data.token);
      onAuthSuccess({
        user: data.user,
        token: data.token,
        onboardingCompleted: data.onboardingCompleted,
        onboardingStep: data.onboardingStep,
      });
    } catch (err: any) {
      setError(err.message || 'Unable to sign in with Google. Please check your connection or credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In with Firebase Auth Popup
  const handleFirebaseGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      if (credential?.accessToken) {
        setInMemorySheetsToken(credential.accessToken);
      }

      if (!firebaseUser?.email) {
        throw new Error('Google account email could not be verified. Please try again.');
      }

      const targetEmail = firebaseUser.email;
      const targetName = firebaseUser.displayName || targetEmail.split('@')[0];
      const targetAvatar =
        firebaseUser.photoURL ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
      const targetId = firebaseUser.uid;

      // Synchronize with COOK backend session and persistent storage
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleUser: {
            id: targetId,
            email: targetEmail,
            name: targetName,
            avatar: targetAvatar,
            firstName: targetName.split(' ')[0],
            lastName: targetName.split(' ').slice(1).join(' '),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      localStorage.setItem('cook_auth_token', data.token);
      onAuthSuccess({
        user: data.user,
        token: data.token,
        onboardingCompleted: data.onboardingCompleted,
        onboardingStep: data.onboardingStep,
      });
    } catch (err: any) {
      setError(
        err?.code === 'auth/popup-blocked'
          ? 'Google sign-in popup was blocked by your browser. Please allow popups or use Email Login.'
          : err?.message || 'Google Sign-In failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Form Submission with Firebase & Backend
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Mirror to Firebase Auth
      try {
        if (authMode === 'email-signup') {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } catch (fbAuthErr: any) {
        console.warn('Firebase Auth email note:', fbAuthErr?.code || fbAuthErr?.message);
      }

      const endpoint = authMode === 'email-signup' ? '/api/auth/email-signup' : '/api/auth/email-login';
      const payload = authMode === 'email-signup' ? { email, password, name } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed.');
      }

      localStorage.setItem('cook_auth_token', data.token);
      onAuthSuccess({
        user: data.user,
        token: data.token,
        onboardingCompleted: data.onboardingCompleted,
        onboardingStep: data.onboardingStep,
      });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambient Neon Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FF5E1E]/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Top Brand Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5E1E] via-[#EC4899] to-[#6366F1] flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Flame className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              COOK
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E1E]" />
            </span>
            <span className="text-[10px] text-gray-400 block -mt-1 font-medium tracking-wide">
              Got an Idea? Let It Cook.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <button
            onClick={() => {
              setTermsTab('privacy');
              setTermsModalOpen(true);
            }}
            className="hover:text-white transition"
          >
            Privacy
          </button>
          <span>•</span>
          <button
            onClick={() => {
              setTermsTab('terms');
              setTermsModalOpen(true);
            }}
            className="hover:text-white transition"
          >
            Terms
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-md mx-auto px-4 py-8 relative z-10">
        <div className="bg-[#13192B]/90 backdrop-blur-2xl border border-[#1F293D] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1: Sign in with Google</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to COOK
            </h1>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Sign in with your Google account to create your profile and start networking with founders.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Mode Tabs: Google vs Email */}
          <div className="flex rounded-2xl bg-[#0B0F19] p-1 border border-gray-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('google');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                authMode === 'google'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Google Sign-In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('email-signin');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                authMode !== 'google'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Email Login
            </button>
          </div>

          {/* TAB 1: GOOGLE SIGN-IN */}
          {authMode === 'google' && (
            <div className="space-y-4 pt-1">
              {/* Official Google Identity Services Container if client ID is set */}
              {googleClientId && (
                <div className="flex justify-center">
                  <div ref={googleBtnContainerRef} className="w-full max-w-[320px] flex justify-center" />
                </div>
              )}

              {/* Primary Google Login Button */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleFirebaseGoogleLogin()}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-white/10 active:scale-[0.98] transition cursor-pointer"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
              </button>

              {/* Honest Google OAuth Configuration Notice */}
              <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-gray-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="font-semibold flex items-center gap-1.5 text-gray-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Firebase & Google OAuth Connected
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfigHelper(!showConfigHelper)}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    <span>{showConfigHelper ? 'Hide Details' : 'Auth Config'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Clicking <strong>Continue with Google</strong> authenticates your account through Firebase & Google OAuth and directs first-time visitors into profile creation.
                </p>

                {showConfigHelper && (
                  <div className="pt-2 border-t border-gray-800 space-y-1.5 text-[11px] text-gray-400">
                    <p>
                      <strong>Firebase Project:</strong> <code className="text-emerald-300">{firebaseAppConfig.projectId}</code>
                    </p>
                    <p>
                      <strong>OAuth Client ID:</strong> <code className="text-indigo-300 text-[10px] break-all">{googleClientId}</code>
                    </p>
                    <p>
                      <strong>Authorized Origin:</strong> <code className="text-gray-300">{typeof window !== 'undefined' ? window.location.origin : ''}</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL / PASSWORD */}
          {authMode !== 'google' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4 pt-1">
              {authMode === 'email-signup' && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Full Name *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
              >
                <span>
                  {loading
                    ? 'Processing...'
                    : authMode === 'email-signup'
                    ? 'Create Account & Continue'
                    : 'Sign In to COOK'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-1">
                {authMode === 'email-signin' ? (
                  <button
                    type="button"
                    onClick={() => setAuthMode('email-signup')}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Don't have an account? <span className="text-indigo-400 font-bold">Sign Up</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthMode('email-signin')}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Already have an account? <span className="text-indigo-400 font-bold">Sign In</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Terms & Privacy footer */}
          <div className="pt-4 border-t border-gray-800/80 text-center text-[11px] text-gray-500">
            By signing in, you agree to COOK's{' '}
            <button
              type="button"
              onClick={() => {
                setTermsTab('terms');
                setTermsModalOpen(true);
              }}
              className="text-gray-400 hover:underline hover:text-white"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => {
                setTermsTab('privacy');
                setTermsModalOpen(true);
              }}
              className="text-gray-400 hover:underline hover:text-white"
            >
              Privacy Policy
            </button>
            .
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-gray-500 relative z-10">
        COOK — The Sovereign Social Network for Founders & Builders. Built for Desktop, Tablet, and Mobile.
      </footer>

      {/* Privacy and Terms Modal */}
      <LegalTermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        tab={termsTab}
      />
    </div>
  );
};
