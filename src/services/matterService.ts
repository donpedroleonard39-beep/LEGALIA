import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import {
  Matter,
  MatterDocument,
  TimelineEvent,
  Reminder,
  AppNotification,
  UserProfile,
  MatterInvite,
  MatterPermission,
} from '../types';

const MATTERS_COLLECTION = 'matters';
const REMINDERS_COLLECTION = 'reminders';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

let localMattersStore: Matter[] = [];

function genToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function fetchAllMatters(userId: string): Promise<Matter[]> {
  try {
    const q = query(collection(db, MATTERS_COLLECTION), where(`members.${userId}`, 'in', ['owner', 'editor', 'viewer']));
    const querySnapshot = await getDocs(q);
    const matters: Matter[] = [];
    querySnapshot.forEach((d) => matters.push({ id: d.id, ...(d.data() as Omit<Matter, 'id'>) }));
    matters.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    localMattersStore = matters;
    return matters;
  } catch (err) {
    console.warn('Firestore fetch notice:', err);
    return localMattersStore;
  }
}

export async function fetchMatterById(id: string): Promise<Matter | null> {
  try {
    const docRef = doc(db, MATTERS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Matter;
    }
  } catch (err) {
    console.warn('Firestore fetch error for id:', id, err);
  }
  return localMattersStore.find((m) => m.id === id) || null;
}

export async function checkSuitNumberUnique(suitNumber: string, currentMatterId?: string): Promise<boolean> {
  const normalized = suitNumber.trim().toLowerCase();
  try {
    const q = query(collection(db, MATTERS_COLLECTION), where('suitNumber', '==', suitNumber.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const match = snap.docs.find(d => d.id !== currentMatterId);
      if (match) return false;
    }
    return true;
  } catch (err) {
    console.warn('Firestore unique check fallback to local:', err);
  }
  return !localMattersStore.find((m) => m.suitNumber.toLowerCase() === normalized && m.id !== currentMatterId);
}

export async function saveMatter(
  matterData: Omit<Matter, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'members'>,
  currentUserId: string,
  currentUserName: string
): Promise<Matter> {
  const isUnique = await checkSuitNumberUnique(matterData.suitNumber);
  if (!isUnique) throw new Error(`Suit Number "${matterData.suitNumber}" already exists.`);

  const newId = `matter_${Date.now()}`;
  const now = new Date().toISOString();

  const newMatter: Matter = {
    ...matterData,
    id: newId,
    ownerId: currentUserId,
    ownerName: currentUserName,
    members: { [currentUserId]: 'owner' },
    createdBy: currentUserId,
    createdByName: currentUserName,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, MATTERS_COLLECTION, newId), newMatter);
  localMattersStore.unshift(newMatter);
  return newMatter;
}

export async function updateMatterDetails(
  id: string,
  updatedFields: Partial<Matter>,
  currentUserId: string,
  currentUserName: string
): Promise<Matter> {
  const existing = await fetchMatterById(id);
  if (!existing) throw new Error('Matter not found');

  const updated: Matter = { ...existing, ...updatedFields, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, MATTERS_COLLECTION, id), { ...updatedFields, updatedAt: updated.updatedAt });
  return updated;
}

export async function deleteMatterById(id: string): Promise<void> {
  await deleteDoc(doc(db, MATTERS_COLLECTION, id));
  localMattersStore = localMattersStore.filter((m) => m.id !== id);
}

export async function generateInviteLink(
  matterId: string,
  permission: Exclude<MatterPermission, 'owner'>
): Promise<string> {
  const matter = await fetchMatterById(matterId);
  if (!matter) throw new Error('Matter not found');

  const invite: MatterInvite = {
    id: `invite_${Date.now()}`,
    matterId: matter.id,
    matterSuitNumber: matter.suitNumber,
    matterTitle: matter.title,
    email: '',
    invitedBy: '',
    invitedByName: '',
    status: 'pending',
    permission,
    token: genToken(),
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(collection(db, MATTERS_COLLECTION, matter.id, 'invites'), invite.id), invite);
  return `${window.location.origin}/invite/${matterId}/${invite.id}?token=${invite.token}`;
}

