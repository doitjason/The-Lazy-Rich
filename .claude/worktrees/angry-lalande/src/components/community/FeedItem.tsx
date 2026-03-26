"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, MessageCircle, Share, MoreHorizontal, Loader2, Send, Trash2, Pencil, Check, X } from "lucide-react";
import { Post, toggleLike, fetchComments, createComment, Comment, deletePost, updatePost, parseSmartLinks, getCalcName, SmartLinkData } from "@/lib/community";
import { UserProfile } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { CommentItem } from "./CommentItem";
import { useRouter } from "next/navigation";
import { TrendingUp, PieChart, Calculator as CalcIcon, ExternalLink } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FeedItemProps {
    post: Post;
    currentUser: UserProfile | null;
    onRequireLogin: () => void;
    onDelete?: (postId: string) => void;
}

export function FeedItem({ post, currentUser, onRequireLogin, onDelete }: FeedItemProps) {
    const [isLiked, setIsLiked] = useState(post.has_liked || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [isLiking, setIsLiking] = useState(false);

    // Comments State
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [newCommentContent, setNewCommentContent] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count || 0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isUpdating, setIsUpdating] = useState(false);
    const [displayContent, setDisplayContent] = useState(post.content);
    
    const router = useRouter();

    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko });

    const handleLinkClick = (link: SmartLinkData) => {
        const query = new URLSearchParams(link.params).toString();
        router.push(`/calc?tab=${link.id}&${query}`);
    };

    const renderContentWithLinks = (content: string): (string | React.ReactNode)[] => {
        const links = parseSmartLinks(content);
        if (links.length === 0) return [content];

        const parts: (string | React.ReactNode)[] = [];
        let lastIndex = 0;

        links.forEach((link, index) => {
            const startIndex = content.indexOf(link.raw, lastIndex);
            if (startIndex === -1) return;

            // Push text before the link
            if (startIndex > lastIndex) {
                parts.push(content.substring(lastIndex, startIndex));
            }

            // Push interactive badge
            const Icon = link.id === "regret" ? TrendingUp : (link.id === "regret-v2" ? PieChart : CalcIcon);
            const colorClass = link.id === "regret" 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-emerald-500/5" 
                : (link.id === "regret-v2" 
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 shadow-blue-500/5" 
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 shadow-amber-500/5");

            parts.push(
                <button
                    key={`${link.id}-${index}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLinkClick(link);
                    }}
                    className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all hover:bg-opacity-30 active:scale-[0.98] mx-0.5 whitespace-nowrap align-baseline translate-y-[1px]",
                        colorClass
                    )}
                >
                    <Icon className="h-3 w-3" />
                    <span className="font-bold text-[12px]">{getCalcName(link.id)}</span>
                </button>
            );

            lastIndex = startIndex + link.raw.length;
        });

        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }

        return parts;
    };

    const handleLike = async () => {
        if (!currentUser) {
            onRequireLogin();
            return;
        }

        if (isLiking) return;
        setIsLiking(true);

        const newLikedState = !isLiked;
        
        // Optimistic update
        setIsLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

        const success = await toggleLike(post.id, currentUser.id, !newLikedState);
        
        if (!success) {
            // Revert on failure
            setIsLiked(!newLikedState);
            setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
        }
        
        setIsLiking(false);
    };

    const handleCommentClick = async () => {
        if (!currentUser) {
            onRequireLogin();
            return;
        }
        
        const willShow = !showComments;
        setShowComments(willShow);

        if (willShow && comments.length === 0) {
            setIsLoadingComments(true);
            const fetchedComments = await fetchComments(post.id);
            setComments(fetchedComments);
            setIsLoadingComments(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!newCommentContent.trim() || !currentUser) return;

        setIsSubmittingComment(true);
        const newComment = await createComment(
            post.id,
            currentUser.id,
            currentUser.name,
            currentUser.avatar_url,
            newCommentContent.trim()
        );

        if (newComment) {
            setComments(prev => [...prev, newComment]);
            setNewCommentContent("");
            setLocalCommentsCount(prev => prev + 1);
        }
        setIsSubmittingComment(false);
    };

    const handleDelete = async () => {
        if (!currentUser || currentUser.id !== post.user_id) return;
        
        if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            setIsDeleting(true);
            const success = await deletePost(post.id, currentUser.id);
            if (success) {
                onDelete?.(post.id);
            }
            setIsDeleting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editContent.trim() || !currentUser || currentUser.id !== post.user_id) return;

        setIsUpdating(true);
        const success = await updatePost(post.id, currentUser.id, editContent.trim());
        
        if (success) {
            setDisplayContent(editContent.trim());
            setIsEditing(false);
        }
        setIsUpdating(false);
    };

    const handleCancelEdit = () => {
        setEditContent(displayContent);
        setIsEditing(false);
    };

    return (
        <div className="flex gap-4 py-5 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors px-4 sm:px-5 group/feed">
            {/* Avatar Column */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="h-10 w-10 text-[10px] rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold text-muted-foreground ring-1 ring-border/50">
                    {post.user_avatar && post.user_avatar.includes('http') ? (
                        <img src={post.user_avatar} alt={post.user_name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="text-xl">
                            {post.user_avatar || post.user_name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                {/* Visual Thread Line (Active when comments open) */}
                <div className={cn("w-[2px] flex-1 bg-border/40 my-1.5 rounded-full transition-all", showComments ? "opacity-100" : "opacity-0")} />
            </div>

            {/* Content Column */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-[15px] truncate text-foreground tracking-tight">{post.user_name}</span>
                        <span className="text-muted-foreground text-[13px] whitespace-nowrap">· {timeAgo}</span>
                    </div>
                    {currentUser?.id === post.user_id ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="text-muted-foreground hover:text-foreground p-1 -mr-1 rounded-full hover:bg-muted transition-colors">
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-xl border-white/20 dark:border-white/10">
                                <DropdownMenuItem 
                                    onClick={() => setIsEditing(true)}
                                    className="focus:bg-primary/10 cursor-pointer font-medium"
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    수정하기
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer font-medium"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {isDeleting ? "삭제 중..." : "삭제하기"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <button className="text-muted-foreground hover:text-foreground p-1 -mr-1 rounded-full hover:bg-muted transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="mt-1.5 mb-3 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words tracking-tight">
                    {isEditing ? (
                        <div className="flex flex-col gap-3 my-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-muted/30 border border-border/20 rounded-xl p-3 text-[15px] focus:ring-1 focus:ring-primary outline-none resize-none min-h-[100px]"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={handleCancelEdit}
                                    disabled={isUpdating}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1"
                                >
                                    <X className="h-3 w-3" />
                                    취소
                                </button>
                                <button 
                                    onClick={handleUpdate}
                                    disabled={isUpdating || !editContent.trim()}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-colors flex items-center gap-1"
                                >
                                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    저장
                                </button>
                            </div>
                        </div>
                    ) : displayContent.length <= 200 ? (
                        renderContentWithLinks(displayContent)
                    ) : (
                        <>
                            {isExpanded 
                                ? renderContentWithLinks(displayContent) 
                                : renderContentWithLinks(`${displayContent.slice(0, 200)}...`)}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                                className="text-muted-foreground hover:text-foreground font-semibold text-[13px] ml-1 transition-colors underline-offset-2 hover:underline"
                            >
                                {isExpanded ? "간략히 보기" : "더보기"}
                            </button>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-5 mt-1 -ml-2">
                    <button 
                        onClick={handleLike}
                        disabled={isLiking}
                        className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-rose-500 transition-colors group p-2 rounded-full hover:bg-rose-500/10"
                    >
                        <Heart 
                            className={cn(
                                "h-[18px] w-[18px] transition-all duration-300", 
                                isLiked ? "fill-rose-500 text-rose-500 scale-110" : "group-hover:text-rose-500 group-hover:scale-105"
                            )} 
                        />
                        <span className={cn("font-medium", isLiked && "text-rose-500")}>
                            {likesCount > 0 ? likesCount : ""}
                        </span>
                    </button>
                    
                    <button 
                        onClick={handleCommentClick}
                        className={cn(
                            "flex items-center gap-1.5 text-[13px] transition-colors group p-2 rounded-full",
                            showComments ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                        )}
                    >
                        <MessageCircle className="h-[18px] w-[18px] transition-colors group-hover:scale-105" />
                        <span className="font-medium">
                            {localCommentsCount > 0 ? localCommentsCount : ""}
                        </span>
                    </button>

                    <button className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-foreground/5 ml-auto">
                        <Share className="h-[18px] w-[18px] group-hover:scale-105 transition-transform" />
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Comment List */}
                        {isLoadingComments ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : comments.length > 0 ? (
                            <div className="flex flex-col gap-1 mb-4">
                                {comments.map(c => (
                                    <CommentItem key={c.id} comment={c} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-[13px] text-muted-foreground">
                                아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요.
                            </div>
                        )}

                        {/* Comment Composer */}
                        <div className="flex gap-2 items-start mt-2 px-2 sm:px-0">
                            <div className="h-8 w-8 text-[9px] rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold text-muted-foreground ring-1 ring-border/50 flex-shrink-0">
                                {currentUser?.avatar_url && currentUser.avatar_url.includes('http') ? (
                                    <img src={currentUser.avatar_url} alt={currentUser.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="text-lg">
                                        {currentUser?.avatar_url || currentUser?.name?.charAt(0).toUpperCase() || "익"}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 bg-muted/30 rounded-2xl p-2 ring-1 ring-border/50 focus-within:ring-border/80 transition-shadow">
                                <textarea
                                    value={newCommentContent}
                                    onChange={(e) => setNewCommentContent(e.target.value)}
                                    placeholder={`${post.user_name}님에게 답글 남기기...`}
                                    className="w-full bg-transparent resize-none outline-none text-[13px] placeholder:text-muted-foreground/60 min-h-[36px] max-h-[150px] px-1"
                                    rows={newCommentContent.split('\n').length > 1 ? Math.min(newCommentContent.split('\n').length, 5) : 1}
                                />
                                {newCommentContent.trim() && (
                                    <div className="flex justify-end mt-1">
                                        <button
                                            onClick={handleSubmitComment}
                                            disabled={isSubmittingComment}
                                            className="bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                                        >
                                            {isSubmittingComment ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Send className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
