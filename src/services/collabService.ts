import { auth } from '../firebase/config';
import type { MatterPermission } from '../types';

// Client for api/collab-invites.ts (in-app collaborator invitations).
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

async function call<T>(payload: Record<string, unknown>): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in first.');
  const idToken = await user.getIdToken();
  const response = await fetch('/api/collab-invites', {
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
