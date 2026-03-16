"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SocialLoginButtonsProps {
    className?: string;
    onLoginStart?: () => void;
}

export function SocialLoginButtons({ className, onLoginStart }: SocialLoginButtonsProps) {
    const { signInWithGoogle, signInWithKakao } = useAuth();

    const handleGoogleLogin = async () => {
        if (onLoginStart) onLoginStart();
        await signInWithGoogle();
    };

    const handleKakaoLogin = async () => {
        if (onLoginStart) onLoginStart();
        await signInWithKakao();
    };

    return (
        <div className={cn("grid grid-cols-1 gap-3", className)}>
            <Button
                onClick={handleGoogleLogin}
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

            <Button
                onClick={handleKakaoLogin}
                className="w-full h-11 bg-[#FEE500] hover:bg-[#FADA00] text-[#191919] border-none shadow-sm relative transition-all active:scale-[0.98] font-bold"
            >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.47715 3 2 6.47715 2 10.75C2 13.5186 3.55913 15.949 6.00032 17.502L5.19741 20.4485C5.10777 20.7788 5.49266 21.0425 5.76077 20.8643L9.22129 18.5721C10.1102 18.7885 11.0411 18.9043 12 18.9043C17.5228 18.9043 22 15.4272 22 11.1543C22 6.88143 17.5228 3.4043 12 3.4043L12 3Z" />
                </svg>
                카카오로 계속하기
            </Button>
        </div>
    );
}
