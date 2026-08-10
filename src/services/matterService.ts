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
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Matter,
  MatterDocument,
  TimelineEvent,
  MatterInvite,
  Reminder,
  AppNotification,
  AuditLog,
  UserProfile,
} from '../types';
import { INITIAL_MATTERS, INITIAL_TIMELINE_EVENTS, INITIAL_DOCUMENTS } from '../utils/seedData';

const MATTERS_COLLECTION = 'matters';
const REMINDERS_COLLECTION = 'reminders';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

// Initialize memory seed state for smooth fallback if Firestore collections are empty
let localMattersStore: Matter[] = [...INITIAL_MATTERS];
let localTimelineStore: Record<string, TimelineEvent[]> = { ...INITIAL_TIMELINE_EVENTS };
let localDocsStore: Record<string, MatterDocument[]> = { ...INITIAL_DOCUMENTS };
let localRemindersStore: Reminder[] = [];
let localNotificationsStore: AppNotification[] = [
  {
    id: 'notif_1',
    userId: 'admin_demo',
    matterId: 'matter_e968_2022',
    suitNumber: 'E/968/2022',
    type: 'hearing_upcoming',
    message: 'Upcoming Hearing in E/968/2022 (Chisom vs. Mr. Ibe) on 2026-10-26 (P.T.C).',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif_2',
    userId: 'admin_demo',
    matterId: 'matter_e779_2021',
    suitNumber: 'E/779/2021',
    type: 'status_change',
    message: 'Matter E/779/2021 status changed to ADJOURNED by Barr. Chisom Okeke.',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function fetchAllMatters(userId?: string, role?: string): Promise<Matter[]> {
  try {
    const querySnapshot = await getDocs(collection(db, MATTERS_COLLECTION));
    if (!querySnapshot.empty) {
      const docsData: Matter[] = [];
      querySnapshot.forEach((d) => {
        docsData.push({ id: d.id, ...d.data() } as Matter);
      });
      localMattersStore = docsData;
      return docsData;
    }
  } catch (err) {
    console.warn('Firestore fetch failed, returning active memory store:', err);
  }
  return localMattersStore;
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

  try {
    await setDoc(doc(db, MATTERS_COLLECTION, newId), newMatter);
  } catch (err) {
    console.warn('Firestore matter create fallback:', err);
  }

  localMattersStore.unshift(newMatter);

  // Add initial timeline event
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

  try {
    await updateDoc(doc(db, MATTERS_COLLECTION, id), updatedFields);
  } catch (err) {
    console.warn('Firestore matter update fallback:', err);
  }

  const idx = localMattersStore.findIndex((m) => m.id === id);
  if (idx !== -1) localMattersStore[idx] = updated;

  // Log status change or update
  if (updatedFields.status && updatedFields.status !== existing.status) {
    await addTimelineEvent(id, {
      date: new Date().toISOString().split('T')[0],
      type: 'status_change',
      summary: `Status updated from ${existing.status.toUpperCase()} to ${updatedFields.status.toUpperCase()}.`,
      createdBy: currentUserId,
      createdByName: currentUserName,
    });
  }

  return updated;
}

export async function deleteMatterById(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, MATTERS_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore delete matter fallback:', err);
  }
  localMattersStore = localMattersStore.filter((m) => m.id !== id);
}

// --- Timeline Service ---
export async function fetchTimelineEvents(matterId: string): Promise<TimelineEvent[]> {
  try {
    const subCol = collection(db, MATTERS_COLLECTION, matterId, 'timeline');
    const snap = await getDocs(subCol);
    if (!snap.empty) {
      const events: TimelineEvent[] = [];
      snap.forEach((d) => events.push({ id: d.id, ...d.data() } as TimelineEvent));
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return events;
    }
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

  try {
    const subCol = collection(db, MATTERS_COLLECTION, matterId, 'timeline');
    await setDoc(doc(subCol, newEvent.id), newEvent);
  } catch (err) {
    console.warn('Firestore timeline add fallback:', err);
  }

  if (!localTimelineStore[matterId]) localTimelineStore[matterId] = [];
  localTimelineStore[matterId].unshift(newEvent);

  return newEvent;
}

// --- Documents Service ---
export async function fetchMatterDocuments(matterId: string): Promise<MatterDocument[]> {
  try {
    const subCol = collection(db, MATTERS_COLLECTION, matterId, 'documents');
    const snap = await getDocs(subCol);
    if (!snap.empty) {
      const docs: MatterDocument[] = [];
      snap.forEach((d) => docs.push({ id: d.id, ...d.data() } as MatterDocument));
      return docs;
    }
  } catch (err) {
    console.warn('Firestore docs fetch fallback:', err);
  }
  return localDocsStore[matterId] || [];
}

export async function uploadMatterDocument(
  matterId: string,
  docData: Omit<MatterDocument, 'id' | 'matterId' | 'uploadedAt'>
): Promise<MatterDocument> {
  const newDoc: MatterDocument = {
    ...docData,
    id: `doc_${Date.now()}`,
    matterId,
    uploadedAt: new Date().toISOString(),
  };

  try {
    const subCol = collection(db, MATTERS_COLLECTION, matterId, 'documents');
    await setDoc(doc(subCol, newDoc.id), newDoc);
  } catch (err) {
    console.warn('Firestore document add fallback:', err);
  }

  if (!localDocsStore[matterId]) localDocsStore[matterId] = [];
  localDocsStore[matterId].unshift(newDoc);

  return newDoc;
}

// --- Reminders Service ---
export async function fetchUserReminders(userId: string): Promise<Reminder[]> {
  try {
    const q = query(collection(db, REMINDERS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const rems: Reminder[] = [];
      snap.forEach((d) => rems.push({ id: d.id, ...d.data() } as Reminder));
      return rems;
    }
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

  try {
    await setDoc(doc(db, REMINDERS_COLLECTION, newRem.id), newRem);
  } catch (err) {
    console.warn('Firestore reminder create fallback:', err);
  }

  localRemindersStore.unshift(newRem);
  return newRem;
}

export async function deleteReminder(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, REMINDERS_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore delete reminder fallback:', err);
  }
  localRemindersStore = localRemindersStore.filter((r) => r.id !== id);
}

// --- Notifications Service ---
export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const notifs: AppNotification[] = [];
      snap.forEach((d) => notifs.push({ id: d.id, ...d.data() } as AppNotification));
      return notifs;
    }
  } catch (err) {
    console.warn('Firestore notifications fetch fallback:', err);
  }
  return localNotificationsStore;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
  } catch (err) {
    console.warn('Firestore update notification fallback:', err);
  }
  const idx = localNotificationsStore.findIndex((n) => n.id === id);
  if (idx !== -1) localNotificationsStore[idx].read = true;
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
