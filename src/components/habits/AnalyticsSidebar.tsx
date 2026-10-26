"use client";

import { useState } from "react";
import { useHabits } from "./HabitProvider";
import { subMonths } from "date-fns";
import * as Icons from "lucide-react";
import { Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HabitCategoryManager } from "./HabitCategoryManager";

export function AnalyticsSidebar() {
    const { habits, categories, getHabitCompletionRate, getCategoryCompletionRate } = useHabits();
    const [isManageOpen, setIsManageOpen] = useState(false);

    const currentMonthDate = new Date();
    const previousMonthDate = subMonths(currentMonthDate, 1);

    const habitsByCategory = categories
        .map((category) => ({
            category,
            habits: habits.filter((h) => h.categoryId === category.id),
        }))
        .filter((group) => group.habits.length > 0);

    return (
        <div className="flex flex-col h-full bg-[#191919] text-[#ededed]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[#2d2d2d] sticky top-0 bg-[#191919] z-10 w-full">
                <div className="flex items-center gap-2">
                    <div className="text-xl">🎯</div>
                    <span className="font-semibold text-sm">Analytics</span>
                </div>
                <button
                    onClick={() => setIsManageOpen(true)}
                    className="p-1.5 text-[#888888] hover:text-white rounded-md hover:bg-[#2d2d2d] transition-colors cursor-pointer"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {habitsByCategory.map(({ category, habits: categoryHabits }) => {
                    const rate = getCategoryCompletionRate(category.id, currentMonthDate);
                    const prevRate = getCategoryCompletionRate(category.id, previousMonthDate);
                    const delta = rate - prevRate;
                    const IconComponent = (Icons as any)[category.icon] || Icons.HelpCircle;

                    return (
                        <div key={category.id} className="flex flex-col gap-2">
                            {/* Category header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <IconComponent className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#aaaaaa]">
                                        {category.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {delta !== 0 && (
                                        <span className={cn(
                                            "text-[10px] font-bold tabular-nums",
                                            delta > 0 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}%
                                        </span>
                                    )}
                                    <span className="text-sm font-bold text-white tabular-nums">{rate}%</span>
                                </div>
                            </div>

                            {/* Per-habit rows (unchanged) */}
                            <div className="flex flex-col gap-0.5">
                                {categoryHabits.map((habit) => {
                                    const habitRate = getHabitCompletionRate(habit.id, currentMonthDate);
                                    return (
                                        <div key={habit.id} className="flex flex-col hover:bg-[#2d2d2d]/50 p-1.5 -mx-1.5 rounded-md transition-colors">
                                            <span className="text-xs font-semibold mb-1 text-[#aaaaaa]">{habit.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[#ededed] text-sm tabular-nums min-w-[3rem]">{habitRate.toFixed(2)}%</span>
                                                <CircularProgress value={habitRate} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Manage Categories Modal */}
            {isManageOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm" onClick={() => setIsManageOpen(false)} />
                    <div className="bg-[#191919] border border-[#2d2d2d] rounded-[32px] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <button
                            onClick={() => setIsManageOpen(false)}
                            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-[#888888] hover:text-white transition-all z-10 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex-1 overflow-y-auto no-scrollbar pt-16 px-8 pb-8">
                            <HabitCategoryManager />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CircularProgress({ value }: { value: number }) {
    const radius = 6;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    // Decide color based on percentage
    let color = "text-green-500";
    if (value < 40) color = "text-red-500";
    else if (value < 70) color = "text-yellow-500";
    else if (value >= 100) color = "text-blue-500";

    return (
        <div className="relative w-4 h-4 text-xs font-medium">
            <svg className="w-4 h-4 transform -rotate-90">
                <circle
                    className="text-[#333333]"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="8"
                    cy="8"
                />
                <circle
                    className={`${color} transition-all duration-1000 ease-out`}
                    strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="8"
                    cy="8"
                />
            </svg>
        </div>
    );
}
