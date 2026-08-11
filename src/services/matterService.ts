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
  arrayUnion,
  arrayRemove,
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
  UserRole,
} from '../types';

const MATTERS_COLLECTION = 'matters';
const REMINDERS_COLLECTION = 'reminders';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

// In-memory fallback used only if a Firestore call throws (e.g. transient
// network error) - not a source of truth, and never pre-seeded with demo
// data. If Firestore is reachable this is never consulted.
let localMattersStore: Matter[] = [];
let localTimelineStore: Record<string, TimelineEvent[]> = {};
let localDocsStore: Record<string, MatterDocument[]> = {};
let localRemindersStore: Reminder[] = [];
let localNotificationsStore: AppNotification[] = [];

// --- Matters ---

/**
 * Firm staff (admin/lawyer/paralegal) get every matter in the registry, which
 * is what makes the Conflict Checker actually useful across the whole
 * practice. Everyone else (role 'client') only gets matters they've been
 * explicitly added to. This mirrors firestore.rules exactly - if you change
 * one, change the other.
 */
export async function fetchAllMatters(userId: string, isInternalStaff: boolean): Promise<Matter[]> {
  try {
    const matterCol = collection(db, MATTERS_COLLECTION);
    const q = isInternalStaff
      ? matterCol
      : query(matterCol, where('teamMembers', 'array-contains', userId));

    const querySnapshot = await getDocs(q);
    const matters: Matter[] = [];
    querySnapshot.forEach((d) => matters.push({ id: d.id, ...(d.data() as Omit<Matter, 'id'>) }));
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

  const existing = localMattersStore.find(
    (m) => m.suitNumber.toLowerCase() === normalized && m.id !== currentMatterId
  );
  return !existing;
}

export async function saveMatter(matterData: Omit<Matter, 'id' | 'createdAt' | 'updatedAt'>, currentUserId: string, currentUserName: string): Promise<Matter> {
  const isUnique = await checkSuitNumberUnique(matterData.suitNumber);
  if (!isUnique) {
    throw new Error(`Suit Number "${matterData.suitNumber}" already exists in the system.`);
  }

  const newId = `matter_${Date.now()}`;
  const now = new Date().toISOString();

  const newMatter: Matter = {
    ...matterData,
    id: newId,
    createdBy: currentUserId,
    createdByName: currentUserName,
    createdAt: now,
    updatedAt: now,
    teamMembers: Array.from(new Set([...matterData.teamMembers, currentUserId])),
  };

  await setDoc(doc(db, MATTERS_COLLECTION, newId), newMatter);
  localMattersStore.unshift(newMatter);

  await addTimelineEvent(newId, {
    date: matterData.filingDate,
    type: 'filing',
    summary: `Matter instituted with Suit No. ${matterData.suitNumber}. Presiding Judge: ${matterData.judge || 'Unassigned'}.`,
    judge: matterData.judge,
    purpose: matterData.purpose || 'Filing',
    appearances: matterData.appearances,
    createdBy: currentUserId,
    createdByName: currentUserName,
  });

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

  if (updatedFields.suitNumber && updatedFields.suitNumber !== existing.suitNumber) {
    const isUnique = await checkSuitNumberUnique(updatedFields.suitNumber, id);
    if (!isUnique) throw new Error(`Suit Number "${updatedFields.suitNumber}" already exists.`);
  }

  const updated: Matter = {
    ...existing,
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(doc(db, MATTERS_COLLECTION, id), { ...updatedFields, updatedAt: updated.updatedAt });

  const idx = localMattersStore.findIndex((m) => m.id === id);
  if (idx !== -1) localMattersStore[idx] = updated;

  if (updatedFields.status && updatedFields.status !== existing.status) {
    await addTimelineEvent(id, {
      date: new Date().toISOString().split('T')[0],
      type: 'status_change',
      summary: `Status updated from ${existing.status.toUpperCase()} to ${updatedFields.status.toUpperCase()}.`,
      createdBy: currentUserId,
      createdByName: currentUserName,
    });
    await notifyMatterTeam(updated, `Suit ${updated.suitNumber} status changed to ${updatedFields.status.toUpperCase()}.`, 'status_change', currentUserId);
  }

  if (updatedFields.nextHearingDate && updatedFields.nextHearingDate !== existing.nextHearingDate) {
    await notifyMatterTeam(
      updated,
      `Next hearing for ${updated.suitNumber} set for ${updatedFields.nextHearingDate}${updatedFields.purpose ? ` (${updatedFields.purpose})` : ''}.`,
      'hearing_upcoming',
      currentUserId
    );
  }

  return updated;
}

export async function deleteMatterById(id: string): Promise<void> {
  await deleteDoc(doc(db, MATTERS_COLLECTION, id));
  localMattersStore = localMattersStore.filter((m) => m.id !== id);
}

// --- Team Membership ---

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const normalized = email.trim().toLowerCase();
  const q = query(collection(db, USERS_COLLECTION), where('email', '==', normalized));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, USERS_COLLECTION));
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function addTeamMemberToMatter(matterId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, MATTERS_COLLECTION, matterId), {
    teamMembers: arrayUnion(uid),
    updatedAt: new Date().toISOString(),
  });
}

