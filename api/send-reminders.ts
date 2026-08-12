import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';

// ---------- Firebase Admin (server-side only, bypasses Firestore rules) ----------
function getAdminDb() {
  if (!getApps().length) {
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return getFirestore();
}

interface ReminderDoc {
  id: string;
  userId: string;
  matterId: string;
  suitNumber: string;
  remindAt: string;
  message: string;
  channel: ('email' | 'inApp')[];
  fired: boolean;
}

interface UserDoc {
  uid: string;
  name?: string;
  email?: string;
  notifyPrefs?: { email?: boolean };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron sends this header on scheduled invocations. Also accept a
  // manual trigger authenticated with CRON_SECRET, so this can be tested
  // or re-run by hand without opening the endpoint to the public internet.
  const isVercelCron = req.headers['x-vercel-cron'] !== undefined;
  const hasValidSecret =
    !!process.env.CRON_SECRET &&
    req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !hasValidSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getAdminDb();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const now = new Date();

  const dueSnap = await db
    .collection('reminders')
    .where('fired', '==', false)
    .where('remindAt', '<=', now.toISOString())
    .get();

  if (dueSnap.empty) {
    return res.status(200).json({ sent: 0, message: 'No reminders due.' });
  }

  const results: { id: string; status: 'sent' | 'skipped' | 'error'; detail?: string }[] = [];

  for (const reminderSnap of dueSnap.docs) {
    const reminder = reminderSnap.data() as ReminderDoc;

    try {
      if (!reminder.channel?.includes('email')) {
        results.push({ id: reminder.id, status: 'skipped', detail: 'email channel not requested' });
        await reminderSnap.ref.update({ fired: true });
        continue;
      }

      const userSnap = await db.collection('users').doc(reminder.userId).get();
      const user = userSnap.data() as UserDoc | undefined;

      if (!user?.email || user.notifyPrefs?.email === false) {
        results.push({ id: reminder.id, status: 'skipped', detail: 'no email or opted out' });
        await reminderSnap.ref.update({ fired: true });
        continue;
      }

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Legalia <onboarding@resend.dev>',
        to: user.email,
        subject: `Reminder: ${reminder.suitNumber}`,
        text: reminder.message,
      });

      // Mirror into the in-app notification feed so the same event shows
      // up there too, without waiting on a second write path.
      await db.collection('notifications').add({
        userId: reminder.userId,
        matterId: reminder.matterId,
        suitNumber: reminder.suitNumber,
        type: 'hearing_upcoming',
        message: reminder.message,
        read: false,
        createdAt: new Date().toISOString(),
      });

      await reminderSnap.ref.update({ fired: true });
      results.push({ id: reminder.id, status: 'sent' });
    } catch (err) {
      results.push({ id: reminder.id, status: 'error', detail: err instanceof Error ? err.message : String(err) });
    }
  }

  const sent = results.filter((r) => r.status === 'sent').length;
  return res.status(200).json({ sent, total: results.length, results });
}
