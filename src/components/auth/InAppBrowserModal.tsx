"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Compass, CheckCircle2 } from "lucide-react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { motion, AnimatePresence } from "framer-motion";

interface InAppBrowserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InAppBrowserModal({ open, onOpenChange }: InAppBrowserModalProps) {
    const [copied, setCopied] = useState(false);
    const url = typeof window !== "undefined" ? window.location.href : "";

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-3xl border-white/20 dark:border-white/10 p-0 overflow-hidden fixed bottom-0 top-auto translate-y-0 translate-x-[-50%] sm:top-[50%] sm:-translate-y-1/2 rounded-t-3xl rounded-b-none sm:rounded-2xl z-50">
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
                        <Compass className="w-8 h-8 text-orange-500" />
                    </div>

                    <DialogHeader className="space-y-3 mb-8 w-full">
                        <DialogTitle className="text-2xl font-black tracking-tight text-center">
                            앗! 접속 환경 확인
                        </DialogTitle>
                        <DialogDescription className="text-base font-medium leading-relaxed text-center w-full block">
                            현재 인앱 브라우저(카카오톡, 인스타그램 등)로 <br />
                            접속 중이신 것 같아요.<br />
                            안전한 구글 로그인을 위해 <br />
                            <span className="text-foreground font-bold">기본 브라우저(크롬, 사파리 등)</span>로<br />
                            이동해주세요! 🚀
                        </DialogDescription>
                    </DialogHeader>

                    <div className="w-full space-y-4">
                        <CopyToClipboard text={url} onCopy={handleCopy}>
                            <Button
                                className="w-full h-14 text-base font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                variant={copied ? "default" : "outline"}
                                style={copied ? { backgroundColor: "#10b981", color: "white", borderColor: "#10b981" } : {}}
                            >
                                <AnimatePresence mode="wait">
                                    {copied ? (
                                        <motion.div
                                            key="copied"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            링크 복사 완료!
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="flex items-center gap-2 text-foreground"
                                        >
                                            <Copy className="w-5 h-5" />
                                            현재 화면 링크 복사하기
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </CopyToClipboard>
                        
                        <button
                            onClick={() => onOpenChange(false)}
                            className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
