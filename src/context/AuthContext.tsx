import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<FirebaseUser | null>;
  loginWithEmail: (e: string, p: string) => Promise<FirebaseUser | null>;
  signUpWithEmail: (e: string, p: string, name: string) => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  updateUserProfile: (fields: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// There is no global role anymore - every signed-in user gets the same
// baseline profile. Access to any given matter is entirely determined by
// that matter's own `members` map (see matterService / firestore.rules),
// not by anything on the user's profile.
async function ensureUserProfile(user: FirebaseUser, displayNameOverride?: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const name = displayNameOverride || user.displayName || user.email?.split('@')[0] || 'Counsel';

  const newProfile: UserProfile = {
    uid: user.uid,
    name,
    // Lowercased so email-based team lookups (findUserByEmail) match reliably.
    email: (user.email || '').toLowerCase(),
    matterAccess: [],
    notifyPrefs: { email: true, inApp: true, dailyDigest: true },
    theme: 'light',
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
      return res.user;
    }
    return null;
  };

  const loginWithEmail = async (e: string, p: string) => {
    const res = await signInWithEmailAndPassword(auth, e, p);
    if (res.user) {
      const profile = await ensureUserProfile(res.user);
      setCurrentUser(profile);
      return res.user;
    }
    return null;
  };

  const signUpWithEmail = async (e: string, p: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, e, p);
    if (res.user) {
      const profile = await ensureUserProfile(res.user, name);
      setCurrentUser(profile);
      return res.user;
    }
    return null;
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const updateUserProfile = async (fields: Partial<UserProfile>) => {
    if (!currentUser || !firebaseUser) return;
    const updated = { ...currentUser, ...fields };
    setCurrentUser(updated);

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), fields, { merge: true });
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
