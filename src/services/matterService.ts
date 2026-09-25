import { 
  collection, doc, getDocs, getDoc, setDoc, 
  updateDoc, deleteDoc, deleteField, query, where, addDoc, writeBatch 
} from 'firebase/firestore';
import { 
  ref, uploadBytesResumable, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { acceptInviteLink, deleteMatterApi, peekInviteLink, removeMemberApi, setMemberPermissionApi } from './collabService';
import { 
  Matter, MatterDocument, TimelineEvent, Reminder, 
  AppNotification, MatterInvite, MatterPermission 
} from '../types';

const MATTERS_COLLECTION = 'matters';
const REMINDERS_COLLECTION = 'reminders';
const NOTIFICATIONS_COLLECTION = 'notifications';

export async function fetchAllMatters(userId: string): Promise<Matter[]> {
  const q = query(
    collection(db, MATTERS_COLLECTION), 
    where(`members.${userId}`, 'in', ['owner', 'editor', 'viewer'])
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<Matter, 'id'>) }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

// Resolves a set of uids to their public profile (name/email) for display,
// e.g. in the People tab where matter.members only stores uid -> permission.
export async function fetchUserProfiles(uids: string[]): Promise<Record<string, { name: string; email: string }>> {
  const unique = Array.from(new Set(uids));
  const entries = await Promise.all(unique.map(async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.exists() ? (snap.data() as { name?: string; email?: string }) : null;
    return [uid, { name: data?.name || 'Unnamed user', email: data?.email || '' }] as const;
  }));
  return Object.fromEntries(entries);
}

export async function fetchMatterById(id: string): Promise<Matter | null> {
  const snap = await getDoc(doc(db, MATTERS_COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Matter : null;
}

export async function saveMatter(
  data: Omit<Matter, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'members'>, 
  uid: string, 
  name: string
): Promise<Matter> {
  // Random id (was a guessable timestamp).
  const id = doc(collection(db, MATTERS_COLLECTION)).id;
  const now = new Date().toISOString();
  const matter: Matter = { 
    ...data, id, ownerId: uid, ownerName: name, 
    members: { [uid]: 'owner' }, createdBy: uid, 
    createdByName: name, createdAt: now, updatedAt: now 
  };
  await setDoc(doc(db, MATTERS_COLLECTION, id), matter);
  // Hearing reminders are worked out by the server's daily job from
  // nextHearingDate - nothing else to write here.
  return matter;
}

export async function updateMatterDetails(id: string, fields: Partial<Matter>): Promise<void> {
  // The Firestore SDK throws if a field value is `undefined` - it does not
  // silently drop it. Callers (e.g. logSittingAndScheduleNext) pass
  // `undefined` on purpose to mean "clear this field", so translate that
  // into Firestore's deleteField() sentinel here, in one place.
  const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const [key, value] of Object.entries(fields)) {
    // Membership and ownership can only change on the server.
    if (['members', 'ownerId', 'createdAt', 'createdBy', 'id'].includes(key)) continue;
    payload[key] = value === undefined ? deleteField() : value;
  }
  await updateDoc(doc(db, MATTERS_COLLECTION, id), payload);
  // Hearing reminders follow nextHearingDate automatically (server job).
}

// Deletes the matter and everything under it - history, invites, files,
// reminders, notifications - on the server (api/account.ts).
export async function deleteMatterById(id: string, _currentUid?: string): Promise<void> {
  await deleteMatterApi(id);
}

// The link is fully derivable from the stored invite (matter id, invite id and
// token), so the owner can re-copy it any time from the Pending invites list.
export function buildInviteLink(invite: Pick<MatterInvite, 'matterId' | 'id' | 'token'>): string {
  return `${window.location.origin}/invite/${invite.matterId}/${invite.id}?token=${invite.token}`;
}

export async function generateInviteLink(
  matterId: string, 
  permission: Exclude<MatterPermission, 'owner'>
): Promise<string> {
  // Cryptographically random, unguessable token and id.
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const inviteId = doc(collection(db, MATTERS_COLLECTION, matterId, 'invites')).id;
  const invite: MatterInvite = { 
    id: inviteId, matterId, email: '', invitedBy: '', 
    status: 'pending', permission, token, createdAt: new Date().toISOString() 
  };
  await setDoc(doc(collection(db, MATTERS_COLLECTION, matterId, 'invites'), inviteId), invite);
  return buildInviteLink(invite);
}

// Which matter an invite link is for (checked on the server with the token).
export async function fetchInvite(matterId: string, inviteId: string, token: string): Promise<{ matterSuitNumber: string; matterTitle: string } | null> {
  return peekInviteLink(matterId, inviteId, token);
}

// Redeeming a link runs on the server (api/collab-invites, action
// 'accept-link'): the person opening it is not a member yet, so Firestore
// rules rightly stop the browser from adding them to the matter itself.
export async function acceptInvite(
  matterId: string, inviteId: string, token: string, _uid: string
): Promise<Matter> {
  await acceptInviteLink(matterId, inviteId, token);
  const matter = await fetchMatterById(matterId);
  if (!matter) throw new Error('You joined, but the matter could not be loaded. Please refresh.');
  return matter;
}

// Lists every invite (pending or accepted) on a matter, newest first, so
// the owner can see who has been invited and whether they have joined yet.
export async function fetchMatterInvites(matterId: string): Promise<MatterInvite[]> {
  const snap = await getDocs(collection(db, MATTERS_COLLECTION, matterId, 'invites'));
  return snap.docs
    .map((d) => d.data() as MatterInvite)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// Deletes a still-pending invite so its link stops working. Accepted
// invites are left alone - revoking access for someone who already joined
// is a member-removal action (removeMember), not an invite action.
export async function revokeInvite(matterId: string, inviteId: string): Promise<void> {
  await deleteDoc(doc(db, MATTERS_COLLECTION, matterId, 'invites', inviteId));
}

// Membership changes run on the server (api/account.ts), which checks that
// the caller owns the matter. The browser can no longer edit `members`.
export async function setMemberPermission(
  matter: Matter, uid: string, permission: Exclude<MatterPermission, 'owner'>
): Promise<void> {
  if (uid === matter.ownerId) throw new Error('The owner\'s permission cannot be changed.');
  await setMemberPermissionApi(matter.id, uid, permission);
}

export async function removeMember(matter: Matter, uid: string): Promise<void> {
  if (uid === matter.ownerId) throw new Error('The owner cannot be removed from their own matter.');
  await removeMemberApi(matter.id, uid);
}

export async function fetchTimelineEvents(matterId: string): Promise<TimelineEvent[]> {
  const snap = await getDocs(collection(db, MATTERS_COLLECTION, matterId, 'timeline'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as TimelineEvent))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.createdAt < b.createdAt ? 1 : -1)));
}

