"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Cigarette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CigaretteBrand } from "./CigaretteProvider";

export function BrandSelect({
    brands,
    value,
    onChange,
    className,
}: {
    brands: CigaretteBrand[];
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

    const selected = brands.find((b) => b.id === value);

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 bg-white/5 border border-white/5 hover:border-white/10 focus:border-blue-500 rounded-xl px-4 py-3.5 text-sm text-white outline-none transition-all cursor-pointer"
            >
                <span className="flex items-center gap-2 overflow-hidden">
                    <Cigarette className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate font-medium">{selected ? selected.name : "Select brand"}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0 text-[#888888]">
                    {selected && <span className="text-xs">{selected.pricePerStick}/stick</span>}
                    <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-20 mt-1.5 w-full bg-[#191919] border border-[#2d2d2d] rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                    {brands.map((brand) => {
                        const isSelected = brand.id === value;
                        return (
                            <button
                                key={brand.id}
                                type="button"
                                onClick={() => { onChange(brand.id); setIsOpen(false); }}
                                className={cn(
                                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer",
                                    isSelected ? "bg-blue-500/10 text-blue-400" : "text-[#ededed] hover:bg-white/5"
                                )}
                            >
                                <span className="truncate">{brand.name}</span>
                                <span className="text-xs text-[#888888] shrink-0">{brand.pricePerStick}/stick</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
