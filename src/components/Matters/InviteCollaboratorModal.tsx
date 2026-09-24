import React, { useState } from 'react';
import { Check, Copy, Link2, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { generateInviteLink } from '../../services/matterService';
import type { Matter } from '../../types';

interface InviteCollaboratorModalProps {
  /** Matters the signed-in user owns (only owners can invite). */
  matters: Matter[];
  onClose: () => void;
  onSent: () => void;
}

// One way to invite, used everywhere: a link for one matter. It works for
// people who don't have an account yet - they sign up from the link and join.
export const InviteCollaboratorModal: React.FC<InviteCollaboratorModalProps> = ({ matters, onClose, onSent }) => {
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
      try { await navigator.clipboard.writeText(url); setCopied(true); } catch { /* shown below to copy by hand */ }
    } catch {
      showToast('Could not create link', 'Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); } catch { showToast('Copy it manually', 'Select the link and copy it.', 'warning'); }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div className="modal-shell max-w-lg">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="modal-icon"><Link2 className="h-5 w-5" /></span>
            <h2 id="invite-title" className="font-serif-title text-[19px] font-semibold">Invite someone to a matter</h2>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="modal-body space-y-4">
          {matters.length === 0 ? (
            <p className="text-[14px] text-[var(--text-muted)]">You need to own at least one matter before you can invite anyone. Add a matter first.</p>
          ) : !link ? (
            <>
              <p className="text-[14px] text-[var(--text-muted)]">
                We’ll create a link. Send it by WhatsApp or email — whoever opens it and signs in (or signs up) joins the matter.
              </p>
              <label className="block text-[13px] font-medium">Matter
                <select value={matterId} onChange={(e) => setMatterId(e.target.value)} className="field-control mt-1.5 w-full">
                  {matters.map((m) => <option key={m.id} value={m.id}>{m.suitNumber} — {m.title.slice(0, 45)}</option>)}
                </select>
              </label>
              <fieldset>
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
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--verdict-green)]">
                <Check className="h-4 w-4" /> Link created{copied ? ' and copied' : ''}
              </p>
              <input readOnly value={link} onFocus={(e) => e.target.select()} className="field-control w-full font-mono text-[12px]" aria-label="Invite link" />
              <p className="text-[13px] text-[var(--text-muted)]">Paste it into WhatsApp or email. You can cancel it any time from the matter’s People tab.</p>
            </>
          )}

          <div className="modal-footer">
            <button onClick={onClose} className="button-secondary">{link ? 'Done' : 'Cancel'}</button>
            {matters.length > 0 && (link
              ? <button onClick={copy} className="button-primary"><Copy className="h-4 w-4" /> Copy again</button>
              : <button onClick={create} disabled={busy} className="button-primary">{busy ? 'Creating…' : 'Create link'}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
};
