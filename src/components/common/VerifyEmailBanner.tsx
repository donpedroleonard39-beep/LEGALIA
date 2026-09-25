import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

// Shown until an email/password account confirms its address. Verified
// accounts are required to send or accept email invitations.
export function VerifyEmailBanner() {
  const { firebaseUser, emailVerified, sendVerificationEmail, refreshVerification } = useAuth();
  const { showToast } = useNotifications();
  const [busy, setBusy] = useState(false);

  if (!firebaseUser || emailVerified) return null;

  const resend = async () => {
    setBusy(true);
    try {
      await sendVerificationEmail();
      showToast('Email sent', `Check ${firebaseUser.email} (and your spam folder).`, 'success');
    } catch (err: any) {
      showToast('Not sent', err?.message || 'Please try again.', 'error');
    } finally { setBusy(false); }
  };

  const check = async () => {
    setBusy(true);
    try {
      const ok = await refreshVerification();
      showToast(ok ? 'Email verified' : 'Not verified yet', ok ? 'Thanks — you’re all set.' : 'Click the link in the email we sent, then try again.', ok ? 'success' : 'info');
    } finally { setBusy(false); }
  };

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[rgba(183,120,36,.35)] bg-[rgba(183,120,36,.08)] p-4 sm:flex-row sm:items-center">
      <MailCheck className="h-5 w-5 shrink-0 text-[var(--caution-amber)]" />
      <p className="flex-1 text-[14px] text-[var(--text-main)]">
        <strong>Please verify your email.</strong> We sent a link to {firebaseUser.email}. Until then you can’t send or accept email invitations.
      </p>
      <div className="flex shrink-0 gap-2">
        <button onClick={check} disabled={busy} className="button-primary !min-h-[34px] !py-1.5 text-[13px]">I’ve verified</button>
        <button onClick={resend} disabled={busy} className="button-secondary !min-h-[34px] !py-1.5 text-[13px]">Resend</button>
      </div>
    </div>
  );
}

export default VerifyEmailBanner;
