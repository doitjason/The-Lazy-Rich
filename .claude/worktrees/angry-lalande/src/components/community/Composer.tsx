"use client";

import { useState } from "react";
import { UserProfile } from "@/contexts/AuthContext";
import { createPost, parseSmartLinks, getCalcName } from "@/lib/community";
import { Send, TrendingUp, PieChart, Calculator as CalcIcon, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { SmartLinkDialog } from "./SmartLinkDialog";
import { SmartLinkCalcId } from "@/lib/community";
import { useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";

interface ComposerProps {
    currentUser: UserProfile | null;
    onRequireLogin: () => void;
    onPostCreated: () => void;
}

export function Composer({ currentUser, onRequireLogin, onPostCreated }: ComposerProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [selectedCalcId, setSelectedCalcId] = useState<SmartLinkCalcId>("regret");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    // Sync scroll between textarea and backdrop
    const handleScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const removeLink = (rawLink: string) => {
        setContent(prev => prev.replace(rawLink, "").trim());
    };

    const renderDraftContent = () => {
        if (!content) return null;

        const links = parseSmartLinks(content);
        if (links.length === 0) return <span className="text-foreground/90 whitespace-pre-wrap">{content}</span>;

        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        // Sorting links by index to handle them sequentially
        const sortedLinks = [...links].sort((a, b) => content.indexOf(a.raw) - content.indexOf(b.raw));

        sortedLinks.forEach((link, index) => {
            const startIndex = content.indexOf(link.raw, lastIndex);
            if (startIndex === -1) return;

            // Text before link
            if (startIndex > lastIndex) {
                parts.push(<span key={`text-${index}`} className="whitespace-pre-wrap text-foreground/90">{content.substring(lastIndex, startIndex)}</span>);
            }

            // The Pill
            const Icon = link.id === "regret" ? TrendingUp : (link.id === "regret-v2" ? PieChart : CalcIcon);
            const colorClass = link.id === "regret" 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                : (link.id === "regret-v2" 
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" 
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20");

            parts.push(
                <span
                    key={`pill-${index}`}
                    className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold mx-0.5 select-none align-baseline translate-y-[1px]",
                        colorClass
                    )}
                >
                    <Icon className="h-3 w-3" />
                    <span className="font-bold text-[12px]">{getCalcName(link.id)}</span>
                </span>
            );
            
            lastIndex = startIndex + link.raw.length;
        });

        if (lastIndex < content.length) {
            parts.push(<span key="text-last" className="whitespace-pre-wrap text-foreground/90">{content.substring(lastIndex)}</span>);
        }

        return parts;
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;

        if (!currentUser) {
            onRequireLogin();
            return;
        }

        setIsSubmitting(true);
        const post = await createPost(
            currentUser.id,
            currentUser.name,
            currentUser.avatar_url,
            content.trim()
        );

        if (post) {
            setContent("");
            onPostCreated();
        }
        setIsSubmitting(false);
    };

    const handleFocus = () => {
        if (!currentUser) {
            onRequireLogin();
        }
    };

    const handleInsertLink = (link: string) => {
        setContent((prev) => prev ? `${prev} ${link}` : link);
    };

    const openLinkDialog = (id: SmartLinkCalcId) => {
        if (!currentUser) {
            onRequireLogin();
            return;
        }
        setSelectedCalcId(id);
        setIsLinkDialogOpen(true);
    };

    const placeholder = currentUser 
        ? "어떤 투자 고민이 있으신가요?" 
        : "로그인하고 투자 고민을 나누어보세요";

    return (
        <div className="flex flex-col gap-3 py-4 mb-2 border border-border/20 rounded-2xl bg-white/40 dark:bg-[#181a20]/40 backdrop-blur-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] px-4 sm:px-5">
            <div className="flex gap-3">
                <div className="flex-shrink-0">
                    <div className="h-10 w-10 text-[10px] rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold text-muted-foreground ring-1 ring-border/50">
                        {currentUser?.avatar_url && currentUser.avatar_url.includes('http') ? (
                            <img src={currentUser.avatar_url} alt={currentUser.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="text-xl">
                                {currentUser?.avatar_url || currentUser?.name?.charAt(0).toUpperCase() || "익"}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col flex-1 min-w-0 pt-1 relative group">
                    {/* Live Rich Preview Overlay */}
                    {parseSmartLinks(content).length > 0 && (
                        <div className="mb-3 p-3 rounded-xl bg-muted/20 border border-border/10 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block px-1">미리보기</Label>
                            <div className="text-[15px] leading-relaxed break-words tracking-tight">
                                {renderDraftContent()}
                            </div>
                        </div>
                    )}

                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onFocus={handleFocus}
                        placeholder={placeholder}
                        maxLength={500}
                        className="w-full bg-transparent border-none focus:ring-0 text-[15px] resize-none min-h-[80px] p-0 placeholder:text-muted-foreground/50 tracking-tight outline-none leading-relaxed max-h-[300px] transition-all"
                    />
                </div>
            </div>
            
            <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/10">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex-shrink-0 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold flex items-center gap-1.5 hover:bg-secondary/80 transition-colors">
                                <CalcIcon className="h-3 w-3" />
                                본문에 계산기 링크 추가
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem onClick={() => openLinkDialog("regret")} className="text-[12px] flex items-center gap-2 cursor-pointer py-2">
                                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                <span>했제 계산기 V1</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openLinkDialog("regret-v2")} className="text-[12px] flex items-center gap-2 cursor-pointer py-2">
                                <PieChart className="h-3.5 w-3.5 text-blue-500" />
                                <span>했제 계산기 V2</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openLinkDialog("compound")} className="text-[12px] flex items-center gap-2 cursor-pointer py-2">
                                <CalcIcon className="h-3.5 w-3.5 text-amber-500" />
                                <span>자유 계산기</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-3 ml-2">
                    <span className={cn(
                        "text-[10px] font-medium transition-colors hidden sm:inline",
                        content.length >= 450 ? "text-amber-500" : "text-muted-foreground/40",
                        content.length >= 500 && "text-rose-500 font-bold"
                    )}>
                        {content.length} / 500
                    </span>
                    
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !content.trim()}
                        className="bg-foreground text-background px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 hover:scale-105 transition-transform disabled:opacity-30 disabled:hover:scale-100 shadow-sm"
                    >
                        {isSubmitting ? (
                            <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>게시</span>
                                <Send className="h-3.5 w-3.5" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            <SmartLinkDialog
                isOpen={isLinkDialogOpen}
                onClose={() => setIsLinkDialogOpen(false)}
                onInsert={handleInsertLink}
                initialCalcId={selectedCalcId}
            />
        </div>
    );
}
