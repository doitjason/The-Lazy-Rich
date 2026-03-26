"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BackButtonProps {
    text?: string;
    href?: string;
    className?: string;
}

export function BackButton({ text, href, className }: BackButtonProps) {
    const router = useRouter();

    const content = (
        <>
            <ChevronLeft className="w-5 h-5 text-foreground" />
            {text && <span className="text-sm font-medium text-foreground pr-2">{text}</span>}
        </>
    );

    const baseClassName = cn(
        "flex items-center gap-0.5 p-1.5 -ml-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
        className
    );

    if (href) {
        return (
            <Link href={href} className={baseClassName}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={() => router.back()} className={baseClassName}>
            {content}
        </button>
    );
}
