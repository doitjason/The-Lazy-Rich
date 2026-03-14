"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Comment } from "@/lib/community";
import { MoreHorizontal } from "lucide-react";

interface CommentItemProps {
    comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
    const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko });

    return (
        <div className="flex gap-3 py-3 px-3 -mx-3 hover:bg-muted/30 transition-colors rounded-xl opacity-95">
            {/* Avatar Column */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-0.5">
                <div className="h-8 w-8 text-[9px] rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold text-muted-foreground ring-1 ring-border/50">
                    {comment.user_avatar ? (
                        <img src={comment.user_avatar} alt={comment.user_name} className="h-full w-full object-cover" />
                    ) : (
                        comment.user_name.charAt(0).toUpperCase()
                    )}
                </div>
            </div>

            {/* Content Column */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-[14px] truncate text-foreground tracking-tight">{comment.user_name}</span>
                        <span className="text-muted-foreground text-[12px] whitespace-nowrap">· {timeAgo}</span>
                    </div>
                </div>

                <div className="mt-0.5 text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words tracking-tight">
                    {comment.content}
                </div>
            </div>
        </div>
    );
}
