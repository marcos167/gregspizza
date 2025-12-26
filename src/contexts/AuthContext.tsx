import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'admin' | 'employee';
    avatar_url: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
    loading: boolean;
    profileLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!isMounted) return;

                setSession(session);
                setUser(session?.user ?? null);

                // ✅ CRITICAL FIX: Set loading = false IMMEDIATELY after session loads
                // User is authenticated if session exists, regardless of profile status
                setLoading(false);

                // Load profile in background (non-blocking)
                if (session?.user) {
                    loadProfile(session.user.id);
                }
            } catch (error) {
                console.error('Auth init error:', error);
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!isMounted) return;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    loadProfile(session.user.id);
                } else {
                    setProfile(null);
                    setProfileLoading(false);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const loadProfile = async (userId: string) => {
        setProfileLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('Profile not found or error loading:', error.message);
                setProfile(null);
            } else if (data) {
                setProfile(data);
            }
        } catch (error) {
            console.warn('Error fetching profile:', error);
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'employee',
                },
            },
        });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    const value = {
        user,
        profile,
        session,
        signIn,
        signUp,
        signOut,
        isAdmin: profile?.role === 'admin',
        loading,
        profileLoading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
