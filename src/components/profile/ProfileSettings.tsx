"use client";

import { Bell, Moon, DollarSign, HelpCircle, Shield, LogOut, ChevronRight, User, Sparkles, Landmark, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateNickname } from "@/lib/community";
import { Input } from "@/components/ui/input";

export function ProfileSettings() {
    const { currency, setCurrency } = useCurrency();
    const { user, signInWithGoogle, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    
    // Nickname Edit State
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [newNickname, setNewNickname] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [nicknameError, setNicknameError] = useState("");

    const { userProfile, refreshProfile } = useAuth();

    useEffect(() => {
        setMounted(true);
        if (userProfile) {
            setNewNickname(userProfile.name);
        }
    }, [userProfile]);

    const handleSaveNickname = async () => {
        if (!user || !userProfile) return;
        if (!newNickname.trim() || newNickname === userProfile.name) {
            setIsEditingNickname(false);
            return;
        }

        if (newNickname.length < 2 || newNickname.length > 20) {
            setNicknameError("닉네임은 2~20자 사이여야 합니다.");
            return;
        }

        setIsSaving(true);
        setNicknameError("");

        const result = await updateNickname(user.id, newNickname.trim());
        
        if (result.success) {
            await refreshProfile();
            setIsEditingNickname(false);
        } else {
            setNicknameError(result.error || "변경에 실패했습니다.");
        }
        setIsSaving(false);
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
            <motion.div variants={item} className="flex flex-col items-center text-center space-y-4 pt-4">
                <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-emerald-500/30 flex items-center justify-center border-2 border-primary/20 shadow-2xl overflow-hidden backdrop-blur-sm">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-10 w-10 text-primary" />
                        )}
                    </div>
                    {user && (
                        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary border-4 border-background flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-white fill-current" />
                        </div>
                    )}
                </div>
                <div>
                    {!isEditingNickname ? (
                        <div className="flex items-center justify-center gap-2">
                             <h2 className="text-2xl font-bold">
                                {userProfile?.name || "게스트"}
                            </h2>
                            {user && (
                                <button 
                                    onClick={() => setIsEditingNickname(true)}
                                    className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                                >
                                    <Sparkles className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 max-w-[200px] mx-auto">
                            <Input 
                                value={newNickname}
                                onChange={(e) => {
                                    setNewNickname(e.target.value);
                                    setNicknameError("");
                                }}
                                className="h-9 text-center font-bold text-lg focus-visible:ring-primary/20"
                                autoFocus
                            />
                            {nicknameError && <p className="text-[10px] text-red-500 font-medium">{nicknameError}</p>}
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 text-xs"
                                    onClick={() => {
                                        setIsEditingNickname(false);
                                        setNewNickname(userProfile?.name || "");
                                        setNicknameError("");
                                    }}
                                >
                                    취소
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="h-7 text-xs font-bold"
                                    onClick={handleSaveNickname}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "저장 중..." : "저장"}
                                </Button>
                            </div>
                        </div>
                    )}
                    {user && !isEditingNickname && (
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                    )}
                </div>
            </motion.div>

            {/* Authentication Group (Guest Only) */}
            {!user && (
                <motion.div variants={item} className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground px-1 uppercase tracking-wide">
                        로그인
                    </h3>

                    {/* Google Login Card */}
                    <Card className="overflow-hidden border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md p-6">
                        <div className="text-center space-y-4">
                            <p className="text-xs text-muted-foreground">
                                구글 계정으로 간편하게 시작하세요.
                            </p>
                            <Button
                                onClick={signInWithGoogle}
                                className="w-full h-11 bg-white hover:bg-gray-100 text-black border border-gray-200 shadow-sm relative transition-all active:scale-[0.98]"
                            >
                                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Google로 계속하기
                            </Button>
                            <div className="flex items-start gap-2 px-1 pt-1">
                                <Shield className="h-3 w-3 text-emerald-500/60 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-muted-foreground leading-relaxed text-left">
                                    안전한 구글 표준 인증 시스템을 통해 로그인하며, 귀하의 대화 및 포트폴리오 데이터는 암호화되어 안전하게 보호됩니다.
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Preferences Group */}
            <motion.div variants={item} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground px-1 uppercase tracking-wide">환경설정</h3>
                <Card className="overflow-hidden border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                    <div className="divide-y divide-white/10 dark:divide-white/5">
                        <div className="p-4 flex items-center justify-between hover:bg-white/5 dark:hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <span className="font-semibold text-[13px]">알림 설정</span>
                            </div>
                            <Switch defaultChecked={mounted ? true : false} />
                        </div>

                        <div className="p-4 flex items-center justify-between hover:bg-white/5 dark:hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Moon className="h-4 w-4" />
                                </div>
                                <span className="font-semibold text-[13px]">다크 모드</span>
                            </div>
                            <Switch
                                checked={mounted ? theme === "dark" : false}
                                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                            />
                        </div>

                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 dark:hover:bg-white/5 transition-colors group"
                            onClick={() => setCurrency(currency === "KRW" ? "USD" : "KRW")}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <span className="font-semibold text-[13px]">기본 통화</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{currency === "KRW" ? "원화 (KRW)" : "달러 (USD)"}</span>
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
                        <Link href="/profile/about" className="block group">
                            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Landmark className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-[13px]">서비스 스토리</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        <Link href="/terms" className="block group">
                            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-[13px]">이용약관</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        <Link href="/privacy" className="block group">
                            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Shield className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-[13px]">개인정보 처리방침</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
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
