'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { AdminUser } from './DataContext';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isSuperAdmin: boolean;
    adminProfile: AdminUser | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    createAdminAccount: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser?.email) {
                // Load admin profile from Firestore
                const siteRef = doc(db, 'site', 'achv');
                const snap = await getDoc(siteRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const admins: AdminUser[] = data.adminUsers || [];
                    const profile = admins.find(a => a.email === currentUser.email) || null;
                    setAdminProfile(profile);
                } else {
                    setAdminProfile(null);
                }
            } else {
                setAdminProfile(null);
            }
            setLoaded(true);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
        setAdminProfile(null);
    };

    const sendPasswordReset = async (email: string) => {
        const { sendPasswordResetEmail } = await import('firebase/auth');
        await sendPasswordResetEmail(auth, email);
    };

    const createAdminAccount = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
    };

    const isSuperAdmin = !!adminProfile?.isSuperAdmin;

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!user,
            user,
            isSuperAdmin,
            adminProfile,
            login,
            logout,
            sendPasswordReset,
            createAdminAccount,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
