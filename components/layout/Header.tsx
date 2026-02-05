"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Header() {
    return (
        <header className={cn(
            "sticky top-0 z-50 w-full",
            "h-16 flex items-center justify-center",
            "glass-panel border-t-0 border-x-0 rounded-none shadow-sm"
        )}>
            <div className="container h-full flex items-center justify-between px-4 md:px-6">
                {/* Logo Area */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-all">
                        C
                    </div>
                    <span className="font-serif font-bold text-xl tracking-tight text-foreground">
                        CORE
                    </span>
                </Link>

                {/* Navigation placeholder */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="/calculators" className="hover:text-primary transition-colors">
                        계산기
                    </Link>
                    <Link href="/portfolio" className="hover:text-primary transition-colors">
                        포트폴리오
                    </Link>
                    <button className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg">
                        구루 연결하기
                    </button>
                </nav>
            </div>
        </header>
    );
}
