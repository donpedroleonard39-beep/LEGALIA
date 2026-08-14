import { 
  collection, doc, getDocs, getDoc, setDoc, 
  updateDoc, deleteDoc, query, where, addDoc, runTransaction 
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
const SUIT_INDEX_COLLECTION = 'suitNumberIndex';

// Suit numbers (e.g. "E/968/2022") contain slashes, which Firestore doc IDs
// can't hold directly - encode them into the index doc id.
function suitIndexId(suitNumber: string): string {
  return encodeURIComponent(suitNumber.trim());
}

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

export async function checkSuitNumberUnique(suitNumber: string, excludeId?: string): Promise<boolean> {
  if (!suitNumber.trim()) return true;
  const snap = await getDoc(doc(db, SUIT_INDEX_COLLECTION, suitIndexId(suitNumber)));
  if (!snap.exists()) return true;
  return snap.data().matterId === excludeId;
}

export function searchConflictOfInterest(searchTerm: string, matters: Matter[]): {
  directPartyMatches: Matter[];
  plotMatches: Matter[];
  counselMatches: Matter[];
} {
  const term = searchTerm.trim().toLowerCase();
  if (!term) {
    return { directPartyMatches: [], plotMatches: [], counselMatches: [] };
  }
  const directPartyMatches = matters.filter((m) =>
    m.plaintiffs.some((p) => p.toLowerCase().includes(term)) ||
    m.defendants.some((d) => d.toLowerCase().includes(term))
  );
  const plotMatches = matters.filter((m) => (m.plot || '').toLowerCase().includes(term));
  const counselMatches = matters.filter((m) => (m.appearances || '').toLowerCase().includes(term));
  return { directPartyMatches, plotMatches, counselMatches };
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
  const indexRef = doc(db, SUIT_INDEX_COLLECTION, suitIndexId(matter.suitNumber));

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(indexRef);
    if (existing.exists()) {
      throw new Error(`Suit number "${matter.suitNumber}" is already in use.`);
    }
    tx.set(doc(db, MATTERS_COLLECTION, id), matter);
    tx.set(indexRef, { suitNumber: matter.suitNumber, matterId: id, ownerId: uid });
  });

  if (matter.nextHearingDate) {
    await syncHearingReminders(matter, matter.nextHearingDate);
  }
  return matter;
}

export async function updateMatterDetails(id: string, fields: Partial<Matter>): Promise<void> {
  const before = await fetchMatterById(id);
  const suitNumberChanged = typeof fields.suitNumber === 'string' &&
    fields.suitNumber.trim() !== before?.suitNumber;

  if (suitNumberChanged && before) {
    const newIndexRef = doc(db, SUIT_INDEX_COLLECTION, suitIndexId(fields.suitNumber as string));
    const oldIndexRef = doc(db, SUIT_INDEX_COLLECTION, suitIndexId(before.suitNumber));
    await runTransaction(db, async (tx) => {
      const existing = await tx.get(newIndexRef);
      if (existing.exists()) {
        throw new Error(`Suit number "${fields.suitNumber}" is already in use.`);
      }
      tx.update(doc(db, MATTERS_COLLECTION, id), { ...fields, updatedAt: new Date().toISOString() });
      tx.set(newIndexRef, { suitNumber: fields.suitNumber, matterId: id, ownerId: before.ownerId });
      tx.delete(oldIndexRef);
    });
  } else {
    await updateDoc(doc(db, MATTERS_COLLECTION, id), { 
      ...fields, 
      updatedAt: new Date().toISOString() 
    });
  }
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
  const matter = await fetchMatterById(id);
  await deleteDoc(doc(db, MATTERS_COLLECTION, id));
  if (matter) {
    try {
      await deleteDoc(doc(db, SUIT_INDEX_COLLECTION, suitIndexId(matter.suitNumber)));
    } catch (err) {
      // Non-fatal: the matter is already gone; a stray index entry only
      // blocks re-use of that exact suit number, which is safe to leave for
      // now if this fails (e.g. a permission edge case).
    }
  }
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
