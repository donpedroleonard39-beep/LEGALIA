import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// In-app collaborator invitations.
//
// An owner invites an existing Legalia user by email and picks which of their
// matters to share, each as viewer or editor. The invitee sees the invitation in
// their Notifications, then accepts or declines. Everything that changes access
// happens here with the Admin SDK: the invitee is not a member yet, so Firestore
// rules (correctly) stop the browser from adding them, and the `collabInvites`
// collection is deliberately not readable from the browser at all.
//
// One endpoint, five actions: create | list | revoke | respond | accept-link.
// accept-link redeems a shareable invite link (matters/{id}/invites/{id}); it
// has to run here because the person opening the link is not a member yet.

type Permission = 'editor' | 'viewer';
interface Grant { matterId: string; permission: Permission }
interface StoredGrant extends Grant { suitNumber: string; title: string }

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
    });
  }
}

const isPermission = (p: unknown): p is Permission => p === 'editor' || p === 'viewer';
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const safeId = (v: string) => v.length > 0 && v.length < 200 && !/[\/]/.test(v);
const plural = (n: number) => `${n} matter${n === 1 ? '' : 's'}`;

async function displayName(db: Firestore, uid: string, fallback = 'A colleague') {
  const snap = await db.collection('users').doc(uid).get();
  return (snap.data()?.name as string) || fallback;
}

