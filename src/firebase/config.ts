import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Use the project's default Firestore database. The applet config does not
// expose a named database id, so passing one here only creates a type/runtime
// mismatch during deployment.
// ignoreUndefinedProperties: several forms (matter intake, edits) omit
// optional fields as `undefined` rather than deleting the key - without this,
// the SDK throws on any setDoc/updateDoc that includes one.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

export const storage = getStorage(app);

export default app;
