import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
    const sizeMap = {
        sm: 24,
        md: 32,
        lg: 48,
        xl: 64
    };

    const containerSizeClasses = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-16 h-16"
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
            <div className={cn(
                "flex items-center justify-center overflow-hidden rounded-full shadow-lg ring-1 ring-white/10",
                containerSizeClasses[size]
            )}>
                <Image 
                    src="/logo.png" 
                    alt="The Lazy Rich Logo" 
                    width={sizeMap[size]} 
                    height={sizeMap[size]}
                    className="object-cover"
                />
            </div>
            {showText && (
                <div className="text-center">
                    <span className="font-serif font-bold tracking-tight text-foreground">The Lazy Rich</span>
                </div>
            )}
        </div>
    );
}


