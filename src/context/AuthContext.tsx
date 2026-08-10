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
import { UserProfile, UserRole } from '../types';

const DEFAULT_COUNSEL_PROFILE: UserProfile = {
  uid: 'counsel_principal',
  name: 'Barr. Chisom Okeke',
  email: 'chisom.okeke@legalia-chambers.org',
  role: 'admin',
  matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023', 'matter_e569_2022', 'matter_e104_2024'],
  notifyPrefs: { email: true, inApp: true, dailyDigest: true },
  theme: 'light',
  title: 'Principal Counsel & Head of Chambers',
  organization: 'Legalia Law Practice & Chambers',
};

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (fields: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(DEFAULT_COUNSEL_PROFILE);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile from Firestore on auth change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setCurrentUser(snap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Counsel',
              email: user.email || '',
              role: 'lawyer',
              matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023', 'matter_e569_2022', 'matter_e104_2024'],
              notifyPrefs: { email: true, inApp: true, dailyDigest: true },
              theme: 'light',
              title: 'Practicing Advocate',
              organization: 'Legalia Chambers',
            };
            await setDoc(userDocRef, newProfile);
            setCurrentUser(newProfile);
          }
        } catch (e) {
          console.warn('Firestore user profile fetch error:', e);
        }
      } else {
        setCurrentUser(DEFAULT_COUNSEL_PROFILE);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    if (res.user) {
      const userDocRef = doc(db, 'users', res.user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid: res.user.uid,
          name: res.user.displayName || res.user.email?.split('@')[0] || 'Counsel',
          email: res.user.email || '',
          role: 'admin',
          matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023', 'matter_e569_2022', 'matter_e104_2024'],
          notifyPrefs: { email: true, inApp: true, dailyDigest: true },
          theme: 'light',
          title: 'Managing Partner',
          organization: 'Legalia Law Practice',
        };
        await setDoc(userDocRef, newProfile);
        setCurrentUser(newProfile);
      } else {
        setCurrentUser(snap.data() as UserProfile);
      }
    }
  };

  const loginWithEmail = async (e: string, p: string) => {
    const res = await signInWithEmailAndPassword(auth, e, p);
    if (res.user) {
      const userDocRef = doc(db, 'users', res.user.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setCurrentUser(snap.data() as UserProfile);
      }
    }
  };

  const signUpWithEmail = async (e: string, p: string, name: string, role: UserRole) => {
    const res = await createUserWithEmailAndPassword(auth, e, p);
    if (res.user) {
      const newProfile: UserProfile = {
        uid: res.user.uid,
        name: name,
        email: e,
        role: role,
        matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023', 'matter_e569_2022', 'matter_e104_2024'],
        notifyPrefs: { email: true, inApp: true, dailyDigest: true },
        theme: 'light',
        title: role === 'admin' ? 'Managing Partner' : 'Counsel',
        organization: 'Legalia Practice Chambers',
      };
      await setDoc(doc(db, 'users', res.user.uid), newProfile);
      setCurrentUser(newProfile);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(DEFAULT_COUNSEL_PROFILE);
    setFirebaseUser(null);
  };

  const updateUserProfile = async (fields: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...fields };
    setCurrentUser(updated);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), fields, { merge: true });
      } catch (err) {
        console.warn('Firestore user update error:', err);
      }
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
