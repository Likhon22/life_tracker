"use client";

import { useFinance } from "@/components/FinanceProvider";
import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#f97316"];

export function FinanceCharts() {
    const { expenses, selectedMonth, categories } = useFinance();

    // Daily Bar Chart Data
    const barData = useMemo(() => {
        const [year, month] = selectedMonth.split("-").map(Number);
        const start = startOfMonth(new Date(year, month - 1));
        const end = endOfMonth(start);
        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayExpenses = expenses.filter(e => e.date === dayStr);
            const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            return {
                name: format(day, "d"),
                amount: total
            };
        });
    }, [expenses, selectedMonth]);

    // Category Pie Chart Data
    const pieData = useMemo(() => {
        const data: Record<string, { name: string; value: number }> = {};

        expenses.forEach(e => {
            const catId = typeof e.categoryId === 'string' ? e.categoryId : e.categoryId.id;
            const cat = categories.find(c => c.id === catId);
            const name = cat ? cat.name : "Other";

            if (!data[name]) {
                data[name] = { name, value: 0 };
            }
            data[name].value += e.amount;
        });

        return Object.values(data).sort((a, b) => b.value - a.value);
    }, [expenses, categories]);

    return (
        <div className="space-y-6">
            {/* Daily Spending Bar Chart */}
            <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className="font-bold text-lg text-white tracking-tight">Daily Spending</h2>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#555555"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval={2}
                            />
                            <YAxis
                                stroke="#555555"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${v}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111111', borderColor: '#2d2d2d', color: '#ededed', borderRadius: '12px', fontSize: '12px' }}
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                formatter={(v: any) => [`${v.toLocaleString()}`, "Spent"]}
                            />
                            <Bar
                                dataKey="amount"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                barSize={12}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Pie Chart */}
            <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-green-500/10 rounded-xl">
                        <PieChartIcon className="w-5 h-5 text-green-500" />
                    </div>
                    <h2 className="font-bold text-lg text-white tracking-tight">Spending by Category</h2>
                </div>
                <div className="h-[350px] w-full">
                    {pieData.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#444444]">
                            <PieChartIcon className="w-10 h-10 mb-2 opacity-20" />
                            <span className="text-sm font-medium">No expense data to analyze</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.1)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111111', borderColor: '#2d2d2d', color: '#ededed', borderRadius: '12px', fontSize: '12px' }}
                                    formatter={(v: any) => `${v.toLocaleString()}`}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
