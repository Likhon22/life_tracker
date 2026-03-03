"use client";

import { useHabits } from "@/components/HabitProvider";


export function AnalyticsSidebar() {
    const { habits, getHabitCompletionRate } = useHabits();
    const currentMonthDate = new Date(); // Or let user pass it

    return (
        <div className="flex flex-col h-full bg-[#191919] text-[#ededed]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[#2d2d2d] sticky top-0 bg-[#191919] z-10 w-full">
                <div className="flex items-center gap-2">
                    <div className="text-xl">🎯</div>
                    <span className="font-semibold text-sm">Analytics</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {habits.map((habit) => {
                    const rate = getHabitCompletionRate(habit.id, currentMonthDate);
                    return (
                        <div key={habit.id} className="flex flex-col hover:bg-[#2d2d2d]/50 p-1.5 -mx-1.5 rounded-md transition-colors">
                            <span className="text-xs font-semibold mb-1 text-[#aaaaaa]">{habit.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-[#ededed] text-sm tabular-nums min-w-[3rem]">{rate.toFixed(2)}%</span>
                                <CircularProgress value={rate} />
                            </div>
                        </div>
                    );
                })}
            </div>

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
