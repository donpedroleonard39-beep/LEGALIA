import React, { useState } from 'react';
import { Check, Copy, Link2, Mail, UserPlus, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { generateInviteLink } from '../../services/matterService';
import { sendCollaboratorInvite } from '../../services/collabService';
import type { Matter } from '../../types';

type Access = 'none' | 'viewer' | 'editor';
type Mode = 'email' | 'link';

interface InviteCollaboratorModalProps {
  /** Matters the signed-in user owns (only owners can invite). */
  matters: Matter[];
  onClose: () => void;
  onSent: () => void;
}

// Two ways to invite:
//  - By email: tick several matters, choose a permission for each. The person
//    must already have a Legalia account; the invitation appears in their
//    Notifications and they accept or decline it.
//  - By link: one matter, works for anyone - they sign up from the link.
export const InviteCollaboratorModal: React.FC<InviteCollaboratorModalProps> = ({ matters, onClose, onSent }) => {
  const [mode, setMode] = useState<Mode>('email');
  const [email, setEmail] = useState('');

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div className="modal-shell max-w-xl">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="modal-icon"><UserPlus className="h-5 w-5" /></span>
            <h2 id="invite-title" className="font-serif-title text-[19px] font-semibold">Invite someone</h2>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="modal-body">
          {matters.length === 0 ? (
            <p className="text-[14px] text-[var(--text-muted)]">You need to own at least one matter before you can invite anyone. Add a matter first.</p>
          ) : (
            <>
              <div className="mb-5 flex rounded-xl bg-[var(--bg-base)] p-1" role="tablist">
                <TabButton active={mode === 'email'} onClick={() => setMode('email')} icon={<Mail className="h-4 w-4" />} label="By email" hint="Several matters · has an account" />
                <TabButton active={mode === 'link'} onClick={() => setMode('link')} icon={<Link2 className="h-4 w-4" />} label="By link" hint="One matter · anyone" />
              </div>
              {mode === 'email'
                ? <EmailInvite matters={matters} email={email} setEmail={setEmail} onClose={onClose} onSent={onSent} onUseLink={() => setMode('link')} />
                : <LinkInvite matters={matters} onClose={onClose} onSent={onSent} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function TabButton({ active, onClick, icon, label, hint }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; hint: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center rounded-lg px-3 py-2 transition ${active ? 'bg-[var(--bg-surface)] shadow-sm' : 'hover:bg-[var(--bg-surface-hover)]'}`}
    >
      <span className={`flex items-center gap-1.5 text-[14px] font-semibold ${active ? 'text-[var(--gold)]' : 'text-[var(--text-main)]'}`}>{icon} {label}</span>
      <span className="text-[12px] text-[var(--text-muted)]">{hint}</span>
    </button>
  );
}

// ---------------------------------------------------------------- by email
function EmailInvite({ matters, email, setEmail, onClose, onSent, onUseLink }: {
  matters: Matter[]; email: string; setEmail: (v: string) => void; onClose: () => void; onSent: () => void; onUseLink: () => void;
}) {
  const { showToast } = useNotifications();
  const [access, setAccess] = useState<Record<string, Access>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [noAccount, setNoAccount] = useState(false);

  const chosen = Object.entries(access).filter(([, level]) => level !== 'none') as Array<[string, 'viewer' | 'editor']>;
  const setAll = (level: Access) => setAccess(Object.fromEntries(matters.map((m) => [m.id, level])));

  const submit = async () => {
    setError('');
    setNoAccount(false);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (chosen.length === 0) return setError('Tick at least one matter and choose what they can do on it.');
    setSending(true);
    try {
      await sendCollaboratorInvite(email.trim(), chosen.map(([matterId, permission]) => ({ matterId, permission })));
      showToast('Invitation sent', 'They will see it in their Notifications and can accept or decline.', 'success');
      onSent();
      onClose();
    } catch (err: any) {
      const message: string = err?.message || 'Could not send the invitation.';
      if (/no legalia account/i.test(message)) setNoAccount(true);
      else setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <label className="block text-[13px] font-medium">Their email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@example.com" className="field-control mt-1.5 w-full" autoFocus />
      </label>
      <p className="mt-1.5 text-[13px] text-[var(--text-muted)]">They need a Legalia account. The invitation appears in their Notifications.</p>

      <div className="mb-2 mt-5 flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium">Matters and permissions</span>
        <span className="flex gap-3">
          <button type="button" onClick={() => setAll('viewer')} className="text-action">All: view</button>
          <button type="button" onClick={() => setAll('editor')} className="text-action">All: edit</button>
          <button type="button" onClick={() => setAll('none')} className="text-action">Clear</button>
        </span>
      </div>
      <div className="max-h-[300px] divide-y divide-[var(--border-subtle)] overflow-y-auto rounded-xl border border-[var(--border-subtle)]">
        {matters.map((m) => {
          const level = access[m.id] || 'none';
          return (
            <div key={m.id} className="flex items-center gap-3 p-3">
              <input
                type="checkbox"
                checked={level !== 'none'}
                onChange={(e) => setAccess((cur) => ({ ...cur, [m.id]: e.target.checked ? 'viewer' : 'none' }))}
                className="h-4 w-4 shrink-0 accent-[var(--gold)]"
                aria-label={`Share ${m.suitNumber}`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[12px] text-[var(--gold)]">{m.suitNumber}</p>
                <p className="truncate text-[14px] text-[var(--text-main)]">{m.title}</p>
              </div>
              <select
                value={level}
                onChange={(e) => setAccess((cur) => ({ ...cur, [m.id]: e.target.value as Access }))}
                className="field-control shrink-0 text-[13px] !py-1.5"
                aria-label={`Permission for ${m.suitNumber}`}
              >
                <option value="none">No access</option>
                <option value="viewer">Can view</option>
                <option value="editor">Can edit</option>
              </select>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-4 text-[13px] text-[var(--alert-red)]">{error}</p>}
      {noAccount && (
        <div className="mt-4 rounded-lg border border-[rgba(183,120,36,.35)] bg-[rgba(183,120,36,.08)] p-3 text-[14px]">
          No Legalia account uses <strong>{email.trim()}</strong> yet. Send them an invite link instead — they can sign up from it.
          <button type="button" onClick={onUseLink} className="button-secondary mt-2 w-full"><Link2 className="h-4 w-4" /> Create an invite link</button>
        </div>
      )}

      <div className="modal-footer mt-5">
        <span className="mr-auto text-[13px] text-[var(--text-muted)]">{chosen.length} matter{chosen.length === 1 ? '' : 's'} selected</span>
        <button onClick={onClose} className="button-secondary">Cancel</button>
        <button onClick={submit} disabled={sending} className="button-primary">{sending ? 'Sending…' : 'Send invitation'}</button>
      </div>
    </>
  );
}

// ----------------------------------------------------------------- by link
function LinkInvite({ matters, onClose, onSent }: { matters: Matter[]; onClose: () => void; onSent: () => void }) {
  const { showToast } = useNotifications();
  const [matterId, setMatterId] = useState(matters[0]?.id || '');
  const [permission, setPermission] = useState<'editor' | 'viewer'>('viewer');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const create = async () => {
    if (!matterId) return;
    setBusy(true);
    try {
      const url = await generateInviteLink(matterId, permission);
      setLink(url);
      onSent();
      try { await navigator.clipboard.writeText(url); setCopied(true); } catch { /* copy by hand below */ }
    } catch {
      showToast('Could not create link', 'Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); } catch { showToast('Copy it manually', 'Select the link and copy it.', 'warning'); }
  };

  if (link) {
    return (
      <>
        <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--verdict-green)]">
          <Check className="h-4 w-4" /> Link created{copied ? ' and copied' : ''}
        </p>
        <input readOnly value={link} onFocus={(e) => e.target.select()} className="field-control mt-3 w-full font-mono text-[12px]" aria-label="Invite link" />
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">Paste it into WhatsApp or email. You can cancel it any time from the matter’s People tab.</p>
        <div className="modal-footer mt-5">
          <button onClick={onClose} className="button-secondary">Done</button>
          <button onClick={copy} className="button-primary"><Copy className="h-4 w-4" /> Copy again</button>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="text-[14px] text-[var(--text-muted)]">Works for anyone, even without an account — they sign up from the link and join the matter.</p>
      <label className="mt-4 block text-[13px] font-medium">Matter
        <select value={matterId} onChange={(e) => setMatterId(e.target.value)} className="field-control mt-1.5 w-full">
          {matters.map((m) => <option key={m.id} value={m.id}>{m.suitNumber} — {m.title.slice(0, 45)}</option>)}
        </select>
      </label>
      <fieldset className="mt-4">
        <legend className="text-[13px] font-medium">What can they do?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([['viewer', 'View only', 'See details and history'], ['editor', 'View and edit', 'Update dates and record hearings']] as const).map(([id, label, hint]) => (
            <button key={id} type="button" onClick={() => setPermission(id)} aria-pressed={permission === id}
              className={`rounded-xl border p-3 text-left transition ${permission === id ? 'border-[var(--gold)] bg-[var(--gold-soft)]' : 'border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'}`}>
              <span className="block text-[14px] font-semibold">{label}</span>
              <span className="block text-[12px] text-[var(--text-muted)]">{hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="modal-footer mt-5">
        <button onClick={onClose} className="button-secondary">Cancel</button>
        <button onClick={create} disabled={busy} className="button-primary">{busy ? 'Creating…' : 'Create link'}</button>
      </div>
    </>
  );
}
