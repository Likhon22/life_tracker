"use client";

import Link from "next/link";
import {
    Settings,
    LayoutDashboard,
    CheckSquare,
    Wallet,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useSession, signIn, signOut } from "next-auth/react";

export function Sidebar() {
    const { data: session } = useSession();

    return (
        <aside className="w-64 h-screen bg-[#191919] border-r border-[#2d2d2d] flex flex-col text-[#ededed] text-sm overflow-y-auto hidden md:flex shrink-0">
            {/* App Branding */}
            <div className="px-5 py-6 flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden drop-shadow-lg bg-[#222222]">
                    <img
                        src="/logo/logo_with_bg-removebg-preview.png"
                        alt="LifeTracker Logo"
                        className="w-full h-full object-contain p-1"
                    />
                </div>
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-[#888888] bg-clip-text text-transparent">LifeTracker</span>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-3">
                <div className="space-y-1">
                    <NavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                    <NavItem icon={<CheckSquare className="w-4 h-4" />} label="Habit Tracker" active />
                    <NavItem icon={<Target className="w-4 h-4" />} label="Daily Goals" />
                    <NavItem icon={<Wallet className="w-4 h-4" />} label="Finance Management" />
                </div>

                <div className="mt-8">
                    <div className="px-3 text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">
                        System
                    </div>
                    <div className="space-y-1">
                        <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" />
                    </div>
                </div>
            </div>

            {/* User Profile / Login */}
            <div className="p-4 border-t border-[#2d2d2d] flex justify-between items-center px-4">
                {session ? (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {session.user?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                                <div className="w-8 h-8 bg-[#2d2d2d] rounded-full flex items-center justify-center">
                                    {session.user?.name?.[0] || "U"}
                                </div>
                            )}
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium pt-1 truncate max-w-[120px]">{session.user?.name}</span>
                                <span className="text-xs text-[#888888] pb-1 truncate max-w-[120px]">{session.user?.email}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="text-xs text-[#888888] hover:text-white transition-colors p-1 cursor-pointer"
                        >
                            Log out
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => signIn("google")}
                        className="w-full flex justify-center items-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                    >
                        Sign In with Google
                    </button>
                )}
            </div>
        </aside>
    );
}

function NavItem({
    icon,
    label,
    active,
    indent
}: {
    icon: React.ReactNode,
    label: string,
    active?: boolean,
    indent?: boolean
}) {
    return (
        <Link
            href="#"
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2d2d2d] transition-colors group text-gray-300 hover:text-white",
                active && "bg-blue-600/10 text-blue-500 hover:text-blue-400 font-medium",
                indent && "pl-8"
            )}
        >
            <span className={cn("text-[#888888] group-hover:text-gray-300", active && "text-blue-500 group-hover:text-blue-400")}>
                {icon}
            </span>
            <span className="truncate">{label}</span>
        </Link>
    );
}
