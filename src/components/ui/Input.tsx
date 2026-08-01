"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, id, ...props }, ref) => {
        const input = (
            <input
                ref={ref}
                id={id}
                className={cn(
                    "w-full bg-white/5 border border-white/5 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-[#444444] [color-scheme:dark]",
                    className
                )}
                {...props}
            />
        );

        if (!label) return input;

        return (
            <div className="flex flex-col gap-2">
                <label htmlFor={id} className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] px-1">
                    {label}
                </label>
                {input}
            </div>
        );
    }
);
Input.displayName = "Input";
