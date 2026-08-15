import { 
  collection, doc, getDocs, getDoc, setDoc, 
  updateDoc, deleteDoc, query, where, addDoc 
} from 'firebase/firestore';
import { 
  ref, uploadBytesResumable, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
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
  const id = `matter_${Date.now()}`;
  const now = new Date().toISOString();
  const matter: Matter = { 
    ...data, id, ownerId: uid, ownerName: name, 
    members: { [uid]: 'owner' }, createdBy: uid, 
    createdByName: name, createdAt: now, updatedAt: now 
  };
  await setDoc(doc(db, MATTERS_COLLECTION, id), matter);
  if (matter.nextHearingDate) {
    await syncHearingReminders(matter, matter.nextHearingDate);
  }
  return matter;
}

export async function updateMatterDetails(id: string, fields: Partial<Matter>): Promise<void> {
  const before = await fetchMatterById(id);
  await updateDoc(doc(db, MATTERS_COLLECTION, id), { 
    ...fields, 
    updatedAt: new Date().toISOString() 
  });
  const hearingChanged = 'nextHearingDate' in fields && fields.nextHearingDate !== before?.nextHearingDate;
  if (hearingChanged) {
    const after = await fetchMatterById(id);
    if (after?.nextHearingDate) {
      await syncHearingReminders(after, after.nextHearingDate);
    }
  }
}

// Creates (or refreshes) a hearing reminder for every member of a matter,
// timed to fire the morning before the hearing. Uses a deterministic
// document ID keyed on matter + member + date so re-saving the same
// hearing date never creates duplicate reminders - only a genuinely new
// date produces a new reminder.
async function syncHearingReminders(matter: Matter, hearingDate: string): Promise<void> {
  const remindAt = new Date(`${hearingDate}T07:00:00`);
  remindAt.setDate(remindAt.getDate() - 1);
  const message = `Hearing tomorrow for ${matter.suitNumber} - ${matter.title}${matter.purpose ? ` (${matter.purpose})` : ''}.`;

  const memberIds = Object.keys(matter.members);
  await Promise.all(memberIds.map(async (uid) => {
    const reminderId = `hr_${matter.id}_${uid}_${hearingDate}`;
    const reminder: Reminder = {
      id: reminderId,
      userId: uid,
      matterId: matter.id,
      suitNumber: matter.suitNumber,
      remindAt: remindAt.toISOString(),
      message,
      channel: ['email', 'inApp'],
      fired: false,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, REMINDERS_COLLECTION, reminderId), reminder);
  }));
}

export async function deleteMatterById(id: string): Promise<void> {
  await deleteDoc(doc(db, MATTERS_COLLECTION, id));
}

export async function generateInviteLink(
  matterId: string, 
  permission: Exclude<MatterPermission, 'owner'>
): Promise<string> {
  const inviteId = `inv_${Date.now()}`;
  const token = Math.random().toString(36).substring(2, 15);
  const invite: MatterInvite = { 
    id: inviteId, matterId, email: '', invitedBy: '', 
    status: 'pending', permission, token, createdAt: new Date().toISOString() 
  };
  await setDoc(doc(collection(db, MATTERS_COLLECTION, matterId, 'invites'), inviteId), invite);
  return `${window.location.origin}/invite/${matterId}/${inviteId}?token=${token}`;
}

export async function fetchInvite(matterId: string, inviteId: string): Promise<MatterInvite | null> {
  const snap = await getDoc(doc(db, MATTERS_COLLECTION, matterId, 'invites', inviteId));
  return snap.exists() ? snap.data() as MatterInvite : null;
}

export async function acceptInvite(
  matterId: string, inviteId: string, token: string, uid: string
): Promise<Matter> {
  const invite = await fetchInvite(matterId, inviteId);
  if (!invite || invite.token !== token) throw new Error('Invalid invite');
  if (invite.status === 'accepted') throw new Error('This invite has already been used.');
  const matter = await fetchMatterById(matterId);
  if (!matter) throw new Error('Matter not found');
  const members = { ...matter.members, [uid]: invite.permission };
  await updateDoc(doc(db, MATTERS_COLLECTION, matterId), { 
    members, updatedAt: new Date().toISOString() 
  });
  await updateDoc(doc(collection(db, MATTERS_COLLECTION, matterId, 'invites'), inviteId), {
    status: 'accepted',
  });
  return { ...matter, members };
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

// Owner-only: change an existing member's permission between editor and
// viewer. The owner's own entry can never be changed through this path.
export async function setMemberPermission(
  matter: Matter, uid: string, permission: Exclude<MatterPermission, 'owner'>
): Promise<void> {
  if (uid === matter.ownerId) throw new Error('The owner\'s permission cannot be changed.');
  await updateDoc(doc(db, MATTERS_COLLECTION, matter.id), {
    [`members.${uid}`]: permission,
    updatedAt: new Date().toISOString(),
  });
}

// Owner-only: remove a member's access to the matter entirely. The owner
// cannot remove themselves this way - deleting a matter (or transferring
// ownership, not yet supported) is the correct path for that.
export async function removeMember(matter: Matter, uid: string): Promise<void> {
  if (uid === matter.ownerId) throw new Error('The owner cannot be removed from their own matter.');
  const { [uid]: _removed, ...remainingMembers } = matter.members;
  await updateDoc(doc(db, MATTERS_COLLECTION, matter.id), {
    members: remainingMembers,
    updatedAt: new Date().toISOString(),
  });
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
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
}
