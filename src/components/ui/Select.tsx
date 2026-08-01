"use client";

import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, id, children, ...props }, ref) => {
        const select = (
            <select
                ref={ref}
                id={id}
                className={cn(
                    "w-full bg-[#111111] border border-white/10 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white outline-none transition-all [color-scheme:dark]",
                    className
                )}
                {...props}
            >
                {children}
            </select>
        );

        if (!label) return select;

        return (
            <div className="flex flex-col gap-2">
                <label htmlFor={id} className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] px-1">
                    {label}
                </label>
                {select}
            </div>
        );
    }
);
Select.displayName = "Select";
