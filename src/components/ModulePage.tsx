"use client";

import { useSession } from "next-auth/react";
import { AuthScreen } from "./AuthScreen";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModulePageProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    authDescription: string;
    children: React.ReactNode;
    maxWidth?: string;
    className?: string;
    headerContent?: React.ReactNode;
    noHeader?: boolean;
}

export function ModulePage({
    title,
    subtitle,
    icon,
    authDescription,
    children,
    maxWidth = "max-w-[1600px]",
    className,
    headerContent,
    noHeader = false
}: ModulePageProps) {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#111111]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!session) {
        return <AuthScreen title={title} description={authDescription} icon={icon} />;
    }

    return (
        <div className={cn("flex-1 flex flex-col h-full bg-[#111111] overflow-y-auto no-scrollbar pb-24 md:pb-12", className)}>
            {!noHeader && (
                <header className={cn("flex-none px-4 md:px-8 pt-8 md:pt-12 pb-6 w-full mx-auto", maxWidth)}>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic capitalize">{title}</h1>
                            <p className="text-[#888888] text-sm md:text-base font-medium">{subtitle}</p>
                        </div>
                        {headerContent}
                    </div>
                </header>
            )}

            <main className={cn("flex-1 px-4 md:px-8 w-full mx-auto", maxWidth)}>
                {children}
            </main>
        </div>
    );
}
