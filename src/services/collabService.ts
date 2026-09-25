import { auth } from '../firebase/config';
import type { MatterPermission } from '../types';

// Client for the server endpoints: api/collab-invites.ts (invitations) and
// api/account.ts (membership changes and deletion).
// All access changes happen on the server; this only carries the request
// together with the signed-in user's ID token.

type SharedPermission = Exclude<MatterPermission, 'owner'>;

export interface CollabGrantInput { matterId: string; permission: SharedPermission }
export interface PendingCollabInvite {
  id: string;
  email: string;
  grants: Array<{ matterId: string; permission: SharedPermission; suitNumber: string; title: string }>;
  createdAt: string;
}

async function call<T>(payload: Record<string, unknown>, endpoint = '/api/collab-invites'): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in first.');
  const idToken = await user.getIdToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Something went wrong. Please try again.');
  return body as T;
}

export const sendCollaboratorInvite = (email: string, grants: CollabGrantInput[]) =>
  call<{ id: string; matterCount: number }>({ action: 'create', email, grants });

export const listPendingCollabInvites = () =>
  call<{ invites: PendingCollabInvite[] }>({ action: 'list' }).then((r) => r.invites);

export const revokeCollabInvite = (inviteId: string) =>
  call<{ ok: true }>({ action: 'revoke', inviteId });

export const respondToCollabInvite = (inviteId: string, accept: boolean) =>
  call<{ status: 'accepted' | 'declined'; matterIds: string[] }>({ action: 'respond', inviteId, accept });

export const acceptInviteLink = (matterId: string, inviteId: string, token: string) =>
  call<{ ok: true; matterId: string; alreadyMember: boolean }>({ action: 'accept-link', matterId, inviteId, token });

export const peekInviteLink = (matterId: string, inviteId: string, token: string) =>
  call<{ matterSuitNumber: string; matterTitle: string }>({ action: 'peek-link', matterId, inviteId, token });

// ---- api/account.ts: membership and deletion (server-checked) ----
const account = <T>(payload: Record<string, unknown>) => call<T>(payload, '/api/account');

export const setMemberPermissionApi = (matterId: string, memberId: string, permission: SharedPermission) =>
  account<{ ok: true }>({ action: 'set-permission', matterId, memberId, permission }).then(() => undefined);

export const removeMemberApi = (matterId: string, memberId: string) =>
  account<{ ok: true }>({ action: 'remove-member', matterId, memberId }).then(() => undefined);

export const deleteMatterApi = (matterId: string) =>
  account<{ ok: true }>({ action: 'delete-matter', matterId }).then(() => undefined);

export const deleteAccountApi = () =>
  account<{ ok: true; mattersDeleted: number }>({ action: 'delete-account', confirm: 'DELETE' });
