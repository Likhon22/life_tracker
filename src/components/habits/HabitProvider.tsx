"use client";

import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { toast } from "react-hot-toast";

export type Habit = {
    id: string;
    name: string;
};

export type DailyRecord = {
    [date: string]: string[]; // date string (YYYY-MM-DD) -> array of completed habit ids
};

type HabitContextType = {
    habits: Habit[];
    records: DailyRecord;
    toggleHabit: (date: string, habitId: string) => void;
    getHabitCompletionRate: (habitId: string, monthDate: Date) => number;
    getDailyCompletionRate: (date: string) => number;
    addHabit: (name: string) => Promise<void>;
    editHabit: (id: string, name: string) => Promise<void>;
    removeHabit: (id: string) => Promise<void>;
    reorderHabits: (newHabits: Habit[]) => Promise<void>;
    isLoading: boolean;
};

const HabitContext = createContext<HabitContextType | undefined>(undefined);

async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request to ${url} failed`);
    return res.json();
}

export function HabitProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();

    const habitsQuery = useQuery({
        queryKey: ["habits"],
        queryFn: () => fetchJSON<Habit[]>("/api/habits"),
    });

    const recordsQuery = useQuery({
        queryKey: ["records"],
        queryFn: () => fetchJSON<DailyRecord>("/api/records"),
    });

    const habits = habitsQuery.data ?? [];
    const records = recordsQuery.data ?? {};

    // Toggle completion for a habit on a given date, with optimistic cache update
    const toggleHabitMutation = useMutation({
        mutationFn: async ({ date, habitId }: { date: string; habitId: string }) => {
            const res = await fetch("/api/records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date, habitId }),
            });
            if (!res.ok) throw new Error("Failed to toggle habit on server");
        },
        onMutate: async ({ date, habitId }) => {
            await queryClient.cancelQueries({ queryKey: ["records"] });
            const previous = queryClient.getQueryData<DailyRecord>(["records"]);

            queryClient.setQueryData<DailyRecord>(["records"], (prev = {}) => {
                const dayRecords = prev[date] || [];
                const isCompleted = dayRecords.includes(habitId);
                const newDayRecords = isCompleted
                    ? dayRecords.filter((id) => id !== habitId)
                    : [...dayRecords, habitId];
                return { ...prev, [date]: newDayRecords };
            });

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(["records"], context.previous);
        },
    });

    const toggleHabit = (date: string, habitId: string) => {
        toggleHabitMutation.mutate({ date, habitId });
    };

    const addHabitMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await fetch("/api/habits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add habit");
            }
            return res.json() as Promise<Habit>;
        },
        onSuccess: (newHabit) => {
            queryClient.setQueryData<Habit[]>(["habits"], (prev = []) => [...prev, newHabit]);
            toast.success("Habit added successfully");
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const addHabit = async (name: string) => {
        await addHabitMutation.mutateAsync(name).catch(() => {});
    };

    const editHabitMutation = useMutation({
        mutationFn: async ({ id, name }: { id: string; name: string }) => {
            const res = await fetch(`/api/habits/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to edit habit");
            }
        },
        onMutate: async ({ id, name }) => {
            await queryClient.cancelQueries({ queryKey: ["habits"] });
            const previous = queryClient.getQueryData<Habit[]>(["habits"]);
            queryClient.setQueryData<Habit[]>(["habits"], (prev = []) =>
                prev.map((h) => (h.id === id ? { ...h, name } : h))
            );
            return { previous };
        },
        onSuccess: () => toast.success("Habit updated"),
        onError: (error: Error, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(["habits"], context.previous);
            toast.error(error.message);
        },
    });

    const editHabit = async (id: string, name: string) => {
        await editHabitMutation.mutateAsync({ id, name }).catch(() => {});
    };

    const removeHabitMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete habit");
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["habits"] });
            await queryClient.cancelQueries({ queryKey: ["records"] });
            const previousHabits = queryClient.getQueryData<Habit[]>(["habits"]);
            const previousRecords = queryClient.getQueryData<DailyRecord>(["records"]);

            queryClient.setQueryData<Habit[]>(["habits"], (prev = []) => prev.filter((h) => h.id !== id));
            queryClient.setQueryData<DailyRecord>(["records"], (prev = {}) => {
                const next: DailyRecord = {};
                for (const date of Object.keys(prev)) {
                    next[date] = prev[date].filter((hId) => hId !== id);
                }
                return next;
            });

            return { previousHabits, previousRecords };
        },
        onSuccess: () => toast.success("Habit deleted"),
        onError: (error: Error, _id, context) => {
            if (context?.previousHabits) queryClient.setQueryData(["habits"], context.previousHabits);
            if (context?.previousRecords) queryClient.setQueryData(["records"], context.previousRecords);
            toast.error(error.message);
        },
    });

    const removeHabit = async (id: string) => {
        await removeHabitMutation.mutateAsync(id).catch(() => {});
    };

    const reorderHabitsMutation = useMutation({
        mutationFn: async (newHabits: Habit[]) => {
            const res = await fetch("/api/habits/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ habitIds: newHabits.map((h) => h.id) }),
            });
            if (!res.ok) throw new Error("Failed to reorder habits");
        },
        onMutate: async (newHabits) => {
            await queryClient.cancelQueries({ queryKey: ["habits"] });
            const previous = queryClient.getQueryData<Habit[]>(["habits"]);
            queryClient.setQueryData<Habit[]>(["habits"], newHabits);
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(["habits"], context.previous);
        },
    });

    const reorderHabits = async (newHabits: Habit[]) => {
        await reorderHabitsMutation.mutateAsync(newHabits).catch(() => {});
    };

    const getHabitCompletionRate = (habitId: string, monthDate: Date) => {
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        const daysInMonth = eachDayOfInterval({ start, end });

        // Determine how many days have passed in the current month to calculate a realistic rate
        const today = new Date();
        const isCurrentMonth = today.getMonth() === monthDate.getMonth() && today.getFullYear() === monthDate.getFullYear();
        const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth.length;

        if (daysElapsed === 0) return 0;

        let completedDays = 0;
        for (let i = 0; i < daysElapsed; i++) {
            const dateStr = format(daysInMonth[i], "yyyy-MM-dd");
            if (records[dateStr]?.includes(habitId)) {
                completedDays++;
            }
        }

        return Math.round((completedDays / daysElapsed) * 100);
    };

    const getDailyCompletionRate = (date: string) => {
        if (habits.length === 0) return 0;
        const completed = records[date]?.length || 0;
        return Math.round((completed / habits.length) * 100);
    };

    return (
        <HabitContext.Provider value={{
            habits,
            records,
            toggleHabit,
            getHabitCompletionRate,
            getDailyCompletionRate,
            addHabit,
            editHabit,
            removeHabit,
            reorderHabits,
            isLoading: habitsQuery.isLoading || recordsQuery.isLoading
        }}>
            {children}
        </HabitContext.Provider>
    );
}

export function useHabits() {
    const context = useContext(HabitContext);
    if (context === undefined) {
        throw new Error("useHabits must be used within a HabitProvider");
    }
    return context;
}
