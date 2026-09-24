import React, { useMemo, useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { sendCollaboratorInvite, type PendingCollabInvite } from '../../services/collabService';
import type { Matter } from '../../types';

type Access = 'none' | 'viewer' | 'editor';

interface AddMattersModalProps {
  person: { uid: string; name: string; email: string };
  /** Matters the signed-in user owns. */
  owned: Matter[];
  /** Invitations already waiting for this person, so we can label those matters. */
  pendingForPerson: PendingCollabInvite[];
  onClose: () => void;
  onSent: () => void;
}

// Offer an existing collaborator more of your matters. Each matter gets its
// own permission. They receive a fresh invitation in Notifications and accept
// or decline it; nothing changes on matters they can already open.
export const AddMattersModal: React.FC<AddMattersModalProps> = ({ person, owned, pendingForPerson, onClose, onSent }) => {
  const { showToast } = useNotifications();
  const [access, setAccess] = useState<Record<string, Access>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const pendingIds = useMemo(
    () => new Set(pendingForPerson.flatMap((i) => i.grants.map((g) => g.matterId))),
    [pendingForPerson],
  );
  // Only matters they cannot open yet.
  const available = useMemo(() => owned.filter((m) => !m.members[person.uid]), [owned, person.uid]);
  const chosen = Object.entries(access).filter(([, level]) => level !== 'none') as Array<[string, 'viewer' | 'editor']>;

  const setAll = (level: Access) => setAccess(Object.fromEntries(available.map((m) => [m.id, level])));

  const submit = async () => {
    setError('');
    if (!person.email) return setError('We could not find this person’s email. Refresh the page and try again.');
    if (chosen.length === 0) return setError('Choose at least one matter and what they can do on it.');
    setSending(true);
    try {
      await sendCollaboratorInvite(person.email, chosen.map(([matterId, permission]) => ({ matterId, permission })));
      showToast('Invitation sent', `${person.name} will see it in Notifications and can accept or decline.`, 'success');
      onSent();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not send the invitation.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-matters-title">
      <div className="modal-shell max-w-xl">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="modal-icon"><FolderPlus className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h2 id="add-matters-title" className="font-serif-title text-[19px] font-semibold">Add matters for {person.name}</h2>
              <p className="truncate text-[13px] text-[var(--text-muted)]">{person.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="modal-body">
          <p className="text-[14px] text-[var(--text-muted)]">
            Pick the matters and what they can do on each. They’ll get an invitation to accept. Their access to matters they already have stays the same.
          </p>

          {available.length === 0 ? (
            <p className="mt-5 rounded-xl border border-[var(--border-subtle)] p-4 text-[14px] text-[var(--text-muted)]">
              {person.name} already has access to all of your matters.
            </p>
          ) : (
            <>
              <div className="mb-2 mt-5 flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium">Your matters they can’t open yet</span>
                <span className="flex gap-3 text-[13px]">
                  <button type="button" onClick={() => setAll('viewer')} className="text-action">All: view</button>
                  <button type="button" onClick={() => setAll('none')} className="text-action">Clear</button>
                </span>
              </div>
              <div className="max-h-[320px] divide-y divide-[var(--border-subtle)] overflow-y-auto rounded-xl border border-[var(--border-subtle)]">
                {available.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[12px] text-[var(--gold)]">
                        {m.suitNumber}
                        {pendingIds.has(m.id) && <span className="ml-2 font-sans text-[12px] text-[var(--caution-amber)]">· already invited, awaiting reply</span>}
                      </p>
                      <p className="truncate text-[14px] text-[var(--text-main)]">{m.title}</p>
                    </div>
                    <select
                      value={access[m.id] || 'none'}
                      onChange={(e) => setAccess((cur) => ({ ...cur, [m.id]: e.target.value as Access }))}
                      className="field-control shrink-0 text-[13px] !py-1.5"
                      aria-label={`Access to ${m.suitNumber}`}
                    >
                      <option value="none">Don’t add</option>
                      <option value="viewer">Can view</option>
                      <option value="editor">Can edit</option>
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {error && <p className="mt-4 text-[13px] text-[var(--alert-red)]">{error}</p>}

          <div className="modal-footer mt-5">
            <span className="mr-auto text-[13px] text-[var(--text-muted)]">{chosen.length} matter{chosen.length === 1 ? '' : 's'} selected</span>
            <button onClick={onClose} className="button-secondary">Cancel</button>
            <button onClick={submit} disabled={sending || available.length === 0} className="button-primary">
              {sending ? 'Sending…' : 'Send invitation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
