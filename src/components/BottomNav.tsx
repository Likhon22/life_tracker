"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Target, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
            <div className="bg-[#191919]/80 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center justify-around p-2 shadow-2xl shadow-black/50">
                <BottomNavItem
                    icon={<LayoutDashboard className="w-5 h-5" />}
                    label="Home"
                    href="/"
                    active={pathname === "/"}
                />
                <BottomNavItem
                    icon={<CheckSquare className="w-5 h-5" />}
                    label="Habits"
                    href="/"
                    active={pathname === "/"}
                />
                <BottomNavItem
                    icon={<Target className="w-5 h-5" />}
                    label="Goals"
                />
                <BottomNavItem
                    icon={<Wallet className="w-5 h-5" />}
                    label="Finance"
                    href="/finance"
                    active={pathname === "/finance"}
                />
            </div>
        </nav>
    );
}

function BottomNavItem({
    icon,
    label,
    active,
    href = "#"
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    href?: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                active
                    ? "text-blue-500 bg-blue-500/10"
                    : "text-[#888888] hover:text-[#ededed] hover:bg-white/5"
            )}
        >
            {icon}
            <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
        </Link>
    );
}
