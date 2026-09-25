# Legalia security update: how to deploy

This update changes three places: **Vercel** (settings), **GitHub** (code) and **Firebase** (rules).
Do the steps **in this order**. The new code works with the old rules, but the new rules would break the old code.

---

## Step 1: Vercel settings (before uploading code)

Vercel → your project → **Settings → Environment Variables**. Add these, for all environments:

| Name | Value | Needed? |
|---|---|---|
| `CRON_SECRET` | a long random string (see note) | **Required.** Without it the daily reminders stop. |
| `APP_URL` | your site address, e.g. `https://legalia-xyz.vercel.app` | Recommended (adds a link to reminder emails) |
| `FIREBASE_STORAGE_BUCKET` | `legalia-proceedings.firebasestorage.app` | Optional (this is already the default) |

`CRON_SECRET` note: Vercel automatically sends this secret with every scheduled run, and the reminder job
now refuses any request that doesn't carry it. Use any long random string, for example one from a
password manager.

Keep the existing `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
`RESEND_API_KEY` and `RESEND_FROM_EMAIL` as they are.

## Step 2: Upload the code to GitHub

Unzip the update and upload the folders and files into your repo (**Add file → Upload files**), then commit.
Wait until Vercel shows **Ready**.

## Step 3: Publish the new database rules (Firebase console)

1. Go to <https://console.firebase.google.com> and open the project **legalia-proceedings**.
2. **Firestore Database → Rules**.
3. Select everything in the editor, delete it, and paste the full contents of `firestore.rules`.
4. Click **Publish**. If Firebase shows a red error, **don't publish**; send me a screenshot.

## Step 4: Publish the new file-storage rules

1. **Storage → Rules**.
2. Replace everything with the contents of `storage.rules`.
3. Click **Publish**.

## Step 5: Recommended Firebase settings

- **Authentication → Settings → Password policy:** minimum length **8**, and turn on **Require enforcement**.
- **Authentication → Settings → User account management → Email enumeration protection:** **On**.

---

## Step 6: Test it (about 10 minutes)

On the live site:

1. **Sign in with Google.** It should work as before. (The new security headers are strict; if sign-in fails, see "Undo" below.)
2. **Create a matter**, edit it, record what happened at a hearing. All should work.
3. **People → Invite someone → By email.** Needs your email to be verified: Google accounts already are,
   and email/password accounts get a verification email and a banner.
4. **Create an invite link**, open it in a private window with a second account, and join.
5. **Change a person's permission / remove them** from a matter's People tab.
6. **Delete a test matter.** It should vanish with its history.
7. **Print brief** should open and the Print button should work.

### Check the rules in Firebase's simulator (optional, about 5 minutes)

Firestore → Rules → **Rules Playground**. Each of these should say **Denied**:

| Simulate | Location | Authenticated as | Expected |
|---|---|---|---|
| `get` | `users/any-id` | not signed in | **Denied** |
| `create` | `matters/test1` with data `{"ownerId":"A","createdBy":"A","members":{"A":"owner","B":"viewer"}}` | uid `A` | **Denied** (can't add B) |
| `create` | `notifications/n1` with data `{"userId":"B"}` | uid `A` | **Denied** |
| `create` | `reminders/r1` with data `{"userId":"B","fired":false,"matterId":"x","message":"hi"}` | uid `A` | **Denied** |

---

## After deploying: cancel old invite links

Invite links created **before** this update used short, guessable codes. On each matter's **People** tab, cancel any
pending link and create a new one if you still need it.

---

## Undo (if something breaks)

- **Sign-in or the page fails to load:** in `vercel.json`, delete the whole `"headers": [...]` block, commit. That
  removes only the browser security headers.
- **Database errors ("Missing or insufficient permissions"):** Firestore → Rules → **history** icon → restore the previous
  version. Then send me the exact error.

---

## Optional: Firebase App Check (block scripts that aren't your app)

Do this a few days after everything above works.

1. Firebase console → **App Check** → register the web app with **reCAPTCHA Enterprise** and copy the **site key**.
2. Vercel → Environment Variables → add `VITE_RECAPTCHA_ENTERPRISE_KEY` = that key → redeploy.
3. In App Check, watch the **Metrics** for a few days. When nearly all requests show as verified, click **Enforce** for
   Firestore and Storage.

## Optional: automatic clean-up of rate-limit records

Firestore → **TTL policies** → add a policy on collection `rateLimits`, field `expiresAt`. (The daily job also cleans
them up, so this is optional.)

---

## What changed (for reference)

- **Rules:** users can't be listed; a matter can only be created with yourself as the only member; nobody can add
  people or change permissions from the browser; reminders are only ever your own; notifications are created only by
  the server; invite links are visible only to the matter owner; file uploads are limited to 25 MB and to PDF, Word,
  image and text files; everything else is closed.
- **Server (`api/`):**
  - Email invites match the account's real sign-in email and require verified emails on both sides.
  - New actions: preview an invite link, change permissions, remove or leave, fully delete a matter (history, invites,
    files, reminders), delete an account.
  - Rate limits on all of them.
  - The reminder job requires `CRON_SECRET`, and works out hearing reminders itself from each matter's hearing date.
- **App:**
  - Verification email and banner.
  - Minimum 8-character passwords for new accounts.
  - Invite codes are 64-character cryptographically random strings, and matter and invite IDs are random (no longer
    timestamps).
  - New "Leave this matter" and "Delete account" options.
  - Custom reminders are now set by date and sent at 7:00am.
  - Optional App Check.
- **Browser headers:** Content-Security-Policy, clickjacking protection, HSTS, no-sniff, referrer and permissions policies.
