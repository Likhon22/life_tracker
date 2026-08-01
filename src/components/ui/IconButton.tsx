"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type IconButtonTone = "default" | "danger" | "primary" | "success";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    tone?: IconButtonTone;
}

const toneClasses: Record<IconButtonTone, string> = {
    default: "text-[#888888] hover:text-white hover:bg-white/5",
    danger: "text-[#888888] hover:text-red-500 hover:bg-red-500/5",
    primary: "text-[#888888] hover:text-blue-500 hover:bg-blue-500/5",
    success: "text-[#888888] hover:text-green-500 hover:bg-green-500/5",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className, tone = "default", ...props }, ref) => (
        <button
            ref={ref}
            className={cn(
                "p-2 rounded-lg transition-all cursor-pointer",
                toneClasses[tone],
                className
            )}
            {...props}
        />
    )
);
IconButton.displayName = "IconButton";
