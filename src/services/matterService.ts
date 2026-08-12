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
  return matter;
}

export async function updateMatterDetails(id: string, fields: Partial<Matter>): Promise<void> {
  await updateDoc(doc(db, MATTERS_COLLECTION, id), { 
    ...fields, 
    updatedAt: new Date().toISOString() 
  });
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
  const matter = await fetchMatterById(matterId);
  if (!matter) throw new Error('Matter not found');
  const members = { ...matter.members, [uid]: invite.permission };
  await updateDoc(doc(db, MATTERS_COLLECTION, matterId), { 
    members, updatedAt: new Date().toISOString() 
  });
  return { ...matter, members };
}

export async function addTimelineEvent(matterId: string, event: any): Promise<void> {
  await addDoc(collection(db, MATTERS_COLLECTION, matterId, 'timeline'), { 
    ...event, createdAt: new Date().toISOString() 
  });
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