export async function addTimelineEvent(
  matterId: string,
  event: Omit<TimelineEvent, 'id' | 'matterId' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(db, MATTERS_COLLECTION, matterId, 'timeline'), {
    ...event, matterId, createdAt: new Date().toISOString()
  });
}

// Records what happened at a court sitting and, in the same action, rolls
// the matter's "next appearance" forward (or clears it) to match. This is
// the single entry point for "log today's sitting" - it keeps the timeline
// entry, the matter's nextHearingDate/purpose, and hearing reminders from
// ever drifting out of sync with each other, which used to require two
// separate edits (add timeline event, then separately edit the matter).
//
// If nextHearingDate is omitted/empty, the matter's next appearance is
// cleared (e.g. judgment reserved, case adjourned sine die) - the sitting
// just logged is still preserved permanently in the timeline either way.
export async function logSittingAndScheduleNext(
  matter: Matter,
  sitting: Omit<TimelineEvent, 'id' | 'matterId' | 'createdAt'>,
  next: { nextHearingDate?: string; purpose?: string }
): Promise<void> {
  await addTimelineEvent(matter.id, sitting);

  const nextHearingDate = next.nextHearingDate || undefined;
  const purpose = nextHearingDate ? (next.purpose || undefined) : undefined;

  // updateMatterDetails() treats an `undefined` value as "clear this
  // field" (see deleteField() there), so omitting a next date here
  // correctly wipes the matter's stale next-hearing info rather than
  // leaving it pointing at a date that has already passed.
  await updateMatterDetails(matter.id, {
    nextHearingDate,
    purpose,
    appearances: sitting.appearances,
    judge: sitting.judge || matter.judge,
  });
}

export async function deleteTimelineEvent(matterId: string, eventId: string): Promise<void> {
  await deleteDoc(doc(db, MATTERS_COLLECTION, matterId, 'timeline', eventId));
}

export async function uploadMatterDocument(matterId: string, file: File, meta: any): Promise<void> {
  const path = `matters/${matterId}/${Date.now()}_${file.name}`;
  const snap = await uploadBytesResumable(ref(storage, path), file);
  const url = await getDownloadURL(snap.ref);
  await addDoc(collection(db, MATTERS_COLLECTION, matterId, 'documents'), { 
    ...meta, fileName: file.name, storagePath: path, 
    downloadURL: url, uploadedAt: new Date().toISOString() 
  });
}

export async function deleteMatterDocument(matterId: string, docId: string, path: string): Promise<void> {
  try { await deleteObject(ref(storage, path)); } catch (err) {}
  await deleteDoc(doc(db, MATTERS_COLLECTION, matterId, 'documents', docId));
}

export async function fetchUserReminders(uid: string): Promise<Reminder[]> {
  const q = query(collection(db, REMINDERS_COLLECTION), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Reminder));
}

export async function createReminder(rem: any): Promise<void> {
  await addDoc(collection(db, REMINDERS_COLLECTION), { 
    ...rem, fired: false, createdAt: new Date().toISOString() 
  });
}

export async function deleteReminder(id: string): Promise<void> {
  await deleteDoc(doc(db, REMINDERS_COLLECTION, id));
}

export async function fetchNotifications(uid: string): Promise<AppNotification[]> {
  const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', uid));
  const snap = await getDocs(q);
  // Newest first (the query itself is unordered).
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as AppNotification))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// Firestore batches allow 500 writes; chunk to stay under it.
async function batchNotifications(ids: string[], apply: (batch: ReturnType<typeof writeBatch>, id: string) => void) {
  for (let i = 0; i < ids.length; i += 400) {
    const batch = writeBatch(db);
    ids.slice(i, i + 400).forEach((id) => apply(batch, id));
    await batch.commit();
  }
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  await batchNotifications(ids, (b, id) => b.update(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true }));
}

/** archived=true moves to the Archive (and marks read); false moves back to the inbox. */
export async function setNotificationsArchived(ids: string[], archived: boolean): Promise<void> {
  await batchNotifications(ids, (b, id) => b.update(
    doc(db, NOTIFICATIONS_COLLECTION, id),
    archived ? { archived: true, read: true, archivedAt: new Date().toISOString() } : { archived: false },
  ));
}

export async function deleteNotifications(ids: string[]): Promise<void> {
  await batchNotifications(ids, (b, id) => b.delete(doc(db, NOTIFICATIONS_COLLECTION, id)));
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
}
