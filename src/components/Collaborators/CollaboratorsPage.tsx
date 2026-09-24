import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, UserPlus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Matter, MatterPermission } from '../../types';
import { fetchUserProfiles, removeMember, setMemberPermission } from '../../services/matterService';
import { listPendingCollabInvites, revokeCollabInvite, type PendingCollabInvite } from '../../services/collabService';
import { InviteCollaboratorModal } from '../Matters/InviteCollaboratorModal';

type SharedPermission = Exclude<MatterPermission, 'owner'>;

interface CollaboratorsPageProps {
  matters: Matter[];
  /** Reload the matter list after access changes. */
  onRefresh: () => void;
}

// One place to invite people and manage who can open which of your matters.
// Access is per matter; this page just groups it by person.
export const CollaboratorsPage: React.FC<CollaboratorsPageProps> = ({ matters, onRefresh }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const [showInvite, setShowInvite] = useState(false);
  const [pending, setPending] = useState<PendingCollabInvite[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; email: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const owned = useMemo(() => matters.filter((m) => m.ownerId === currentUser?.uid), [matters, currentUser]);

  // person uid -> the owned matters they can open, with their permission
  const people = useMemo(() => {
    const map = new Map<string, Array<{ matter: Matter; permission: SharedPermission }>>();
    owned.forEach((matter) => {
      Object.entries(matter.members).forEach(([uid, role]) => {
        if (uid === matter.ownerId || role === 'owner') return;
        map.set(uid, [...(map.get(uid) || []), { matter, permission: role as SharedPermission }]);
      });
    });
    return Array.from(map.entries());
  }, [owned]);

  const loadPending = useCallback(() => {
    listPendingCollabInvites().then(setPending).catch(() => setPending([]));
  }, []);
  useEffect(loadPending, [loadPending]);

  useEffect(() => {
    const uids = people.map(([uid]) => uid);
    if (uids.length) fetchUserProfiles(uids).then(setProfiles).catch(() => {});
  }, [people]);

  const run = async (key: string, task: () => Promise<void>, done?: string) => {
    setBusy(key);
    try {
      await task();
      if (done) showToast('Done', done, 'success');
      onRefresh();
    } catch (err: any) {
      showToast('Error', err?.message || 'That did not work. Please try again.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const cancelInvite = (id: string) =>
    run(`inv_${id}`, async () => {
      await revokeCollabInvite(id);
      setPending((cur) => cur.filter((i) => i.id !== id));
    }, 'Invitation cancelled.');

  const removeFromAll = (uid: string, name: string, list: Array<{ matter: Matter }>) => {
    if (!window.confirm(`Remove ${name} from all ${list.length} of your matters they can open? They will lose access.`)) return;
    run(`all_${uid}`, async () => {
      for (const { matter } of list) await removeMember(matter, uid);
    }, 'Access removed.');
  };

  return (
    <div className="page-stack">
      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow"><Users className="h-3.5 w-3.5" /> Matter access</p>
            <h1 className="section-title">Collaborators</h1>
            <p className="mt-1 text-[12px] text-[var(--text-muted)]">
              Invite colleagues and choose which of your matters they can open, and whether they can edit.
            </p>
          </div>
          <button onClick={() => setShowInvite(true)} className="button-primary">
            <UserPlus className="h-4 w-4" /> Invite collaborator
          </button>
        </div>
      </section>

      {pending.length > 0 && (
        <section className="panel-card">
          <div className="panel-heading"><h2 className="section-title">Pending invitations</h2></div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {pending.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[var(--text-main)]">{invite.email}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {invite.grants.length} matter{invite.grants.length === 1 ? '' : 's'} offered ·{' '}
                    {invite.grants.map((g) => g.suitNumber).join(', ')} · sent {new Date(invite.createdAt).toLocaleDateString()} · awaiting response
                  </p>
                </div>
                <button onClick={() => cancelInvite(invite.id)} disabled={busy === `inv_${invite.id}`} className="button-secondary text-[11px]">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel-card">
        <div className="panel-heading"><h2 className="section-title">People with access</h2></div>
        {people.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-[var(--text-muted)]">
            You have not shared any matters yet. Invite a collaborator to get started.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {people.map(([uid, list]) => {
              const profile = profiles[uid];
              const name = profile?.name || 'Loading…';
              return (
                <div key={uid} className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[12px] font-bold text-[var(--gold)]">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[var(--text-main)]">{name}</p>
                        <p className="truncate text-[11px] text-[var(--text-muted)]">{profile?.email || ''}</p>
                      </div>
                    </div>
                    <button onClick={() => removeFromAll(uid, name, list)} disabled={busy === `all_${uid}`} className="button-secondary text-[11px]">
                      Remove from all
                    </button>
                  </div>

                  <ul className="mt-3 space-y-1.5 pl-11">
                    {list.map(({ matter, permission }) => (
                      <li key={matter.id} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-[12px] text-[var(--text-main)]">
                          <span className="font-mono text-[11px] text-[var(--gold)]">{matter.suitNumber}</span>
                          <span className="ml-2 text-[var(--text-muted)]">{matter.title}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <select
                            value={permission}
                            disabled={busy === `${matter.id}_${uid}`}
                            onChange={(e) => run(`${matter.id}_${uid}`, () => setMemberPermission(matter, uid, e.target.value as SharedPermission), 'Access updated.')}
                            className="field-control text-[11px] !py-1"
                            aria-label={`Access to ${matter.suitNumber}`}
                          >
                            <option value="editor">Can edit</option>
                            <option value="viewer">Can view</option>
                          </select>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove ${name} from ${matter.suitNumber}?`)) {
                                run(`${matter.id}_${uid}`, () => removeMember(matter, uid), 'Access removed.');
                              }
                            }}
                            disabled={busy === `${matter.id}_${uid}`}
                            className="icon-button danger"
                            aria-label={`Remove from ${matter.suitNumber}`}
                            title="Remove from this matter"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showInvite && <InviteCollaboratorModal onClose={() => setShowInvite(false)} onSent={loadPending} />}
    </div>
  );
};
