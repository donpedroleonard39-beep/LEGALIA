import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';

// Daily reminder job (see vercel.json "crons").
//
// 1. Hearing reminders: every member of an open matter whose next hearing is
//    TOMORROW gets an in-app notification and an email. Worked out here from
//    the matter itself, so they are always right after date changes, member
//    changes or deletions - and the browser never writes reminders for others.
// 2. Custom reminders: each person's own reminders that are now due.
//
// Security: only Vercel Cron may call this. Set CRON_SECRET in Vercel's
// environment variables - Vercel then sends "Authorization: Bearer <secret>"
// on every scheduled run. (The old x-vercel-cron header check could be faked.)

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

interface UserDoc { uid: string; name?: string; email?: string; notifyPrefs?: { email?: boolean; inApp?: boolean } }

const TIMEZONE = process.env.APP_TIMEZONE || 'Africa/Lagos';
const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '');
const OPEN = (status: string) => !['closed', 'won', 'lost'].includes(status);

// YYYY-MM-DD for "today + offset days" in the app's time zone.
function localDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

async function loadUsers(db: Firestore, uids: string[]) {
  const map = new Map<string, UserDoc>();
  await Promise.all([...new Set(uids)].map(async (uid) => {
    const u = (await db.collection('users').doc(uid).get()).data() as UserDoc | undefined;
    if (u) map.set(uid, u);
  }));
  return map;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getAdminDb();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'Legalia <onboarding@resend.dev>';
  const footer = APP_URL ? `\n\nOpen Legalia: ${APP_URL}` : '\n\nOpen Legalia to see the matter.';
  const log: Array<{ kind: string; id: string; status: string; detail?: string }> = [];

  const notify = async (user: UserDoc, uid: string, n: { matterId?: string; suitNumber?: string; type: string; message: string }, subject: string) => {
    const done: string[] = [];
    if (user.notifyPrefs?.inApp !== false) {
      await db.collection('notifications').add({ userId: uid, ...n, read: false, createdAt: new Date().toISOString() });
      done.push('inApp');
    }
    if (user.email && user.notifyPrefs?.email !== false) {
      await resend.emails.send({ from, to: user.email, subject, text: n.message + footer });
      done.push('email');
    }
    return done;
  };

  // ---------------------------------------------------- 1. hearing reminders
  const tomorrow = localDate(1);
  const hearings = await db.collection('matters').where('nextHearingDate', '==', tomorrow).get();
  for (const doc of hearings.docs) {
    const m = doc.data();
    if (!OPEN(m.status) || m.hearingReminderSentFor === tomorrow) continue;
    const memberIds = Object.keys(m.members || {});
    const users = await loadUsers(db, memberIds);
    const message = `Hearing tomorrow for ${m.suitNumber} – ${m.title}${m.purpose ? ` (${m.purpose})` : ''}${m.court ? `, ${m.court}` : ''}.`;
    for (const uid of memberIds) {
      const user = users.get(uid);
      if (!user) continue;
      try {
        const done = await notify(user, uid, { matterId: doc.id, suitNumber: m.suitNumber, type: 'hearing_upcoming', message }, `Hearing tomorrow: ${m.suitNumber}`);
        log.push({ kind: 'hearing', id: `${doc.id}:${uid}`, status: 'sent', detail: done.join('+') });
      } catch (err) {
        log.push({ kind: 'hearing', id: `${doc.id}:${uid}`, status: 'error', detail: err instanceof Error ? err.message : String(err) });
      }
    }
    // Mark it so a second run the same day does not send again.
    await doc.ref.update({ hearingReminderSentFor: tomorrow });
  }

  // ---------------------------------------------------- 2. custom reminders
  const due = await db.collection('reminders')
    .where('fired', '==', false)
    .where('remindAt', '<=', new Date().toISOString())
    .get();

  for (const snap of due.docs) {
    const r = snap.data();
    try {
      // Old per-member hearing reminders (ids "hr_...") are replaced by step 1.
      if (snap.id.startsWith('hr_')) { await snap.ref.delete(); continue; }

      const matter = r.matterId ? (await db.collection('matters').doc(r.matterId).get()).data() : null;
      if (!matter) { await snap.ref.delete(); log.push({ kind: 'custom', id: snap.id, status: 'skipped', detail: 'matter deleted' }); continue; }
      if (!matter.members?.[r.userId]) { await snap.ref.update({ fired: true }); log.push({ kind: 'custom', id: snap.id, status: 'skipped', detail: 'no longer a member' }); continue; }

      const user = (await db.collection('users').doc(r.userId).get()).data() as UserDoc | undefined;
      if (!user) { await snap.ref.delete(); continue; }
      const wants = (c: string) => Array.isArray(r.channel) && r.channel.includes(c);
      const prefs = { ...user, notifyPrefs: { inApp: wants('inApp') && user.notifyPrefs?.inApp !== false, email: wants('email') && user.notifyPrefs?.email !== false } };
      const done = await notify(prefs, r.userId, { matterId: r.matterId, suitNumber: r.suitNumber, type: 'reminder', message: String(r.message || '').slice(0, 500) }, `Reminder: ${r.suitNumber}`);
      await snap.ref.update({ fired: true, firedAt: new Date().toISOString() });
      log.push({ kind: 'custom', id: snap.id, status: done.length ? 'sent' : 'skipped', detail: done.join('+') || 'opted out' });
    } catch (err) {
      log.push({ kind: 'custom', id: snap.id, status: 'error', detail: err instanceof Error ? err.message : String(err) });
    }
  }

  // Housekeeping: drop expired rate-limit counters.
  const stale = await db.collection('rateLimits').where('expiresAt', '<', new Date()).limit(400).get();
  if (!stale.empty) { const b = db.batch(); stale.docs.forEach((d) => b.delete(d.ref)); await b.commit(); }

  return res.status(200).json({ tomorrow, sent: log.filter((l) => l.status === 'sent').length, log });
}
