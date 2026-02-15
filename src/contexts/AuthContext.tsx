"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthResult = {
    success: boolean;
    error?: string;
};

type AuthContextType = {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
    signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signUpWithEmail: async () => ({ success: false }),
    signInWithEmail: async () => ({ success: false }),
    signInWithGoogle: async () => { },
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
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
            setUser(data.session.user);
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
            setUser(data.session.user);
        }
        return { success: true };
    };

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            signUpWithEmail,
            signInWithEmail,
            signInWithGoogle,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
