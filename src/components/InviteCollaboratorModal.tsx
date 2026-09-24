import React, { useEffect, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { fetchAllMatters } from '../../services/matterService';
import { sendCollaboratorInvite } from '../../services/collabService';
import type { Matter } from '../../types';

type Access = 'none' | 'viewer' | 'editor';

interface InviteCollaboratorModalProps {
  onClose: () => void;
  onSent: () => void;
}

// Invite an existing Legalia user by email and choose, matter by matter, what
// they may do. They get the invitation in their Notifications and accept or
// decline it there. Only matters the signed-in user owns can be shared.
export const InviteCollaboratorModal: React.FC<InviteCollaboratorModalProps> = ({ onClose, onSent }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const [email, setEmail] = useState('');
  const [matters, setMatters] = useState<Matter[]>([]);
  const [access, setAccess] = useState<Record<string, Access>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    fetchAllMatters(currentUser.uid)
      .then((list) => setMatters(list.filter((m) => m.ownerId === currentUser.uid)))
      .catch(() => setError('Could not load your matters.'))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const ordered = matters;
  const chosen = Object.entries(access).filter(([, level]) => level !== 'none');

  const submit = async () => {
    setError('');
    if (!email.trim()) return setError('Enter the invitee’s email address.');
    if (chosen.length === 0) return setError('Choose at least one matter to share.');
    setSending(true);
    try {
      await sendCollaboratorInvite(
        email.trim(),
        chosen.map(([matterId, level]) => ({ matterId, permission: level as 'viewer' | 'editor' }))
      );
      showToast('Invitation sent', 'They will see it in their Notifications and can accept or decline.', 'success');
      onSent();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not send the invitation.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="invite-collab-title">
      <div className="modal-shell max-w-xl">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="modal-icon"><UserPlus className="h-5 w-5" /></span>
            <div>
              <p className="eyebrow">Matter access</p>
              <h2 id="invite-collab-title" className="font-serif-title text-[18px] font-semibold">Invite a collaborator</h2>
            </div>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="modal-body">
          <label className="block text-[11px] font-medium text-[var(--text-muted)]">
            Their Legalia account email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="field-control mt-1.5 w-full"
              autoFocus
            />
          </label>
          <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
            They must already have registered. The invitation appears in their Notifications.
          </p>

          <p className="mb-2 mt-5 text-[11px] font-medium text-[var(--text-muted)]">Matters they can access</p>
          <div className="max-h-[280px] divide-y divide-[var(--border-subtle)] overflow-y-auto rounded-xl border border-[var(--border-subtle)]">
            {loading ? (
              <p className="p-4 text-[12px] text-[var(--text-muted)]">Loading your matters…</p>
            ) : ordered.length === 0 ? (
              <p className="p-4 text-[12px] text-[var(--text-muted)]">You do not own any matters to share yet.</p>
            ) : (
              ordered.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-[var(--gold)]">{m.suitNumber}</p>
                    <p className="truncate text-[12px] text-[var(--text-main)]">{m.title}</p>
                  </div>
                  <select
                    value={access[m.id] || 'none'}
                    onChange={(e) => setAccess((cur) => ({ ...cur, [m.id]: e.target.value as Access }))}
                    className="field-control shrink-0 text-[11px] !py-1"
                    aria-label={`Access to ${m.suitNumber}`}
                  >
                    <option value="none">No access</option>
                    <option value="viewer">Can view</option>
                    <option value="editor">Can edit</option>
                  </select>
                </div>
              ))
            )}
          </div>

          {error && <p className="mt-4 text-[12px] text-[var(--alert-red)]">{error}</p>}
        </div>

        <div className="modal-footer">
          <span className="mr-auto text-[11px] text-[var(--text-muted)]">
            {chosen.length} matter{chosen.length === 1 ? '' : 's'} selected
          </span>
          <button onClick={onClose} className="button-secondary">Cancel</button>
          <button onClick={submit} disabled={sending} className="button-primary">
            {sending ? 'Sending…' : 'Send invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};
