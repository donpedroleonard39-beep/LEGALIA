import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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
  resetPassword: (e: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (fields: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Firebase throws errors like "Firebase: Error (auth/wrong-password)." which
// are useless to show a person. Map the codes we actually hit to plain,
// specific copy. Anything not in this list falls back to a generic message
// instead of leaking the raw Firebase text.
function friendlyAuthMessage(err: any): string {
  const code: string = err?.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'That email address does not look right. Please check it and try again.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'We could not find an account matching that email and password.';
    case 'auth/wrong-password':
      return 'That password is incorrect. Please try again or reset your password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact your administrator.';
    case 'auth/email-already-in-use':
      return 'An account already exists with that email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Please choose a password with at least 6 characters.';
    case 'auth/missing-password':
      return 'Please enter a password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign in was closed before it finished. Please try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign in popup. Please allow popups and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

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

  const name = displayNameOverride || user.displayName || user.email?.split('@')[0] || 'New user';

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
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const profile = await ensureUserProfile(res.user);
        setCurrentUser(profile);
        return res.user;
      }
      return null;
    } catch (err: any) {
      throw new Error(friendlyAuthMessage(err));
    }
  };

  const loginWithEmail = async (e: string, p: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, e, p);
      if (res.user) {
        const profile = await ensureUserProfile(res.user);
        setCurrentUser(profile);
        return res.user;
      }
      return null;
    } catch (err: any) {
      throw new Error(friendlyAuthMessage(err));
    }
  };

  const signUpWithEmail = async (e: string, p: string, name: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, e, p);
      if (res.user) {
        const profile = await ensureUserProfile(res.user, name);
        setCurrentUser(profile);
        return res.user;
      }
      return null;
    } catch (err: any) {
      throw new Error(friendlyAuthMessage(err));
    }
  };

  const resetPassword = async (e: string) => {
    try {
      await sendPasswordResetEmail(auth, e);
    } catch (err: any) {
      throw new Error(friendlyAuthMessage(err));
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const updateUserProfile = async (fields: Partial<UserProfile>) => {
    if (!currentUser || !firebaseUser) return;
    // Save first, then update local state, so the Settings page only says
    // "saved" when it really was.
    await setDoc(doc(db, 'users', firebaseUser.uid), fields, { merge: true });
    setCurrentUser({ ...currentUser, ...fields });
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
        resetPassword,
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
