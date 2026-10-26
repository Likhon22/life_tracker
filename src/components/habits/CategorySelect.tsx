"use client";

import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitCategory } from "./HabitProvider";

export function CategorySelect({
    categories,
    value,
    onChange,
    className,
}: {
    categories: HabitCategory[];
    value: string;
    onChange: (id: string) => void;
    className?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [isOpen]);

    const selected = categories.find((c) => c.id === value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SelectedIcon = selected ? (Icons as any)[selected.icon] || Icons.HelpCircle : Icons.HelpCircle;

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 bg-[#111111] border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white outline-none transition-all cursor-pointer"
            >
                <span className="flex items-center gap-2 overflow-hidden">
                    <SelectedIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{selected?.name ?? "Select category"}</span>
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-[#888888] shrink-0 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute z-20 mt-1.5 w-full bg-[#191919] border border-[#2d2d2d] rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                    {categories.map((cat) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const IconComponent = (Icons as any)[cat.icon] || Icons.HelpCircle;
                        const isSelected = cat.id === value;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => { onChange(cat.id); setIsOpen(false); }}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer",
                                    isSelected ? "bg-blue-500/10 text-blue-400" : "text-[#ededed] hover:bg-white/5"
                                )}
                            >
                                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{cat.name}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