export async function removeTeamMemberFromMatter(matterId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, MATTERS_COLLECTION, matterId), {
    teamMembers: arrayRemove(uid),
    updatedAt: new Date().toISOString(),
  });
}

/** Admin-only in practice - Firestore rules reject this unless the caller is an admin. */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), { role });
}

// --- Timeline Service ---
export async function fetchTimelineEvents(matterId: string): Promise<TimelineEvent[]> {
  try {
    const subCol = collection(db, MATTERS_COLLECTION, matterId, 'timeline');
    const snap = await getDocs(subCol);
    const events: TimelineEvent[] = [];
    snap.forEach((d) => events.push({ id: d.id, ...d.data() } as TimelineEvent));
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localTimelineStore[matterId] = events;
    return events;
  } catch (err) {
    console.warn('Firestore timeline fetch fallback:', err);
  }
  return localTimelineStore[matterId] || [];
}

export async function addTimelineEvent(
  matterId: string,
  event: Omit<TimelineEvent, 'id' | 'matterId' | 'createdAt'>
): Promise<TimelineEvent> {
  const newEvent: TimelineEvent = {
    ...event,
    id: `time_${Date.now()}`,
    matterId,
    createdAt: new Date().toISOString(),
  };

  const subCol = collection(db, MATTERS_COLLECTION, matterId, 'timeline');
  await setDoc(doc(subCol, newEvent.id), newEvent);

  if (!localTimelineStore[matterId]) localTimelineStore[matterId] = [];
  localTimelineStore[matterId].unshift(newEvent);

  return newEvent;
}

// --- Documents Service (Firebase Storage + Firestore metadata) ---
export async function fetchMatterDocuments(matterId: string): Promise<MatterDocument[]> {
  try {
    const subCol = collection(db, MATTERS_COLLECTION, matterId, 'documents');
    const snap = await getDocs(subCol);
    const docs: MatterDocument[] = [];
    snap.forEach((d) => docs.push({ id: d.id, ...d.data() } as MatterDocument));
    docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    localDocsStore[matterId] = docs;
    return docs;
  } catch (err) {
    console.warn('Firestore docs fetch fallback:', err);
  }
  return localDocsStore[matterId] || [];
}

/**
 * Uploads the actual file bytes to Firebase Storage at
 * matters/{matterId}/{uid}_{timestamp}_{fileName}, then records the metadata
 * + download URL in Firestore. onProgress receives 0-100.
 */
export async function uploadMatterDocument(
  matterId: string,
  file: File,
  meta: {
    docType: MatterDocument['docType'];
    description?: string;
    uploadedBy: string;
    uploadedByName?: string;
  },
  onProgress?: (pct: number) => void
): Promise<MatterDocument> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `matters/${matterId}/${meta.uploadedBy}_${Date.now()}_${safeName}`;
  const storageRef = ref(storage, storagePath);

  const downloadURL = await new Promise<string>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      reject,
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (e) {
          reject(e);
        }
      }
    );
  });

  const newDoc: MatterDocument = {
    id: `doc_${Date.now()}`,
    matterId,
    fileName: file.name,
    storagePath,
    downloadURL,
    fileSize: file.size,
    fileType: file.type,
    docType: meta.docType,
    uploadedBy: meta.uploadedBy,
    uploadedByName: meta.uploadedByName,
    uploadedAt: new Date().toISOString(),
    version: 1,
    description: meta.description,
  };

  const subCol = collection(db, MATTERS_COLLECTION, matterId, 'documents');
  await setDoc(doc(subCol, newDoc.id), newDoc);

  if (!localDocsStore[matterId]) localDocsStore[matterId] = [];
  localDocsStore[matterId].unshift(newDoc);

  return newDoc;
}

