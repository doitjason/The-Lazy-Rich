"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Calculator, PieChart, Lightbulb, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
    {
        label: "AI Mentor",
        icon: Bot,
        href: "/guru",
    },
    {
        label: "Calc",
        icon: Calculator,
        href: "/calc",
    },
    {
        label: "Portfolio",
        icon: PieChart,
        href: "/portfolio",
    },
    {
        label: "Insights",
        icon: Lightbulb,
        href: "/insights",
    },
    {
        label: "Profile",
        icon: User,
        href: "/profile",
    },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 bg-white/70 backdrop-blur-md pb-safe dark:border-white/10 dark:bg-black/40">
            <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
                {items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors hover:text-primary",
                                isActive
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground/80"
                            )}
                        >
                            <item.icon className={cn("size-6", isActive && "fill-current/20")} />
                            <span className="text-[10px]">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
