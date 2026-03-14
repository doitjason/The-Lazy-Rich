"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type AuthResult = {
    success: boolean;
    error?: string;
};

export type UserProfile = {
    id: string;
    email?: string;
    name: string;
    avatar_url: string;
    is_anonymous?: boolean; // True if using default nickname
};

type AuthContextType = {
    user: User | null;
    userProfile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
    signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    session: null,
    loading: true,
    signUpWithEmail: async () => ({ success: false }),
    signInWithEmail: async () => ({ success: false }),
    signInWithGoogle: async () => { },
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const updateUserState = async (currentUser: User | null) => {
        setUser(currentUser);
        if (currentUser) {
            // First set default from metadata
            const metadata = currentUser.user_metadata || {};
            const defaultProfile = {
                id: currentUser.id,
                email: currentUser.email,
                name: metadata.full_name || metadata.name || currentUser.email?.split('@')[0] || "익명의 투자자",
                avatar_url: metadata.avatar_url || metadata.picture || "",
            };
            setUserProfile(defaultProfile);

            // Then try to fetch from profiles table for the nickname
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('nickname, avatar_url')
                    .eq('id', currentUser.id)
                    .single();
                
                if (profile && !error) {
                    setUserProfile({
                        ...defaultProfile,
                        name: profile.nickname,
                        avatar_url: profile.avatar_url || defaultProfile.avatar_url,
                    });
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            }
        } else {
            setUserProfile(null);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await updateUserState(user);
        }
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            updateUserState(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            updateUserState(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            return { success: false, error: error.message };
        }
        if (data.session) {
            setSession(data.session);
            updateUserState(data.session.user);
        }
        return { success: true };
    };

    const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return { success: false, error: error.message };
        }
        if (data.session) {
            setSession(data.session);
            updateUserState(data.session.user);
        }
        return { success: true };
    };

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        updateUserState(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            userProfile,
            session,
            loading,
            signUpWithEmail,
            signInWithEmail,
            signInWithGoogle,
            signOut,
            refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
