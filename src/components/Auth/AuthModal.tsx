import React, { useState } from 'react';
import { X, Scale, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: 'rgba(10,17,29,.78)' }}>
      <div
        className="relative w-full max-w-md rounded-[1.75rem] p-6"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid rgba(208,173,114,.28)',
          color: 'var(--text-main)',
          boxShadow: '0 0 0 1px rgba(208,173,114,.06), 0 8px 16px rgba(10,17,29,.28), 0 32px 64px rgba(10,17,29,.36), 0 64px 96px rgba(10,17,29,.22), inset 0 1px 0 rgba(255,255,255,.05)',
        }}
      >
        {/* Top gloss edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[1.75rem]" style={{ background: 'linear-gradient(90deg, transparent, rgba(208,173,114,.35), transparent)' }} />
        {/* Subtle gold top glow */}
        <div className="pointer-events-none absolute inset-0 rounded-[1.75rem]" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(208,173,114,.07) 0%, transparent 60%)' }} />

        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="icon-box-32">
              <Scale className="w-4 h-4" style={{ color: 'var(--gold)' }} />
            </div>
            <div className="font-serif font-semibold text-lg" style={{ color: 'var(--text-main)' }}>
              LEGALIA Access
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {pendingInvite && (
          <div className="mt-4 rounded-lg px-3 py-2.5 text-[12px] leading-5" style={{ border: '1px solid rgba(208,173,114,.35)', background: 'var(--gold-soft)', color: 'var(--text-main)' }}>
            <strong>You have been invited</strong>{pendingInvite.matterSuitNumber ? ` to ${pendingInvite.matterSuitNumber}` : ''}{pendingInvite.matterTitle ? ` · ${pendingInvite.matterTitle}` : ''}. Sign in or create an account to accept access.
          </div>
        )}

        {/* Mode Switcher */}
        <div className="mt-4 flex rounded-lg p-1 text-[13px] font-semibold" style={{ background: 'var(--bg-base)' }}>
          <button
            onClick={() => { setMode('signin'); setErrorMessage(''); }}
            className="flex-1 py-2 rounded-md transition"
            style={mode === 'signin' ? { background: 'var(--gold)', color: 'var(--ink-raised)' } : { color: 'var(--text-muted)' }}
          >
            Sign In
          </button>

          <button
            onClick={() => { setMode('signup'); setErrorMessage(''); }}
            className="flex-1 py-2 rounded-md transition"
            style={mode === 'signup' ? { background: 'var(--gold)', color: 'var(--ink-raised)' } : { color: 'var(--text-muted)' }}
          >
            Register Account
          </button>
        </div>

        {/* Google Sign in Button */}
        <button
          onClick={handleGoogle}
          className="mt-4 w-full py-2.5 px-4 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition"
          style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--text-main)' }}
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

        <div className="relative my-4 text-center text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          <div className="absolute inset-0 top-2 border-t" style={{ borderColor: 'var(--border-subtle)' }} />
          <span className="relative px-2" style={{ background: 'var(--bg-surface)' }}>or Email Credentials</span>
        </div>

        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-lg text-[12px]" style={{ background: 'rgba(189,81,75,.1)', border: '1px solid rgba(189,81,75,.3)', color: 'var(--alert-red)' }}>
            {errorMessage}
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-[13px]">
          {mode === 'signup' && (
            <label className="block font-semibold mb-1" style={{ color: 'var(--text-main)' }}>Full Name
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="field-control mt-1.5 w-full"
              />
            </label>
          )}

          <label className="block font-semibold mb-1" style={{ color: 'var(--text-main)' }}>Email Address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="counsel@lawfirm.com"
              className="field-control mt-1.5 w-full"
            />
          </label>

          <label className="block font-semibold mb-1" style={{ color: 'var(--text-main)' }}>Password
            <div className="relative mt-1.5">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-control w-full pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                style={{ color: 'var(--text-muted)' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          {mode === 'signup' && (
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              New accounts begin with a private workspace. Open matters yourself or accept invitations; access is always limited to the matters you own or have been invited to.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button-primary relative mt-2 w-full overflow-hidden group"
          >
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent)' }}
            />
            <span className="relative">{loading ? 'Processing…' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
