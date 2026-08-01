"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isTomorrow, parseISO, addDays, subDays } from "date-fns";
import { CheckCircle2, Circle, Plus, Trash2, Target, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { IconButton } from "@/components/ui/IconButton";

interface Goal {
    id: string;
    text: string;
    completed: boolean;
    date: string;
}

interface DailyGoalsProps {
    selectedDate?: string; // YYYY-MM-DD
}

async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request to ${url} failed`);
    return res.json();
}

export function DailyGoals({ selectedDate }: DailyGoalsProps) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const [activeDate, setActiveDate] = useState(selectedDate || todayStr);
    const [newGoal, setNewGoal] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const queryClient = useQueryClient();

    // Generate last 7 days + Tomorrow for navigation
    const dateStrip = [
        ...Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i)),
        addDays(new Date(), 1)
    ];

    const goalsQuery = useQuery({
        queryKey: ["goals", activeDate],
        queryFn: () => fetchJSON<Goal[]>(`/api/goals?date=${activeDate}&localToday=${todayStr}`),
    });
    const goals = goalsQuery.data ?? [];

    const addGoalMutation = useMutation({
        mutationFn: async (text: string) => {
            const res = await fetch("/api/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, date: activeDate }),
            });
            if (!res.ok) throw new Error("Failed to add goal");
            return res.json() as Promise<Goal>;
        },
        onSuccess: (goal) => {
            queryClient.setQueryData<Goal[]>(["goals", activeDate], (prev = []) => [...prev, goal]);
            toast.success("Goal added");
        },
        onError: () => toast.error("Failed to add goal"),
    });

    const handleAddGoal = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newGoal.trim()) return;
        await addGoalMutation.mutateAsync(newGoal.trim()).catch(() => {});
        setNewGoal("");
        setIsAdding(false);
    };

    const toggleGoalMutation = useMutation({
        mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
            const res = await fetch(`/api/goals/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed }),
            });
            if (!res.ok) throw new Error("Failed to update goal");
        },
        onMutate: async ({ id, completed }) => {
            await queryClient.cancelQueries({ queryKey: ["goals", activeDate] });
            const previous = queryClient.getQueryData<Goal[]>(["goals", activeDate]);
            queryClient.setQueryData<Goal[]>(["goals", activeDate], (prev = []) =>
                prev.map((g) => (g.id === id ? { ...g, completed } : g))
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(["goals", activeDate], context.previous);
            toast.error("Failed to update goal");
        },
    });

    const toggleGoal = (id: string, completed: boolean) => {
        toggleGoalMutation.mutate({ id, completed: !completed });
    };

    const deleteGoalMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete goal");
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["goals", activeDate] });
            const previous = queryClient.getQueryData<Goal[]>(["goals", activeDate]);
            queryClient.setQueryData<Goal[]>(["goals", activeDate], (prev = []) => prev.filter((g) => g.id !== id));
            return { previous };
        },
        onSuccess: () => toast.success("Goal removed"),
        onError: (_err, _id, context) => {
            if (context?.previous) queryClient.setQueryData(["goals", activeDate], context.previous);
            toast.error("Failed to delete goal");
        },
    });

    const deleteGoal = (id: string) => {
        deleteGoalMutation.mutate(id);
    };

    const completedCount = goals.filter((g) => g.completed).length;
    const totalCount = goals.length;
    const progressRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const displayDate = () => {
        if (isToday(parseISO(activeDate))) return "Today's Mission";
        if (isTomorrow(parseISO(activeDate))) return "Tomorrow's Plan";
        return format(parseISO(activeDate), "EEEE, do MMM");
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Mission Statistics Card */}
            <div className="bg-[#191919] border border-[#2d2d2d] rounded-3xl p-6 shadow-xl flex items-center justify-between overflow-hidden relative group">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative w-20 h-20 shrink-0">
                        {/* Circular Progress SVG */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="transparent"
                                className="text-white/5"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 36}
                                strokeDashoffset={2 * Math.PI * 36 * (1 - progressRate / 100)}
                                strokeLinecap="round"
                                className="text-blue-500 transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-black text-white leading-none">{Math.round(progressRate)}%</span>
                            <span className="text-[8px] font-bold text-[#555555] uppercase tracking-tighter mt-1">Done</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-white tracking-tight leading-none">{displayDate()}</h2>
                        <p className="text-xs text-[#888888] font-medium">
                            {completedCount} of {totalCount} goals completed
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 relative z-10">
                    <div className="px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Active Status</span>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-600/20"
                    >
                        <Plus className={cn("w-3 h-3 transition-transform", isAdding && "rotate-45")} />
                        <span>Add Goal</span>
                    </button>
                </div>

                {/* Background Decoration */}
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target className="w-32 h-32" />
                </div>
            </div>

            {/* Date Navigation Bar */}
            <div className="flex items-center gap-2 bg-[#111111] p-1.5 rounded-2xl border border-white/5">
                {dateStrip.map((date) => {
                    const dStr = format(date, "yyyy-MM-dd");
                    const isActive = activeDate === dStr;
                    const isT = isToday(date);
                    const isTom = isTomorrow(date);

                    return (
                        <button
                            key={dStr}
                            onClick={() => setActiveDate(dStr)}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all cursor-pointer relative overflow-hidden",
                                isActive
                                    ? "bg-[#1d1d1d] text-white shadow-lg border border-white/5"
                                    : "text-[#555555] hover:text-[#888888] hover:bg-white/[0.02]"
                            )}
                        >
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] mb-1">
                                {format(date, "EEE")}
                            </span>
                            <span className={cn(
                                "text-sm font-bold",
                                isT && !isActive && "text-blue-500/60"
                            )}>
                                {format(date, "d")}
                            </span>
                            {isT && (
                                <div className={cn(
                                    "absolute bottom-1 w-1 h-1 rounded-full",
                                    isActive ? "bg-blue-500" : "bg-blue-500/40"
                                )} />
                            )}
                            {isTom && (
                                <div className="absolute top-1 right-1 opacity-40" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Daily Mission List */}
            <div className="bg-[#191919] border border-[#2d2d2d] rounded-3xl p-6 shadow-xl min-h-[400px] flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                    <History className="w-4 h-4 text-[#444444]" />
                    <h3 className="text-[10px] font-bold text-[#555555] uppercase tracking-widest">Mission Log</h3>
                </div>

                {isAdding && (
                    <form onSubmit={handleAddGoal} className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative group">
                            <input
                                autoFocus
                                type="text"
                                placeholder="State your objective..."
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                className="w-full bg-[#111111] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium pr-14 shadow-inner"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-2.5 bottom-2.5 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 cursor-pointer border border-white/5"
                            >
                                Set
                            </button>
                        </div>
                    </form>
                )}

                <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                    {goalsQuery.isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-full mb-4" />
                                <div className="h-2 w-32 bg-white/10 rounded-full" />
                            </div>
                        </div>
                    ) : goals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                            <Target className="w-12 h-12 text-[#222222] mb-4" />
                            <p className="text-sm font-medium text-[#444444] text-center max-w-[200px]">
                                No objectives recorded for this mission date.
                            </p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="mt-6 text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer group"
                            >
                                <span className="group-hover:translate-x-1 transition-transform">Initialize Goal</span> <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {goals.map((goal) => (
                                <div
                                    key={goal.id}
                                    className={cn(
                                        "group flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/[0.04]",
                                        goal.completed && "opacity-40 bg-transparent grayscale-[0.8]"
                                    )}
                                >
                                    <button
                                        onClick={() => toggleGoal(goal.id, goal.completed)}
                                        className="shrink-0 transition-transform active:scale-90 cursor-pointer"
                                    >
                                        {goal.completed ? (
                                            <CheckCircle2 className="w-6 h-6 text-blue-500" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-[#333333] group-hover:text-[#555555]" />
                                        )}
                                    </button>
                                    <span className={cn(
                                        "flex-1 text-sm font-semibold text-[#ededed] transition-all",
                                        goal.completed && "line-through text-[#666666]"
                                    )}>
                                        {goal.text}
                                    </span>
                                    <IconButton
                                        tone="danger"
                                        onClick={() => deleteGoal(goal.id)}
                                        className="opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </IconButton>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