// Hearing reminders for a matter the person has just been given access to, so
// they get the same "hearing tomorrow" reminders as existing members.
// Same deterministic id as the client uses, so it never duplicates.
async function addHearingReminder(db: Firestore, matter: Record<string, any>, matterId: string, uid: string) {
  const date = matter.nextHearingDate as string | undefined;
  if (!date) return;
  const remindAt = new Date(`${date}T06:00:00Z`); // 07:00 in Nigeria, matching the client
  remindAt.setUTCDate(remindAt.getUTCDate() - 1);
  if (isNaN(remindAt.getTime()) || remindAt.getTime() <= Date.now()) return;
  const id = `hr_${matterId}_${uid}_${date}`;
  await db.collection('reminders').doc(id).set({
    id, userId: uid, matterId,
    suitNumber: matter.suitNumber || '',
    remindAt: remindAt.toISOString(),
    message: `Hearing tomorrow for ${matter.suitNumber} - ${matter.title}${matter.purpose ? ` (${matter.purpose})` : ''}.`,
    channel: ['email', 'inApp'],
    fired: false,
    createdAt: new Date().toISOString(),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    init();
    const db = getFirestore();

    // Who is calling: must be a signed-in Firebase user.
    const header = req.headers.authorization || '';
    const idToken = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!idToken) throw new HttpError(401, 'Please sign in first.');
    const uid = (await getAuth().verifyIdToken(idToken).catch(() => null))?.uid;
    if (!uid) throw new HttpError(401, 'Your session has expired. Please sign in again.');

    const body = (req.body || {}) as Record<string, unknown>;
    const action = str(body.action);

    // ---------------------------------------------------------------- create
    if (action === 'create') {
      const email = str(body.email).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');

      const rawGrants = Array.isArray(body.grants) ? body.grants : [];
      const grants: Grant[] = [];
      for (const g of rawGrants.slice(0, 100)) {
        const matterId = str((g as any)?.matterId);
        const permission = (g as any)?.permission;
        if (safeId(matterId) && isPermission(permission) && !grants.some((x) => x.matterId === matterId)) {
          grants.push({ matterId, permission });
        }
      }
      if (grants.length === 0) throw new HttpError(400, 'Choose at least one matter to share.');

      // The invitee must already have a Legalia account.
      const found = await db.collection('users').where('email', '==', email).limit(2).get();
      if (found.empty) {
        throw new HttpError(404, 'No Legalia account uses that email yet. Ask them to register first, or share an invite link instead.');
      }
      const inviteeId = found.docs[0].id;
      if (inviteeId === uid) throw new HttpError(400, 'You cannot invite yourself.');

      // Only matters the caller owns; skip ones the invitee can already open.
      const stored: StoredGrant[] = [];
      for (const g of grants) {
        const snap = await db.collection('matters').doc(g.matterId).get();
        const m = snap.data();
        if (!m) throw new HttpError(404, 'One of the selected matters no longer exists.');
        if (m.ownerId !== uid || m.members?.[uid] !== 'owner') {
          throw new HttpError(403, 'You can only share matters that you own.');
        }
        if (m.members?.[inviteeId]) continue;
        stored.push({ ...g, suitNumber: m.suitNumber || '', title: m.title || '' });
      }
      if (stored.length === 0) throw new HttpError(409, 'They already have access to the selected matters.');

      // A new invitation replaces any earlier pending one to the same person.
      const earlier = await db.collection('collabInvites')
        .where('inviterId', '==', uid).where('inviteeId', '==', inviteeId).get();
      for (const doc of earlier.docs) {
        if (doc.data().status !== 'pending') continue;
        await doc.ref.update({ status: 'revoked' });
        const nid = doc.data().notificationId as string | undefined;
        if (nid) await db.collection('notifications').doc(nid).update({ 'invite.status': 'revoked', read: true }).catch(() => {});
      }

      const inviterName = await displayName(db, uid, 'A colleague');
      const now = new Date().toISOString();
      const inviteRef = db.collection('collabInvites').doc();
      const notifRef = db.collection('notifications').doc();

      await notifRef.set({
        userId: inviteeId,
        type: 'invite',
        message: `${inviterName} invited you to collaborate on ${plural(stored.length)}.`,
        read: false,
        createdAt: now,
        invite: {
          id: inviteRef.id,
          inviterName,
          status: 'pending',
          grants: stored,
        },
      });
      await inviteRef.set({
        id: inviteRef.id,
        inviterId: uid,
        inviterName,
        inviteeId,
        inviteeEmail: email,
        grants: stored,
        matterIds: stored.map((g) => g.matterId),
        status: 'pending',
        notificationId: notifRef.id,
        createdAt: now,
      });

      return res.status(200).json({ id: inviteRef.id, matterCount: stored.length });
    }

    // ------------------------------------------------------------------ list
    // Every invitation the caller has sent that is still waiting for an answer.
    if (action === 'list') {
      const snap = await db.collection('collabInvites').where('inviterId', '==', uid).get();
      const invites = snap.docs
        .map((d) => d.data())
        .filter((i) => i.status === 'pending')
        .map((i) => ({
          id: i.id as string,
          email: i.inviteeEmail as string,
          grants: i.grants as StoredGrant[],
          createdAt: i.createdAt as string,
        }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return res.status(200).json({ invites });
    }

    // ---------------------------------------------------------------- revoke
    if (action === 'revoke') {
      const inviteId = str(body.inviteId);
      if (!safeId(inviteId)) throw new HttpError(400, 'Invalid invitation.');
      const ref = db.collection('collabInvites').doc(inviteId);
      const invite = (await ref.get()).data();
      if (!invite || invite.inviterId !== uid) throw new HttpError(404, 'Invitation not found.');
      if (invite.status !== 'pending') throw new HttpError(409, `This invitation was already ${invite.status}.`);
      await ref.update({ status: 'revoked' });
      if (invite.notificationId) {
        await db.collection('notifications').doc(invite.notificationId)
          .update({ 'invite.status': 'revoked', read: true }).catch(() => {});
      }
      return res.status(200).json({ ok: true });
    }

    // --------------------------------------------------------------- respond
    if (action === 'respond') {
      const inviteId = str(body.inviteId);
      const accept = body.accept === true;
      if (!safeId(inviteId)) throw new HttpError(400, 'Invalid invitation.');

      const inviteRef = db.collection('collabInvites').doc(inviteId);
      const invite = (await inviteRef.get()).data();
      if (!invite || invite.inviteeId !== uid) throw new HttpError(404, 'Invitation not found.');
      if (invite.status !== 'pending') {
        throw new HttpError(409, invite.status === 'revoked'
          ? 'The sender withdrew this invitation.'
          : `You already ${invite.status} this invitation.`);
      }

      const inviteeName = await displayName(db, uid, 'The invitee');
      const now = new Date().toISOString();
      const grants = invite.grants as StoredGrant[];
      let appliedIds: string[] = [];

      if (accept) {
        appliedIds = await db.runTransaction(async (tx) => {
          const refs = grants.map((g) => db.collection('matters').doc(g.matterId));
          const snaps = await Promise.all(refs.map((r) => tx.get(r)));
          const applied: string[] = [];
          snaps.forEach((snap, i) => {
            const m = snap.data();
            // Only if the inviter still owns it and the person is not already in.
            if (!m || m.ownerId !== invite.inviterId || m.members?.[uid]) return;
            tx.update(refs[i], { [`members.${uid}`]: grants[i].permission, updatedAt: now });
            applied.push(grants[i].matterId);
          });
          if (applied.length === 0) {
            throw new HttpError(409, 'These matters are no longer available to share.');
          }
          return applied;
        });
        for (const matterId of appliedIds) {
          const m = (await db.collection('matters').doc(matterId).get()).data();
          if (m) await addHearingReminder(db, m, matterId, uid).catch(() => {});
        }
      }

      const status = accept ? 'accepted' : 'declined';
      await inviteRef.update({ status, respondedAt: now });
      if (invite.notificationId) {
        await db.collection('notifications').doc(invite.notificationId)
          .update({ 'invite.status': status, read: true }).catch(() => {});
      }
      await db.collection('notifications').add({
        userId: invite.inviterId,
        type: 'system',
        message: accept
          ? `${inviteeName} accepted your invitation and can now open ${plural(appliedIds.length)}.`
          : `${inviteeName} declined your invitation.`,
        read: false,
        createdAt: now,
      });

      return res.status(200).json({ status, matterIds: appliedIds });
    }

    // ----------------------------------------------------------- accept-link
    if (action === 'accept-link') {
      const matterId = str(body.matterId);
      const inviteId = str(body.inviteId);
      const token = str(body.token);
      if (!safeId(matterId) || !safeId(inviteId) || !token) throw new HttpError(400, 'This invite link is not valid.');

      const matterRef = db.collection('matters').doc(matterId);
      const inviteRef = matterRef.collection('invites').doc(inviteId);
      const now = new Date().toISOString();

      const result = await db.runTransaction(async (tx) => {
        const [inviteSnap, matterSnap] = await Promise.all([tx.get(inviteRef), tx.get(matterRef)]);
        const invite = inviteSnap.data();
        const matter = matterSnap.data();
        if (!invite || invite.token !== token) throw new HttpError(404, 'This invite link is not valid or was cancelled.');
        if (!matter) throw new HttpError(404, 'This matter no longer exists.');
        if (matter.members?.[uid]) return { already: true, matter };
        if (invite.status !== 'pending') throw new HttpError(409, 'This invite link has already been used. Ask for a new one.');
        const permission: Permission = isPermission(invite.permission) ? invite.permission : 'viewer';
        tx.update(matterRef, { [`members.${uid}`]: permission, updatedAt: now });
        tx.update(inviteRef, { status: 'accepted', acceptedBy: uid, acceptedAt: now });
        return { already: false, matter };
      });

      if (!result.already) {
        await addHearingReminder(db, result.matter, matterId, uid).catch(() => {});
        const joinerName = await displayName(db, uid, 'Someone');
        await db.collection('notifications').add({
          userId: result.matter.ownerId,
          matterId,
          suitNumber: result.matter.suitNumber || '',
          type: 'system',
          message: `${joinerName} joined ${result.matter.suitNumber || 'your matter'} using your invite link.`,
          read: false,
          createdAt: now,
        });
      }
      return res.status(200).json({ ok: true, matterId, alreadyMember: result.already });
    }

    throw new HttpError(400, 'Unknown action.');
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('collab-invites failed:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
