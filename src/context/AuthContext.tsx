import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { UserProfile, UserRole } from '../types';

export const DEMO_USERS: Record<string, UserProfile> = {
  admin_demo: {
    uid: 'admin_demo',
    name: 'Chief Managing Partner',
    email: 'admin@lawfirm.com',
    role: 'admin',
    matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023', 'matter_e569_2022', 'matter_e104_2024'],
    notifyPrefs: { email: true, inApp: true, dailyDigest: true },
    theme: 'light',
    title: 'Senior Partner & Head of Litigation',
    organization: 'Chisom & Partners Legal Chambers',
  },
  lawyer_chisom: {
    uid: 'lawyer_chisom',
    name: 'Barr. Chisom Okeke',
    email: 'chisom@lawfirm.com',
    role: 'lawyer',
    matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023', 'matter_e569_2022', 'matter_e104_2024'],
    notifyPrefs: { email: true, inApp: true, dailyDigest: true },
    theme: 'light',
    title: 'Senior Advocate / Lead Litigation Counsel',
    organization: 'Chisom & Partners Legal Chambers',
  },
  paralegal_joy: {
    uid: 'paralegal_joy',
    name: 'Joy Paralegal',
    email: 'joy.paralegal@lawfirm.com',
    role: 'paralegal',
    matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e569_2022'],
    notifyPrefs: { email: false, inApp: true, dailyDigest: false },
    theme: 'light',
    title: 'Senior Litigation Paralegal',
    organization: 'Chisom & Partners Legal Chambers',
  },
  client_ibe: {
    uid: 'client_ibe',
    name: 'Mr. Ibe Christian Aforka',
    email: 'ibe.aforka@clientmail.com',
    role: 'client',
    matterAccess: ['matter_e968_2022'],
    notifyPrefs: { email: true, inApp: true, dailyDigest: false },
    theme: 'light',
    title: 'Client (Defendant in E/968/2022)',
    organization: 'Aforka Holdings Ltd',
  },
};

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, name: string, role: UserRole) => Promise<void>;
  switchDemoUser: (demoKey: keyof typeof DEMO_USERS) => void;
  logout: () => Promise<void>;
  updateUserProfile: (fields: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(DEMO_USERS.admin_demo);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // Map firebase user to profile
        setCurrentUser({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Legal Counsel',
          email: user.email || 'counsel@lawfirm.com',
          role: 'lawyer',
          matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023', 'matter_e569_2022', 'matter_e104_2024'],
          notifyPrefs: { email: true, inApp: true, dailyDigest: true },
          theme: 'light',
          title: 'Practicing Attorney',
          organization: 'Law Firm Chambers',
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign in error:', err);
      throw err;
    }
  };

  const loginWithEmail = async (e: string, p: string) => {
    try {
      await signInWithEmailAndPassword(auth, e, p);
    } catch (err) {
      console.error('Email sign in error:', err);
      // Fallback for easy trial
      setCurrentUser({
        uid: `user_${Date.now()}`,
        name: e.split('@')[0],
        email: e,
        role: 'lawyer',
        matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023', 'matter_e569_2022', 'matter_e104_2024'],
        notifyPrefs: { email: true, inApp: true, dailyDigest: true },
        theme: 'light',
      });
    }
  };

  const signUpWithEmail = async (e: string, p: string, name: string, role: UserRole) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, e, p);
      setCurrentUser({
        uid: res.user.uid,
        name: name,
        email: e,
        role: role,
        matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023'],
        notifyPrefs: { email: true, inApp: true, dailyDigest: true },
        theme: 'light',
      });
    } catch (err) {
      console.error('Sign up error:', err);
      setCurrentUser({
        uid: `user_${Date.now()}`,
        name: name,
        email: e,
        role: role,
        matterAccess: ['matter_e968_2022', 'matter_e779_2021'],
        notifyPrefs: { email: true, inApp: true, dailyDigest: true },
        theme: 'light',
      });
    }
  };

  const switchDemoUser = (demoKey: keyof typeof DEMO_USERS) => {
    if (DEMO_USERS[demoKey]) {
      setCurrentUser(DEMO_USERS[demoKey]);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Signout error:', e);
    }
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const updateUserProfile = (fields: Partial<UserProfile>) => {
    if (!currentUser) return;
    setCurrentUser((prev) => (prev ? { ...prev, ...fields } : null));
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
        switchDemoUser,
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
