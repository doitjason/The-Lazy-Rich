"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { trackMetaEvent } from "@/lib/analytics";
import { InAppBrowserModal } from "@/components/auth/InAppBrowserModal";

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
    signInWithKakao: () => Promise<void>;
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
    signInWithKakao: async () => { },
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [inAppWarningOpen, setInAppWarningOpen] = useState(false);

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
        } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;
            setSession(session);
            updateUserState(currentUser);
            setLoading(false);

            // 회원가입 전송 (P0 #1)
            // 신규 가입일 경우 created_at과 last_sign_in_at이 거의 동일하거나 null인 경우를 체크합니다.
            if (event === "SIGNED_IN" && currentUser) {
                const createdAt = new Date(currentUser.created_at).getTime();
                const lastSignIn = currentUser.last_sign_in_at 
                   ? new Date(currentUser.last_sign_in_at).getTime() 
                   : Date.now();
                
                // 가입 정보와 마지막 로그인 정보의 시차가 30초 이내면 신규 가입으로 간주
                const isNewUser = Math.abs(lastSignIn - createdAt) < 30000;
                
                if (isNewUser) {
                    trackMetaEvent("CompleteRegistration", {
                        content_name: currentUser.app_metadata.provider || "email",
                        status: true,
                    });
                }
            }
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
        const ua = typeof window !== "undefined" ? (navigator.userAgent || navigator.vendor || (window as any).opera) : "";
        const isInApp = /KAKAOTALK|Instagram|NAVER|Line|FBAN|FBAV/i.test(ua);
        
        if (isInApp) {
            setInAppWarningOpen(true);
            return;
        }

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

    const signInWithKakao = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "kakao",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
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
            signInWithKakao,
            signOut,
            refreshProfile
        }}>
            {children}
            <InAppBrowserModal open={inAppWarningOpen} onOpenChange={setInAppWarningOpen} />
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
