import React, { useState } from 'react';
import { X, Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingInvite?: { matterTitle?: string; matterSuitNumber?: string } | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, pendingInvite }) => {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth();
  const { showToast } = useNotifications();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
        showToast('Welcome Back', 'Signed in successfully.', 'success');
      } else {
        await signUpWithEmail(email, password, name);
        showToast('Account Created', 'Your account was registered.', 'success');
      }
      onClose();
    } catch (err: any) {
      // Show the real error and keep the modal open so the person can retry
      // - silently pretending sign-in/sign-up succeeded would be misleading.
      setErrorMessage(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMessage('');
    try {
      await loginWithGoogle();
      showToast('Google Sign In', 'Authenticated with Google.', 'success');
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12172B]/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-[#F6F3EC] dark:bg-[#1B2140] border border-[rgba(184,147,95,0.3)] shadow-2xl p-6 text-[#12172B] dark:text-[#F6F3EC]">
        
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(184,147,95,0.2)]">
          <div className="flex items-center gap-3">
            <div className="icon-box-32">
              <Scale className="w-4 h-4 text-[#B8935F]" />
            </div>
            <div className="font-serif font-semibold text-lg text-[#12172B] dark:text-[#F6F3EC]">
              LEGALIA Access
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A90AC] hover:text-[#12172B] dark:hover:text-[#F6F3EC] hover:bg-[#EDE8DC] dark:hover:bg-[#12172B] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {pendingInvite && (
          <div className="mt-4 rounded-lg border border-[rgba(184,147,95,0.35)] bg-[#B8935F]/10 px-3 py-2.5 text-[12px] leading-5 text-[#12172B] dark:text-[#F6F3EC]">
            <strong>You have been invited</strong>{pendingInvite.matterSuitNumber ? ` to ${pendingInvite.matterSuitNumber}` : ''}{pendingInvite.matterTitle ? ` · ${pendingInvite.matterTitle}` : ''}. Sign in or create an account to accept access.
          </div>
        )}

        {/* Mode Switcher */}
        <div className="mt-4 flex rounded-lg bg-[#EDE8DC] dark:bg-[#12172B] p-1 text-[13px] font-semibold">
          <button
            onClick={() => { setMode('signin'); setErrorMessage(''); }}
            className={`flex-1 py-2 rounded-md transition ${
              mode === 'signin'
                ? 'bg-[#B8935F] text-[#12172B] shadow-xs'
                : 'text-[#8A90AC]'
            }`}
          >
            Sign In
          </button>

          <button
            onClick={() => { setMode('signup'); setErrorMessage(''); }}
            className={`flex-1 py-2 rounded-md transition ${
              mode === 'signup'
                ? 'bg-[#B8935F] text-[#12172B] shadow-xs'
                : 'text-[#8A90AC]'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Google Sign in Button */}
        <button
          onClick={handleGoogle}
          className="mt-4 w-full py-2.5 px-4 rounded-lg border border-[rgba(184,147,95,0.3)] bg-[#EDE8DC] dark:bg-[#12172B] hover:bg-[#E3DDD0] dark:hover:bg-[#12172B]/80 text-[#12172B] dark:text-[#F6F3EC] text-[13px] font-semibold flex items-center justify-center gap-2 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          Continue with Google
        </button>

        <div className="relative my-4 text-center text-[11px] text-[#8A90AC] font-bold uppercase tracking-wider before:absolute before:inset-0 before:top-2 before:border-t before:border-[rgba(184,147,95,0.2)]">
          <span className="relative bg-[#F6F3EC] dark:bg-[#1B2140] px-2">or Email Credentials</span>
        </div>

        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-lg bg-[#C1554A]/10 border border-[#C1554A]/30 text-[#C1554A] text-[12px]">
            {errorMessage}
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-[13px]">
          {mode === 'signup' && (
            <div>
              <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] text-[#12172B] dark:text-[#F6F3EC] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="counsel@lawfirm.com"
              className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] text-[#12172B] dark:text-[#F6F3EC] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] text-[#12172B] dark:text-[#F6F3EC] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
            />
          </div>

          {mode === 'signup' && (
            <p className="text-[11px] text-[#8A90AC] leading-relaxed">
              New accounts begin with a private workspace. Open matters yourself or accept invitations; access is always limited to the matters you own or have been invited to.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] font-bold transition shadow-sm mt-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

      </div>
    </div>
  );
};
