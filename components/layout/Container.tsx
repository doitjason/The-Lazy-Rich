import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export default function Container({ children, className, ...props }: ContainerProps) {
    return (
        <div className={cn("container px-4 md:px-6 mx-auto", className)} {...props}>
            {children}
        </div>
    );
}
