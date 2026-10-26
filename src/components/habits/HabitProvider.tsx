"use client";

import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { toast } from "react-hot-toast";

export type Habit = {
    id: string;
    name: string;
    categoryId: string;
};

export type HabitCategory = {
    id: string;
    name: string;
    icon: string;
};

export type DailyRecord = {
    [date: string]: string[]; // date string (YYYY-MM-DD) -> array of completed habit ids
};

type HabitContextType = {
    habits: Habit[];
    records: DailyRecord;
    categories: HabitCategory[];
    toggleHabit: (date: string, habitId: string) => void;
    getHabitCompletionRate: (habitId: string, monthDate: Date) => number;
    getCategoryCompletionRate: (categoryId: string, monthDate: Date) => number;
    getDailyCompletionRate: (date: string) => number;
    addHabit: (name: string, categoryId: string) => Promise<void>;
    editHabit: (id: string, name: string, categoryId: string) => Promise<void>;
    removeHabit: (id: string) => Promise<void>;
    reorderHabits: (newHabits: Habit[]) => Promise<void>;
    addCategory: (name: string, icon: string) => Promise<void>;
    updateCategory: (id: string, name: string, icon: string) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
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

    const categoriesQuery = useQuery({
        queryKey: ["habitCategories"],
        queryFn: () => fetchJSON<HabitCategory[]>("/api/habits/categories"),
    });

    const habits = habitsQuery.data ?? [];
    const records = recordsQuery.data ?? {};
    const categories = categoriesQuery.data ?? [];

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
        mutationFn: async ({ name, categoryId }: { name: string; categoryId: string }) => {
            const res = await fetch("/api/habits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, categoryId }),
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

    const addHabit = async (name: string, categoryId: string) => {
        await addHabitMutation.mutateAsync({ name, categoryId }).catch(() => {});
    };

    const editHabitMutation = useMutation({
        mutationFn: async ({ id, name, categoryId }: { id: string; name: string; categoryId: string }) => {
            const res = await fetch(`/api/habits/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, categoryId }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to edit habit");
            }
        },
        onMutate: async ({ id, name, categoryId }) => {
            await queryClient.cancelQueries({ queryKey: ["habits"] });
            const previous = queryClient.getQueryData<Habit[]>(["habits"]);
            queryClient.setQueryData<Habit[]>(["habits"], (prev = []) =>
                prev.map((h) => (h.id === id ? { ...h, name, categoryId } : h))
            );
            return { previous };
        },
        onSuccess: () => toast.success("Habit updated"),
        onError: (error: Error, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(["habits"], context.previous);
            toast.error(error.message);
        },
    });

    const editHabit = async (id: string, name: string, categoryId: string) => {
        await editHabitMutation.mutateAsync({ id, name, categoryId }).catch(() => {});
    };

    const addCategoryMutation = useMutation({
        mutationFn: async ({ name, icon }: { name: string; icon: string }) => {
            const res = await fetch("/api/habits/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, icon }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add category");
            }
            return res.json() as Promise<HabitCategory>;
        },
        onSuccess: (newCat) => {
            queryClient.setQueryData<HabitCategory[]>(["habitCategories"], (prev = []) => [...prev, newCat]);
            toast.success("Category added");
        },
        onError: (error: Error) => toast.error(error.message),
    });
    const addCategory = async (name: string, icon: string) => {
        await addCategoryMutation.mutateAsync({ name, icon }).catch(() => {});
    };

    const updateCategoryMutation = useMutation({
        mutationFn: async ({ id, name, icon }: { id: string; name: string; icon: string }) => {
            const res = await fetch(`/api/habits/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, icon }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update category");
            }
            return res.json() as Promise<HabitCategory>;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<HabitCategory[]>(["habitCategories"], (prev = []) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
            );
            toast.success("Category updated");
        },
        onError: (error: Error) => toast.error(error.message),
    });
    const updateCategory = async (id: string, name: string, icon: string) => {
        await updateCategoryMutation.mutateAsync({ id, name, icon }).catch(() => {});
    };

    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/habits/categories/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete category");
            }
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<HabitCategory[]>(["habitCategories"], (prev = []) =>
                prev.filter((c) => c.id !== id)
            );
            toast.success("Category deleted");
        },
        onError: (error: Error) => toast.error(error.message),
    });
    const deleteCategory = async (id: string) => {
        await deleteCategoryMutation.mutateAsync(id).catch(() => {});
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

    const getCategoryCompletionRate = (categoryId: string, monthDate: Date) => {
        const categoryHabits = habits.filter((h) => h.categoryId === categoryId);
        if (categoryHabits.length === 0) return 0;
        const total = categoryHabits.reduce((sum, h) => sum + getHabitCompletionRate(h.id, monthDate), 0);
        return Math.round(total / categoryHabits.length);
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
            categories,
            toggleHabit,
            getHabitCompletionRate,
            getCategoryCompletionRate,
            getDailyCompletionRate,
            addHabit,
            editHabit,
            removeHabit,
            reorderHabits,
            addCategory,
            updateCategory,
            deleteCategory,
            isLoading: habitsQuery.isLoading || recordsQuery.isLoading || categoriesQuery.isLoading
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
