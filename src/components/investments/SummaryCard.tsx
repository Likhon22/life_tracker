"use client";

import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    orange: "text-orange-400 border-orange-500/20 bg-orange-500/5",
    red: "text-red-400 border-red-500/20 bg-red-500/5",
};

export function SummaryCard({
    label,
    value,
    color,
    showSign,
}: {
    label: string;
    value: number;
    color: string;
    showSign?: boolean;
}) {
    return (
        <div className={cn("rounded-2xl border p-4 flex flex-col gap-1", colorMap[color])}>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{label}</span>
            <span className="text-xl font-black tracking-tighter">
                {showSign && value > 0 ? "+" : ""}{value.toLocaleString()}
            </span>
        </div>
    );
}
