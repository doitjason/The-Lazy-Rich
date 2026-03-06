import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-16 h-16"
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-6 h-6",
        xl: "w-8 h-8"
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
            <div className={cn(
                "flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/20 backdrop-blur-md",
                sizeClasses[size]
            )}>
                <Landmark className={cn("text-white fill-white/20", iconSizes[size])} />
            </div>
            {showText && (
                <div className="text-center">
                    <span className="font-serif font-bold tracking-tight text-foreground">The Lazy Rich</span>
                </div>
            )}
        </div>
    );
}
