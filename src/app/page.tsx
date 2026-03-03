"use client";

import { useSession } from "next-auth/react";
import {
    LayoutDashboard,
    CheckSquare,
    Target,
    Wallet,
    ChevronRight,
    TrendingUp
} from "lucide-react";
import { ModulePage } from "@/components/ModulePage";

export default function Dashboard() {
    const { data: session } = useSession();

    return (
        <ModulePage
            title="Command Center"
            subtitle={`Welcome back, ${session?.user?.name?.split(' ')[0] || 'Officer'}. Here is your mission status for today.`}
            icon={LayoutDashboard}
            authDescription="Your central command for habits, goals, and finances. Sign in to start your journey."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Habit Tracker Preview */}
                <DashboardCard
                    title="Habit Tracker"
                    icon={<CheckSquare className="w-5 h-5 text-blue-500" />}
                    href="/habits"
                    subtitle="Maintain your consistency"
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#888888] font-medium uppercase tracking-widest">Daily Progress</span>
                            <span className="text-xs font-bold text-white">View Details</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-2/3 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        </div>
                        <p className="text-xs text-[#555555]">Click to log your habits for today.</p>
                    </div>
                </DashboardCard>

                {/* Daily Goals Preview */}
                <DashboardCard
                    title="Daily Goals"
                    icon={<Target className="w-5 h-5 text-purple-500" />}
                    href="/goals"
                    subtitle="Execute today's mission"
                >
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-[#ededed]">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span className="truncate">Plan your specific targets...</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#ededed]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2d2d2d]" />
                            <span className="truncate opacity-40">Ready for your next goal?</span>
                        </div>
                    </div>
                </DashboardCard>

                {/* Finance Preview */}
                <DashboardCard
                    title="Finance Center"
                    icon={<Wallet className="w-5 h-5 text-emerald-500" />}
                    href="/finance"
                    subtitle="Optimize your spending"
                >
                    <div className="flex flex-col gap-2">
                        <span className="text-xs text-[#888888] font-medium uppercase tracking-widest">Budget Status</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-white tracking-tighter">Healthy</span>
                            <TrendingUp className="w-5 h-5 text-emerald-500 mb-1" />
                        </div>
                        <p className="text-xs text-[#555555]">Review expenditures and manage fixed costs.</p>
                    </div>
                </DashboardCard>
            </div>
        </ModulePage>
    );
}

function DashboardCard({
    title,
    subtitle,
    icon,
    href,
    children
}: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    href: string;
    children: React.ReactNode
}) {
    return (
        <a
            href={href}
            className="group block bg-[#191919] border border-[#2d2d2d] rounded-3xl p-6 transition-all hover:bg-[#1c1c1c] hover:border-white/10 hover:shadow-2xl hover:shadow-black/50 overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                {icon}
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors">
                    {icon}
                </div>
                <div>
                    <h2 className="font-bold text-lg text-white tracking-tight">{title}</h2>
                    <p className="text-[10px] font-bold text-[#555555] uppercase tracking-widest leading-none mt-1">{subtitle}</p>
                </div>
            </div>

            <div className="mb-6 min-h-[60px]">
                {children}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#888888] group-hover:text-white transition-colors">
                <span>Access Module</span>
                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
        </a>
    );
}
