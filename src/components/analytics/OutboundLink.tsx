"use client";

import { ExternalLink } from "lucide-react";
import { trackMetaEvent } from "@/lib/analytics";

interface OutboundLinkProps {
    href: string;
    title: string;
    id: string;
    className?: string;
    children: React.ReactNode;
}

export function OutboundLink({ href, title, id, className, children }: OutboundLinkProps) {
    const handleClick = () => {
        trackMetaEvent("CustomEvent", {
            event_name: "OutboundClick",
            content_name: title,
            content_id: id,
            content_type: "book_affiliate",
            target_url: href
        });
    };

    // 제휴 링크에는 rel="sponsored"가 필요하다 (구글 검색 정책). 누락 시 링크 스킴 위반으로 분류된다.
    return (
        <a
            href={href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={handleClick}
            className={className}
        >
            {children}
        </a>
    );
}
