"use client";

import { useMemo, useState } from "react";
import { useHabits } from "@/components/HabitProvider";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from "date-fns";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList
} from "recharts";


export function PerformanceChart() {
    const { getDailyCompletionRate } = useHabits();
    const [activeTab, setActiveTab] = useState<"This Month" | "Past Month">("This Month");

    const chartData = useMemo(() => {
        const today = new Date();
        const targetDate = activeTab === "This Month" ? today : subMonths(today, 1);

        const start = startOfMonth(targetDate);
        const isCurrentMonth = activeTab === "This Month";
        const end = isCurrentMonth ? today : endOfMonth(targetDate);

        const daysInMonth = eachDayOfInterval({ start, end });

        return daysInMonth.map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");

            return {
                date: format(date, "MMM d"),
                rate: getDailyCompletionRate(dateStr),
            };
        });
    }, [activeTab, getDailyCompletionRate]);

    return (
        <div className="flex flex-col h-full mt-4 md:mt-0 max-w-full overflow-hidden">
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("This Month")}
                        className={`text-sm pb-2 border-b-2 transition-colors cursor-pointer ${activeTab === "This Month"
                            ? "border-blue-500 text-white"
                            : "border-transparent text-[#888888] hover:text-white"
                            }`}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => setActiveTab("Past Month")}
                        className={`text-sm pb-2 border-b-2 transition-colors cursor-pointer ${activeTab === "Past Month"
                            ? "border-blue-500 text-white"
                            : "border-transparent text-[#888888] hover:text-white"
                            }`}
                    >
                        Past Month
                    </button>
                </div>

                <div className="flex items-center gap-4 text-[#888888]">
                    <button className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#ededed] px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer">
                        Export Report
                    </button>
                </div>
            </div>

            {/* Recharts Area */}
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            // Only show a few ticks to match the image where it shows start, middle, end
                            tickFormatter={(value, index) => {
                                if (index === 0 || index === Math.floor(chartData.length / 2) || index === chartData.length - 1) {
                                    return value;
                                }
                                return "";
                            }}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#191919', borderColor: '#2d2d2d', color: '#ededed', borderRadius: '8px' }}
                            itemStyle={{ color: '#3b82f6' }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`${value}%`, 'Completion Rate']}
                            labelStyle={{ color: '#888888', marginBottom: '4px' }}
                        />
                        <Line
                            type="linear"
                            dataKey="rate"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 4, fill: "#191919", stroke: "#3b82f6", strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: "#3b82f6", stroke: "#111111", strokeWidth: 2 }}
                            connectNulls={false}
                        >
                            <LabelList
                                dataKey="rate"
                                position="top"
                                offset={10}
                                fill="#888888"
                                fontSize={10}
                                formatter={(value: any) => value !== null && value !== undefined ? `${value}%` : ""}
                            />
                        </Line>
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center mt-4">
                <div className="flex items-center gap-2 text-xs text-[#888888]">
                    <div className="w-2 h-0.5 bg-blue-500"></div>
                    <span>Date</span>
                </div>
            </div>
        </div>
    );
}