export async function deleteMatterDocument(matterId: string, matterDoc: MatterDocument): Promise<void> {
  try {
    await deleteObject(ref(storage, matterDoc.storagePath));
  } catch (err) {
    // If the storage object is already gone, still remove the Firestore record.
    console.warn('Storage delete notice:', err);
  }
  await deleteDoc(doc(db, MATTERS_COLLECTION, matterId, 'documents', matterDoc.id));
  if (localDocsStore[matterId]) {
    localDocsStore[matterId] = localDocsStore[matterId].filter((d) => d.id !== matterDoc.id);
  }
}

// --- Reminders Service ---
export async function fetchUserReminders(userId: string): Promise<Reminder[]> {
  try {
    const q = query(collection(db, REMINDERS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const rems: Reminder[] = [];
    snap.forEach((d) => rems.push({ id: d.id, ...d.data() } as Reminder));
    localRemindersStore = rems;
    return rems;
  } catch (err) {
    console.warn('Firestore reminders fetch fallback:', err);
  }
  return localRemindersStore;
}

export async function createReminder(reminder: Omit<Reminder, 'id' | 'createdAt' | 'fired'>): Promise<Reminder> {
  const newRem: Reminder = {
    ...reminder,
    id: `rem_${Date.now()}`,
    fired: false,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, REMINDERS_COLLECTION, newRem.id), newRem);
  localRemindersStore.unshift(newRem);
  return newRem;
}

export async function deleteReminder(id: string): Promise<void> {
  await deleteDoc(doc(db, REMINDERS_COLLECTION, id));
  localRemindersStore = localRemindersStore.filter((r) => r.id !== id);
}

// --- Notifications Service ---
export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const notifs: AppNotification[] = [];
    snap.forEach((d) => notifs.push({ id: d.id, ...d.data() } as AppNotification));
    notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    localNotificationsStore = notifs;
    return notifs;
  } catch (err) {
    console.warn('Firestore notifications fetch fallback:', err);
  }
  return localNotificationsStore;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
  const idx = localNotificationsStore.findIndex((n) => n.id === id);
  if (idx !== -1) localNotificationsStore[idx].read = true;
}

/** Notifies every team member on a matter except `excludeUid` (usually the actor). */
export async function notifyMatterTeam(
  matter: Matter,
  message: string,
  type: AppNotification['type'],
  excludeUid?: string
): Promise<void> {
  const recipients = matter.teamMembers.filter((uid) => uid !== excludeUid);
  await Promise.all(
    recipients.map((uid) => {
      const notif: Omit<AppNotification, 'id'> = {
        userId: uid,
        matterId: matter.id,
        suitNumber: matter.suitNumber,
        type,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      };
      return addDoc(collection(db, NOTIFICATIONS_COLLECTION), notif).catch((err) =>
        console.warn('Notification create failed for', uid, err)
      );
    })
  );
}

// --- Conflict of Interest Checker Service ---
export function searchConflictOfInterest(queryStr: string, matters: Matter[]): {
  directPartyMatches: Matter[];
  plotMatches: Matter[];
  counselMatches: Matter[];
} {
  const term = queryStr.trim().toLowerCase();
  if (!term || term.length < 2) {
    return { directPartyMatches: [], plotMatches: [], counselMatches: [] };
  }

  const directPartyMatches = matters.filter(
    (m) =>
      m.plaintiffs.some((p) => p.toLowerCase().includes(term)) ||
      m.defendants.some((d) => d.toLowerCase().includes(term)) ||
      m.title.toLowerCase().includes(term)
  );

  const plotMatches = matters.filter(
    (m) => m.plot && m.plot.toLowerCase().includes(term) && !directPartyMatches.includes(m)
  );

  const counselMatches = matters.filter(
    (m) =>
      (m.leadLawyerName && m.leadLawyerName.toLowerCase().includes(term)) ||
      (m.appearances && m.appearances.toLowerCase().includes(term))
  );

  return { directPartyMatches, plotMatches, counselMatches };
}
