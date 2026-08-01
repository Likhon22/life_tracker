"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMonths } from "date-fns";
import { toast } from "react-hot-toast";

export type Category = {
    id: string;
    name: string;
    icon: string;
};

export type Expense = {
    id: string;
    date: string;
    month: string;
    amount: number;
    categoryId: Category | string;
    note?: string;
};

export type FixedCost = {
    id: string;
    name: string;
    amount: number;
    month: string;
};

export type Budget = {
    month: string;
    amount: number;
};

export const COMMON_ICONS = [
    "Wallet", "ShoppingCart", "Bus", "Car", "Utensils", "Coffee", "Apple", "Beer", "Pizza", "Wine",
    "Gift", "ShoppingBag", "Briefcase", "Home", "Wifi", "Zap", "Droplets", "Smartphone", "Tv", "Music",
    "Plane", "Map", "Camera", "Heart", "Stethoscope", "Pill", "Gamepad", "Dumbbell", "Book", "GraduationCap",
    "Baby", "PawPrint", "TreePine", "Flower2", "Sun", "Moon", "Cloud", "Scissors", "Trash2", "Settings",
    "User", "CreditCard", "Banknote", "Coins", "LineChart", "PieChart", "TrendingUp", "Search", "Plus", "Check"
];

type FinanceContextType = {
    selectedMonth: string; // YYYY-MM
    setSelectedMonth: (month: string) => void;
    budget: number;
    updateBudget: (amount: number) => Promise<void>;
    categories: Category[];
    addCategory: (name: string, icon: string) => Promise<void>;
    updateCategory: (id: string, name: string, icon: string) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    expenses: Expense[];
    addExpense: (data: Omit<Expense, "id" | "month">) => Promise<void>;
    updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    fixedCosts: FixedCost[];
    addFixedCost: (name: string, amount: number) => Promise<void>;
    updateFixedCost: (id: string, data: Partial<FixedCost>) => Promise<void>;
    deleteFixedCost: (id: string) => Promise<void>;
    importFixedCosts: () => Promise<void>;
    isLoading: boolean;
    // Calculations
    totalSpent: number;
    totalFixedCosts: number;
    totalDailyExpenses: number;
    remainingBudget: number;
    isFutureMonth: boolean;
    isPastMonth: boolean;
    isCurrentMonth: boolean;
    isNextMonth: boolean;
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request to ${url} failed`);
    return res.json();
}

// Stable empty-array references so useMemo below doesn't see a "changed" dependency
// on every render while a query has no data yet (the ?? [] pattern creates a new array each time).
const EMPTY_CATEGORIES: Category[] = [];
const EMPTY_EXPENSES: Expense[] = [];
const EMPTY_FIXED_COSTS: FixedCost[] = [];

export function FinanceProvider({ children }: { children: React.ReactNode }) {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
    const queryClient = useQueryClient();

    const budgetQuery = useQuery({
        queryKey: ["finance", "budget", selectedMonth],
        queryFn: () => fetchJSON<Budget>(`/api/finance/budget?month=${selectedMonth}`),
    });

    const categoriesQuery = useQuery({
        queryKey: ["finance", "categories"],
        queryFn: () => fetchJSON<Category[]>("/api/finance/categories"),
    });

    const expensesQuery = useQuery({
        queryKey: ["finance", "expenses", selectedMonth],
        queryFn: () => fetchJSON<Expense[]>(`/api/finance/expenses?month=${selectedMonth}`),
    });

    const fixedCostsQuery = useQuery({
        queryKey: ["finance", "fixed-costs", selectedMonth],
        queryFn: () => fetchJSON<FixedCost[]>(`/api/finance/fixed-costs?month=${selectedMonth}`),
    });

    const budget = budgetQuery.data?.amount ?? 0;
    const categories = categoriesQuery.data ?? EMPTY_CATEGORIES;
    const expenses = expensesQuery.data ?? EMPTY_EXPENSES;
    const fixedCosts = fixedCostsQuery.data ?? EMPTY_FIXED_COSTS;

    const updateBudgetMutation = useMutation({
        mutationFn: async (amount: number) => {
            const res = await fetch("/api/finance/budget", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: selectedMonth, amount }),
            });
            if (!res.ok) throw new Error("Failed to update budget");
            return res.json() as Promise<Budget>;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["finance", "budget", selectedMonth], data);
            toast.success("Budget updated");
        },
        onError: () => toast.error("Failed to update budget"),
    });
    const updateBudget = async (amount: number) => {
        await updateBudgetMutation.mutateAsync(amount).catch(() => {});
    };

    const addCategoryMutation = useMutation({
        mutationFn: async ({ name, icon }: { name: string; icon: string }) => {
            const res = await fetch("/api/finance/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, icon }),
            });
            if (!res.ok) throw new Error("Failed to add category");
            return res.json() as Promise<Category>;
        },
        onSuccess: (newCat) => {
            queryClient.setQueryData<Category[]>(["finance", "categories"], (prev = []) => [...prev, newCat]);
            toast.success("Category added");
        },
        onError: () => toast.error("Failed to add category"),
    });
    const addCategory = async (name: string, icon: string) => {
        await addCategoryMutation.mutateAsync({ name, icon }).catch(() => {});
    };

    const updateCategoryMutation = useMutation({
        mutationFn: async ({ id, name, icon }: { id: string; name: string; icon: string }) => {
            const res = await fetch(`/api/finance/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, icon }),
            });
            if (!res.ok) throw new Error("Failed to update category");
            return res.json() as Promise<Category>;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<Category[]>(["finance", "categories"], (prev = []) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
            );
            toast.success("Category updated");
        },
        onError: () => toast.error("Failed to update category"),
    });
    const updateCategory = async (id: string, name: string, icon: string) => {
        await updateCategoryMutation.mutateAsync({ id, name, icon }).catch(() => {});
    };

    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/finance/categories/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete category");
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<Category[]>(["finance", "categories"], (prev = []) =>
                prev.filter((c) => c.id !== id)
            );
            toast.success("Category deleted");
        },
        onError: () => toast.error("Failed to delete category"),
    });
    const deleteCategory = async (id: string) => {
        await deleteCategoryMutation.mutateAsync(id).catch(() => {});
    };

    const addExpenseMutation = useMutation({
        mutationFn: async (data: Omit<Expense, "id" | "month">) => {
            const res = await fetch("/api/finance/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to add expense");
            return res.json() as Promise<Expense>;
        },
        onSuccess: (newExpense) => {
            if (newExpense.month === selectedMonth) {
                queryClient.setQueryData<Expense[]>(["finance", "expenses", selectedMonth], (prev = []) => [
                    newExpense,
                    ...prev,
                ]);
            }
            toast.success("Expense added");
        },
        onError: () => toast.error("Failed to add expense"),
    });
    const addExpense = async (data: Omit<Expense, "id" | "month">) => {
        await addExpenseMutation.mutateAsync(data).catch(() => {});
    };

    const updateExpenseMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Expense> }) => {
            const res = await fetch(`/api/finance/expenses/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update expense");
            return res.json() as Promise<Expense>;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<Expense[]>(["finance", "expenses", selectedMonth], (prev = []) =>
                prev.map((e) => (e.id === updated.id ? updated : e))
            );
            toast.success("Expense updated");
        },
        onError: () => toast.error("Failed to update expense"),
    });
    const updateExpense = async (id: string, data: Partial<Expense>) => {
        await updateExpenseMutation.mutateAsync({ id, data }).catch(() => {});
    };

    const deleteExpenseMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/finance/expenses/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete expense");
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<Expense[]>(["finance", "expenses", selectedMonth], (prev = []) =>
                prev.filter((e) => e.id !== id)
            );
            toast.success("Expense deleted");
        },
        onError: () => toast.error("Failed to delete expense"),
    });
    const deleteExpense = async (id: string) => {
        await deleteExpenseMutation.mutateAsync(id).catch(() => {});
    };

    const addFixedCostMutation = useMutation({
        mutationFn: async ({ name, amount }: { name: string; amount: number }) => {
            const res = await fetch("/api/finance/fixed-costs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: selectedMonth, name, amount }),
            });
            if (!res.ok) throw new Error("Failed to add fixed cost");
            return res.json() as Promise<FixedCost>;
        },
        onSuccess: (newFixed) => {
            queryClient.setQueryData<FixedCost[]>(["finance", "fixed-costs", selectedMonth], (prev = []) => [
                ...prev,
                newFixed,
            ]);
            toast.success("Fixed cost added");
        },
        onError: () => toast.error("Failed to add fixed cost"),
    });
    const addFixedCost = async (name: string, amount: number) => {
        await addFixedCostMutation.mutateAsync({ name, amount }).catch(() => {});
    };

    const updateFixedCostMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<FixedCost> }) => {
            const res = await fetch(`/api/finance/fixed-costs/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update fixed cost");
            return res.json() as Promise<FixedCost>;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<FixedCost[]>(["finance", "fixed-costs", selectedMonth], (prev = []) =>
                prev.map((f) => (f.id === updated.id ? updated : f))
            );
            toast.success("Fixed cost updated");
        },
        onError: () => toast.error("Failed to update fixed cost"),
    });
    const updateFixedCost = async (id: string, data: Partial<FixedCost>) => {
        await updateFixedCostMutation.mutateAsync({ id, data }).catch(() => {});
    };

    const deleteFixedCostMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/finance/fixed-costs/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete fixed cost");
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<FixedCost[]>(["finance", "fixed-costs", selectedMonth], (prev = []) =>
                prev.filter((f) => f.id !== id)
            );
            toast.success("Fixed cost deleted");
        },
        onError: () => toast.error("Failed to delete fixed cost"),
    });
    const deleteFixedCost = async (id: string) => {
        await deleteFixedCostMutation.mutateAsync(id).catch(() => {});
    };

    const importFixedCostsMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/finance/fixed-costs/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: selectedMonth }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to import");
            return data as FixedCost[];
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["finance", "fixed-costs", selectedMonth], data);
            toast.success("Imported from previous month");
        },
        onError: (error: Error) => toast.error(error.message || "Failed to import fixed costs"),
    });
    const importFixedCosts = async () => {
        await importFixedCostsMutation.mutateAsync().catch(() => {});
    };

    // Derived Calculations
    const totalDailyExpenses = useMemo(() =>
        expenses.reduce((sum, e) => sum + e.amount, 0),
        [expenses]);

    const totalFixedCosts = useMemo(() =>
        fixedCosts.reduce((sum, f) => sum + f.amount, 0),
        [fixedCosts]);

    const totalSpent = totalDailyExpenses + totalFixedCosts;
    const remainingBudget = budget - totalSpent;

    const isFutureMonth = useMemo(() => {
        const currentMonth = format(new Date(), "yyyy-MM");
        return selectedMonth > currentMonth;
    }, [selectedMonth]);
    const isCurrentMonth = useMemo(() => {
        return selectedMonth === format(new Date(), "yyyy-MM");
    }, [selectedMonth]);

    const isNextMonth = useMemo(() => {
        const nextMonth = format(addMonths(new Date(), 1), "yyyy-MM");
        return selectedMonth === nextMonth;
    }, [selectedMonth]);

    const isPastMonth = useMemo(() => {
        const currentMonth = format(new Date(), "yyyy-MM");
        return selectedMonth < currentMonth;
    }, [selectedMonth]);

    return (
        <FinanceContext.Provider value={{
            selectedMonth,
            setSelectedMonth,
            budget,
            updateBudget,
            categories,
            addCategory,
            updateCategory,
            deleteCategory,
            expenses,
            addExpense,
            updateExpense,
            deleteExpense,
            fixedCosts,
            addFixedCost,
            updateFixedCost,
            deleteFixedCost,
            importFixedCosts,
            isLoading: budgetQuery.isLoading || categoriesQuery.isLoading || expensesQuery.isLoading || fixedCostsQuery.isLoading,
            totalSpent,
            totalFixedCosts,
            totalDailyExpenses,
            remainingBudget,
            isFutureMonth,
            isPastMonth,
            isCurrentMonth,
            isNextMonth,
        }}>
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const context = useContext(FinanceContext);
    if (context === undefined) {
        throw new Error("useFinance must be used within a FinanceProvider");
    }
    return context;
}
