"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

export function HabitProvider({ children }: { children: React.ReactNode }) {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [records, setRecords] = useState<DailyRecord>({});
    const [isLoading, setIsLoading] = useState(true);

    // Initial Data Fetch
    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                const [habitsRes, recordsRes] = await Promise.all([
                    fetch("/api/habits"),
                    fetch("/api/records")
                ]);

                if (habitsRes.ok) {
                    const habitsData = await habitsRes.json();
                    setHabits(habitsData);
                }

                if (recordsRes.ok) {
                    const recordsData = await recordsRes.json();
                    setRecords(recordsData);
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    const toggleHabit = async (date: string, habitId: string) => {
        // Optimistic UI Update
        setRecords((prev) => {
            const dayRecords = prev[date] || [];
            const isCompleted = dayRecords.includes(habitId);

            let newDayRecords;
            if (isCompleted) {
                newDayRecords = dayRecords.filter(id => id !== habitId);
            } else {
                newDayRecords = [...dayRecords, habitId];
            }

            return {
                ...prev,
                [date]: newDayRecords
            };
        });

        // Send to API
        try {
            const res = await fetch("/api/records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date, habitId })
            });

            if (!res.ok) {
                throw new Error("Failed to toggle habit on server");
            }

            // We could optionally sync the exact server state back, but the optimistic update is usually fine
            // and creates a better UX without flickering.
            /*
            const updatedData = await res.json();
            setRecords((prev) => ({
              ...prev,
              [updatedData.date]: updatedData.habitIds
            }));
            */
        } catch (error) {
            console.error("Error toggling habit:", error);
            // Revert optimistic update? For simplicity, we stick with the optimistic one, 
            // but in a production app you'd want to revert or show a toast error.
        }
    };

    const addHabit = async (name: string) => {
        try {
            const res = await fetch("/api/habits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add habit");
            }

            const newHabit = await res.json();
            setHabits([...habits, newHabit]);
            toast.success("Habit added successfully");
        } catch (error: any) {
            console.error("Error adding habit:", error);
            toast.error(error.message);
        }
    };

    const editHabit = async (id: string, name: string) => {
        try {
            // Optimistic update
            setHabits(habits.map(h => h.id === id ? { ...h, name } : h));

            const res = await fetch(`/api/habits/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to edit habit");
            }
            toast.success("Habit updated");
        } catch (error: any) {
            console.error("Error editing habit:", error);
            toast.error(error.message);
            // Revert optimistic update
            const habitsRes = await fetch("/api/habits");
            if (habitsRes.ok) setHabits(await habitsRes.json());
        }
    };

    const removeHabit = async (id: string) => {
        try {
            // Optimistic update
            setHabits(habits.filter(h => h.id !== id));
            // Remove from local records so it doesn't affect calculations immediately
            const newRecords = { ...records };
            Object.keys(newRecords).forEach(date => {
                newRecords[date] = newRecords[date].filter(hId => hId !== id);
            });
            setRecords(newRecords);

            const res = await fetch(`/api/habits/${id}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Failed to delete habit");
            toast.success("Habit deleted");
        } catch (error: any) {
            console.error("Error deleting habit:", error);
            toast.error(error.message);
            // Revert on error
            const habitsRes = await fetch("/api/habits");
            if (habitsRes.ok) setHabits(await habitsRes.json());
        }
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

    const reorderHabits = async (newHabits: Habit[]) => {
        // Optimistic update
        setHabits(newHabits);

        try {
            const response = await fetch("/api/habits/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ habitIds: newHabits.map(h => h.id) }),
            });

            if (!response.ok) throw new Error("Failed to reorder habits");
        } catch (error) {
            console.error("Error reordering habits:", error);
            // Revert optimistic update on error, or refetch habits
            // For simplicity, we'll just log the error and keep the optimistic state for now,
            // but in a production app, you'd want to revert or show an error message.
        }
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
            isLoading
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
