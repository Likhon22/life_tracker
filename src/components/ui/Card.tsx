"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl",
                className
            )}
            {...props}
        />
    );
}

const accentClasses = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
    orange: "bg-orange-500/10 text-orange-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
} as const;

export function CardHeader({
    icon,
    title,
    accent = "blue",
    action,
}: {
    icon: ReactNode;
    title: string;
    accent?: keyof typeof accentClasses;
    action?: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl", accentClasses[accent])}>{icon}</div>
                <h2 className="font-bold text-lg text-white tracking-tight">{title}</h2>
            </div>
            {action}
        </div>
    );
}
