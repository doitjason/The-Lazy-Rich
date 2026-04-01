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

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={className}
        >
            {children}
        </a>
    );
}
