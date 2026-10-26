"use client";

import { useCigarettes } from "./CigaretteProvider";
import { format, parseISO } from "date-fns";
import { Cigarette, Users, Wallet, TrendingDown } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export function CigaretteStats() {
    const { todaySelfCount, todayFriendCount, todayCost, monthSelfCount, monthFriendCount, monthCost, byBrand, byDate } = useCigarettes();

    const chartData = byDate.map((d) => ({
        date: format(parseISO(d.date), "MMM d"),
        sticks: d.sticks,
    }));

    const maxBrandSticks = byBrand[0]?.sticks ?? 0;

    return (
        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 rounded-xl">
                    <Cigarette className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="font-bold text-lg text-white tracking-tight">Cigarette Stats</h2>
            </div>

            {/* Today */}
            <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5 bg-white/[0.03] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[#AAAAAA]">
                        <Cigarette className="w-3 h-3 shrink-0" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] truncate">Today (self)</span>
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight">{todaySelfCount}</div>
                </div>
                <div className="flex flex-col gap-1.5 bg-white/[0.03] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[#AAAAAA]">
                        <Users className="w-3 h-3 shrink-0" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] truncate">Today (friend)</span>
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight">{todayFriendCount}</div>
                </div>
                <div className="flex flex-col gap-1.5 bg-white/[0.03] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[#AAAAAA]">
                        <Wallet className="w-3 h-3 shrink-0" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] truncate">Today Cost</span>
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight">{todayCost.toLocaleString()}</div>
                </div>
            </div>

            {/* This month */}
            <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em]">This Month (self)</span>
                    <div className="text-2xl font-bold text-white tracking-tight">{monthSelfCount} sticks</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em]">Given to friends</span>
                    <div className="text-sm font-bold text-orange-400">{monthFriendCount} sticks</div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-500/80 bg-red-500/5 px-3 py-2 rounded-xl -mt-2">
                <TrendingDown className="w-3.5 h-3.5" />
                Total spent this month: {monthCost.toLocaleString()} (flows into Finance &rsaquo; Cigarettes automatically)
            </div>

            {/* By brand */}
            {byBrand.length > 0 && (
                <div className="space-y-3 border-t border-white/5 pt-6">
                    <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em]">By Brand</span>
                    {byBrand.map(({ brand, sticks, cost }) => (
                        <div key={brand.id} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#ededed]">{brand.name}</span>
                                <span className="text-[#888888] tabular-nums">{sticks} sticks &middot; {cost.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#2d2d2d] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 transition-all duration-500"
                                    style={{ width: `${maxBrandSticks > 0 ? (sticks / maxBrandSticks) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Daily trend */}
            {chartData.length > 0 && (
                <div className="border-t border-white/5 pt-6">
                    <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em] mb-4 block">Sticks Per Day (self)</span>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#191919', borderColor: '#2d2d2d', color: '#ededed', borderRadius: '8px' }}
                                    labelStyle={{ color: '#888888', marginBottom: '4px' }}
                                />
                                <Bar dataKey="sticks" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
