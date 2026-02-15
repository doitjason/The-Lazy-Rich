"use client";

import { useState } from "react";
import { Bell, Moon, DollarSign, HelpCircle, Shield, LogOut, ChevronRight, User, Mail, Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";

export function ProfileSettings() {
    const { currency, setCurrency } = useCurrency();
    const { user, signUpWithEmail, signInWithEmail, signOut, loading } = useAuth();
    const { theme, setTheme } = useTheme();

    // Auth form state
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [signUpSuccess, setSignUpSuccess] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError("");
        setAuthLoading(true);

        const result = isSignUp
            ? await signUpWithEmail(email, password)
            : await signInWithEmail(email, password);

        setAuthLoading(false);

        if (!result.success) {
            setAuthError(result.error || "Authentication failed");
        } else if (isSignUp) {
            setSignUpSuccess(true);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col items-center text-center space-y-3 pt-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border-2 border-primary/20 shadow-lg overflow-hidden">
                    {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <User className="h-10 w-10 text-primary" />
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold">
                        {user ? (user.user_metadata?.full_name || user.email?.split("@")[0] || "사용자") : "게스트"}
                    </h2>
                    {user && (
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                    )}
                    <span className="inline-block px-3 py-1 mt-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {user ? "프로 멤버" : "무료 플랜"}
                    </span>
                </div>
            </motion.div>

            {/* Email Auth Form (Guest Only) */}
            {!user && (
                <motion.div variants={item} className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground px-1 uppercase tracking-wide">
                        {isSignUp ? "회원가입" : "로그인"}
                    </h3>
                    <Card className="overflow-hidden border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md p-4">
                        {signUpSuccess ? (
                            <div className="text-center py-4">
                                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                                    <Mail className="h-6 w-6 text-green-500" />
                                </div>
                                <p className="font-medium text-green-600 dark:text-green-400">이메일을 확인해주세요!</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    확인 링크를 {email}(으)로 보냈습니다.
                                </p>
                                <Button
                                    variant="ghost"
                                    className="mt-4"
                                    onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }}
                                >
                                    로그인으로 돌아가기
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleAuth} className="space-y-4">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            placeholder="이메일 주소"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-12 bg-white/50 dark:bg-black/30"
                                            required
                                        />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            placeholder="비밀번호 (6자 이상)"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 h-12 bg-white/50 dark:bg-black/30"
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                </div>

                                {authError && (
                                    <p className="text-sm text-red-500 text-center">{authError}</p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={authLoading}
                                    className="w-full h-12 bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20"
                                >
                                    {authLoading ? (
                                        <span className="animate-pulse">처리 중...</span>
                                    ) : isSignUp ? (
                                        <><UserPlus className="mr-2 h-4 w-4" /> 계정 만들기</>
                                    ) : (
                                        <><Mail className="mr-2 h-4 w-4" /> 로그인</>
                                    )}
                                </Button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => { setIsSignUp(!isSignUp); setAuthError(""); }}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </Card>
                </motion.div>
            )}

            {/* Preferences Group */}
            <motion.div variants={item} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground px-1 uppercase tracking-wide">환경설정</h3>
                <Card className="overflow-hidden border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                    <div className="divide-y divide-white/10 dark:divide-white/5">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <span className="font-medium">알림 설정</span>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <Moon className="h-4 w-4" />
                                </div>
                                <span className="font-medium">다크 모드</span>
                            </div>
                            <Switch
                                checked={theme === "dark"}
                                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                            />
                        </div>

                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => setCurrency(currency === "KRW" ? "USD" : "KRW")}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <span className="font-medium">기본 통화</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-sm font-medium text-foreground">{currency === "KRW" ? "원화 (KRW)" : "달러 (USD)"}</span>
                                <ChevronRight className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Support Group */}
            <motion.div variants={item} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground px-1 uppercase tracking-wide">지원 및 정보</h3>
                <Card className="overflow-hidden border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                    <div className="divide-y divide-white/10 dark:divide-white/5">
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <HelpCircle className="h-4 w-4" />
                                </div>
                                <span className="font-medium">고객 센터</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <span className="font-medium">개인정보 처리방침</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Logout (Logged In Only) */}
            {
                user && (
                    <motion.div variants={item} className="pt-4">
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                await signOut();
                            }}
                            className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 h-12 backdrop-blur-md shadow-none"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            로그아웃
                        </Button>
                    </motion.div>
                )
            }

            <motion.div variants={item}>
                <p className="text-center text-[10px] text-muted-foreground">
                    Version 1.0.0 • Build 2024
                </p>
            </motion.div>
        </motion.div >
    );
}
