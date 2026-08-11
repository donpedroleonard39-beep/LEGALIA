import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (fields: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The very first person to ever sign up on a fresh deployment becomes the
// practice admin automatically. Everyone after that starts as a 'client'
// (no firm-wide matter visibility, no write access to anything) until an
// existing admin promotes them via Team & Access - this is what keeps a
// public sign-up page from handing out staff-level access to strangers.
async function isFirstEverUser(): Promise<boolean> {
  try {
    const snap = await getDocs(query(collection(db, 'users'), limit(1)));
    return snap.empty;
  } catch {
    // If we can't tell, err on the side of the safer (non-admin) default.
    return false;
  }
}

async function ensureUserProfile(user: FirebaseUser, displayNameOverride?: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const grantAdmin = await isFirstEverUser();
  const name = displayNameOverride || user.displayName || user.email?.split('@')[0] || 'Counsel';

  const newProfile: UserProfile = {
    uid: user.uid,
    name,
    // Lowercased so email-based team lookups (findUserByEmail) match reliably.
    email: (user.email || '').toLowerCase(),
    role: grantAdmin ? 'admin' : 'client',
    matterAccess: [],
    notifyPrefs: { email: true, inApp: true, dailyDigest: true },
    theme: 'light',
    title: grantAdmin ? 'Managing Partner' : undefined,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userDocRef, newProfile);
  return newProfile;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await ensureUserProfile(user);
          setCurrentUser(profile);
        } catch (e) {
          console.warn('Firestore user profile sync error:', e);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    if (res.user) {
      const profile = await ensureUserProfile(res.user);
      setCurrentUser(profile);
    }
  };

  const loginWithEmail = async (e: string, p: string) => {
    const res = await signInWithEmailAndPassword(auth, e, p);
    if (res.user) {
      const profile = await ensureUserProfile(res.user);
      setCurrentUser(profile);
    }
  };

  const signUpWithEmail = async (e: string, p: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, e, p);
    if (res.user) {
      const profile = await ensureUserProfile(res.user, name);
      setCurrentUser(profile);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const updateUserProfile = async (fields: Partial<UserProfile>) => {
    if (!currentUser || !firebaseUser) return;
    // `role` can only be changed by an admin editing someone else's profile
    // (see firestore.rules) - strip it here so a self-edit never even
    // attempts it and silently fails.
    const { role, ...safeFields } = fields;
    const updated = { ...currentUser, ...safeFields };
    setCurrentUser(updated);

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), safeFields, { merge: true });
    } catch (err) {
      console.warn('Firestore user update error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
