"use client";

import { Bell, Moon, DollarSign, HelpCircle, Shield, LogOut, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";

export function ProfileSettings() {
    const { currency, setCurrency } = useCurrency();
    const { user, signInWithGoogle, signOut } = useAuth();
    const { theme, setTheme } = useTheme();

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

                </div>
            </motion.div>

            {/* Google Login (Guest Only) */}
            {!user && (
                <motion.div variants={item} className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground px-1 uppercase tracking-wide">
                        로그인
                    </h3>
                    <Card className="overflow-hidden border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md p-6">
                        <div className="text-center space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                구글 계정으로 간편하게 시작하세요.
                            </p>
                            <Button
                                onClick={signInWithGoogle}
                                className="w-full h-12 bg-white hover:bg-gray-100 text-black border border-gray-200 shadow-sm relative transition-all active:scale-[0.98]"
                            >
                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                        </div>
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