export async function fetchInvite(matterId: string, inviteId: string): Promise<MatterInvite | null> {
  const snap = await getDoc(doc(db, MATTERS_COLLECTION, matterId, 'invites', inviteId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as MatterInvite) : null;
}

export async function acceptInvite(
  matterId: string,
  inviteId: string,
  token: string,
  currentUserId: string
): Promise<Matter> {
  const invite = await fetchInvite(matterId, inviteId);
  if (!invite || invite.token !== token) throw new Error('Invalid invite link.');
  
  const matter = await fetchMatterById(matterId);
  if (!matter) throw new Error('Matter not found');

  const members = { ...matter.members, [currentUserId]: invite.permission };
  await updateDoc(doc(db, MATTERS_COLLECTION, matterId), { members, updatedAt: new Date().toISOString() });
  await updateDoc(doc(db, MATTERS_COLLECTION, matterId, 'invites', inviteId), { status: 'accepted' });

  return { ...matter, members };
}

export async function fetchTimelineEvents(matterId: string): Promise<TimelineEvent[]> {
  const snap = await getDocs(collection(db, MATTERS_COLLECTION, matterId, 'timeline'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TimelineEvent)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addTimelineEvent(matterId: string, event: Omit<TimelineEvent, 'id' | 'matterId' | 'createdAt'>): Promise<TimelineEvent> {
  const newEvent: TimelineEvent = { ...event, id: `time_${Date.now()}`, matterId, createdAt: new Date().toISOString() };
  await setDoc(doc(collection(db, MATTERS_COLLECTION, matterId, 'timeline'), newEvent.id), newEvent);
  return newEvent;
}

export async function fetchMatterDocuments(matterId: string): Promise<MatterDocument[]> {
  const snap = await getDocs(collection(db, MATTERS_COLLECTION, matterId, 'documents'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MatterDocument)).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export async function uploadMatterDocument(matterId: string, file: File, meta: any, onProgress?: (pct: number) => void): Promise<MatterDocument> {
  const storagePath = `matters/${matterId}/${meta.uploadedBy}_${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);

  const downloadURL = await new Promise<string>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed', (snapshot) => onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)), reject, async () => resolve(await getDownloadURL(task.snapshot.ref)));
  });

  const newDoc: MatterDocument = { id: `doc_${Date.now()}`, matterId, fileName: file.name, storagePath, downloadURL, fileSize: file.size, fileType: file.type, docType: meta.docType, uploadedBy: meta.uploadedBy, uploadedByName: meta.uploadedByName, uploadedAt: new Date().toISOString(), version: 1, description: meta.description };
  await setDoc(doc(collection(db, MATTERS_COLLECTION, matterId, 'documents'), newDoc.id), newDoc);
  return newDoc;
}

export async function deleteMatterDocument(matterId: string, matterDoc: MatterDocument): Promise<void> {
  try { await deleteObject(ref(storage, matterDoc.storagePath)); } catch (err) {}
  await deleteDoc(doc(db, MATTERS_COLLECTION, matterId, 'documents', matterDoc.id));
}

export async function fetchUserReminders(userId: string): Promise<Reminder[]> {
  const q = query(collection(db, REMINDERS_COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Reminder));
}

export async function createReminder(reminder: Omit<Reminder, 'id' | 'createdAt' | 'fired'>): Promise<Reminder> {
  const newRem: Reminder = { ...reminder, id: `rem_${Date.now()}`, fired: false, createdAt: new Date().toISOString() };
  await setDoc(doc(db, REMINDERS_COLLECTION, newRem.id), newRem);
  return newRem;
}

export async function deleteReminder(id: string): Promise<void> {
  await deleteDoc(doc(db, REMINDERS_COLLECTION, id));
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
}

export async function notifyMatterTeam(matter: Matter, message: string, type: any, excludeUid?: string): Promise<void> {
  const recipients = Object.keys(matter.members).filter(uid => uid !== excludeUid);
  await Promise.all(recipients.map(uid => addDoc(collection(db, NOTIFICATIONS_COLLECTION), { userId: uid, matterId: matter.id, suitNumber: matter.suitNumber, type, message, read: false, createdAt: new Date().toISOString() })));
}

export function searchConflictOfInterest(queryStr: string, matters: Matter[]): any {
  const term = queryStr.trim().toLowerCase();
  if (!term || term.length < 2) return { directPartyMatches: [], plotMatches: [], counselMatches: [] };
  const directPartyMatches = matters.filter(m => m.plaintiffs.some(p => p.toLowerCase().includes(term)) || m.defendants.some(d => d.toLowerCase().includes(term)) || m.title.toLowerCase().includes(term));
  const plotMatches = matters.filter(m => m.plot?.toLowerCase().includes(term) && !directPartyMatches.includes(m));
  const counselMatches = matters.filter(m => m.appearances?.toLowerCase().includes(term));
  return { directPartyMatches, plotMatches, counselMatches };
}
