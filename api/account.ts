import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Matter membership and deletion.
//
// The browser is not allowed to change who is on a matter or to delete one
// (see firestore.rules): these actions run here, with the Admin SDK, after
// checking the caller's Firebase ID token and their role on the matter.
//
// Actions:
//   set-permission  owner changes a member between editor / viewer
//   remove-member   owner removes someone, or a member leaves a matter
//   delete-matter   owner deletes a matter and EVERYTHING under it
//   delete-account  the caller deletes their own account and data

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function init() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    });
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const safeId = (v: string) => v.length > 0 && v.length < 200 && !/[\/]/.test(v);

async function rateLimit(db: Firestore, uid: string, action: string, max: number, windowMin: number) {
  const bucket = Math.floor(Date.now() / (windowMin * 60_000));
  const ref = db.collection('rateLimits').doc(`${uid}_${action}_${bucket}`);
  const count = await db.runTransaction(async (tx) => {
    const n = ((await tx.get(ref)).data()?.count as number) || 0;
    tx.set(ref, { count: n + 1, uid, action, expiresAt: new Date(Date.now() + windowMin * 120_000) });
    return n + 1;
  });
  if (count > max) throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
}

async function deleteWhere(db: Firestore, collection: string, field: string, value: string) {
  const snap = await db.collection(collection).where(field, '==', value).get();
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return snap.size;
}

// Removes a matter, its history / invites / document records, its stored
// files, and every reminder and notification pointing at it.
async function deleteMatterCompletely(db: Firestore, matterId: string) {
  const ref = db.collection('matters').doc(matterId);
  await db.recursiveDelete(ref);
  await getStorage().bucket().deleteFiles({ prefix: `matters/${matterId}/` }).catch((err) => {
    console.warn('storage cleanup failed for', matterId, err?.message);
  });
  await deleteWhere(db, 'reminders', 'matterId', matterId);
  await deleteWhere(db, 'notifications', 'matterId', matterId);
}

// Removes a person's own custom reminders for a matter they no longer belong to.
async function deleteMemberReminders(db: Firestore, matterId: string, uid: string) {
  const snap = await db.collection('reminders').where('userId', '==', uid).where('matterId', '==', matterId).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    init();
    const db = getFirestore();

    const header = req.headers.authorization || '';
    const idToken = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!idToken) throw new HttpError(401, 'Please sign in first.');
    const decoded = await getAuth().verifyIdToken(idToken, true).catch(() => null);
    if (!decoded) throw new HttpError(401, 'Your session has expired. Please sign in again.');
    const uid = decoded.uid;

    const body = (req.body || {}) as Record<string, unknown>;
    const action = str(body.action);
    await rateLimit(db, uid, 'account', 60, 10);

    // --------------------------------------------- set-permission (owner only)
    if (action === 'set-permission') {
      const matterId = str(body.matterId), memberId = str(body.memberId);
      const permission = body.permission;
      if (!safeId(matterId) || !safeId(memberId) || (permission !== 'editor' && permission !== 'viewer')) {
        throw new HttpError(400, 'Invalid request.');
      }
      const ref = db.collection('matters').doc(matterId);
      await db.runTransaction(async (tx) => {
        const m = (await tx.get(ref)).data();
        if (!m) throw new HttpError(404, 'This matter no longer exists.');
        if (m.ownerId !== uid || m.members?.[uid] !== 'owner') throw new HttpError(403, 'Only the owner can change access.');
        if (memberId === uid) throw new HttpError(400, 'The owner\'s access cannot be changed.');
        if (!m.members?.[memberId]) throw new HttpError(404, 'That person is not on this matter.');
        tx.update(ref, { [`members.${memberId}`]: permission, updatedAt: new Date().toISOString() });
      });
      return res.status(200).json({ ok: true });
    }

    // ------------------------------- remove-member (owner, or leave yourself)
    if (action === 'remove-member') {
      const matterId = str(body.matterId), memberId = str(body.memberId);
      if (!safeId(matterId) || !safeId(memberId)) throw new HttpError(400, 'Invalid request.');
      const ref = db.collection('matters').doc(matterId);
      await db.runTransaction(async (tx) => {
        const m = (await tx.get(ref)).data();
        if (!m) throw new HttpError(404, 'This matter no longer exists.');
        const callerIsOwner = m.ownerId === uid && m.members?.[uid] === 'owner';
        if (!callerIsOwner && memberId !== uid) throw new HttpError(403, 'Only the owner can remove people.');
        if (memberId === m.ownerId) throw new HttpError(400, 'The owner cannot be removed. Delete the matter instead.');
        if (!m.members?.[memberId]) return;
        tx.update(ref, { [`members.${memberId}`]: FieldValue.delete(), updatedAt: new Date().toISOString() });
      });
      await deleteMemberReminders(db, matterId, memberId);
      return res.status(200).json({ ok: true });
    }

    // ------------------------------------------------ delete-matter (owner)
    if (action === 'delete-matter') {
      const matterId = str(body.matterId);
      if (!safeId(matterId)) throw new HttpError(400, 'Invalid request.');
      const m = (await db.collection('matters').doc(matterId).get()).data();
      if (!m) return res.status(200).json({ ok: true }); // already gone
      if (m.ownerId !== uid || m.members?.[uid] !== 'owner') throw new HttpError(403, 'Only the owner can delete a matter.');
      await deleteMatterCompletely(db, matterId);
      return res.status(200).json({ ok: true });
    }

    // ------------------------------------------------------- delete-account
    if (action === 'delete-account') {
      // Must have signed in recently - a stolen, long-lived session is not enough.
      const signedInSecondsAgo = Date.now() / 1000 - (decoded.auth_time || 0);
      if (signedInSecondsAgo > 15 * 60) {
        throw new HttpError(401, 'For your security, please sign out, sign back in, and then delete your account within 15 minutes.');
      }
      if (str(body.confirm) !== 'DELETE') throw new HttpError(400, 'Type DELETE to confirm.');

      const mine = await db.collection('matters').where(`members.${uid}`, 'in', ['owner', 'editor', 'viewer']).get();
      for (const doc of mine.docs) {
        const m = doc.data();
        if (m.ownerId === uid) await deleteMatterCompletely(db, doc.id);
        else await doc.ref.update({ [`members.${uid}`]: FieldValue.delete(), updatedAt: new Date().toISOString() });
      }
      await deleteWhere(db, 'reminders', 'userId', uid);
      await deleteWhere(db, 'notifications', 'userId', uid);
      await deleteWhere(db, 'collabInvites', 'inviterId', uid);
      await deleteWhere(db, 'collabInvites', 'inviteeId', uid);
      await db.collection('users').doc(uid).delete();
      await getAuth().deleteUser(uid);
      return res.status(200).json({ ok: true, mattersDeleted: mine.docs.filter((d) => d.data().ownerId === uid).length });
    }

    throw new HttpError(400, 'Unknown action.');
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('account failed:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
