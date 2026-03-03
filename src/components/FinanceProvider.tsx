"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { format, startOfMonth, addMonths } from "date-fns";
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

export function FinanceProvider({ children }: { children: React.ReactNode }) {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
    const [budget, setBudget] = useState<number>(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial and Month-switch Fetch
    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                const [budgetRes, categoriesRes, expensesRes, fixedCostsRes] = await Promise.all([
                    fetch(`/api/finance/budget?month=${selectedMonth}`),
                    fetch(`/api/finance/categories`),
                    fetch(`/api/finance/expenses?month=${selectedMonth}`),
                    fetch(`/api/finance/fixed-costs?month=${selectedMonth}`)
                ]);

                if (budgetRes.ok) {
                    const data = await budgetRes.json();
                    setBudget(data.amount);
                }

                if (categoriesRes.ok) {
                    setCategories(await categoriesRes.json());
                }

                if (expensesRes.ok) {
                    setExpenses(await expensesRes.json());
                }

                if (fixedCostsRes.ok) {
                    setFixedCosts(await fixedCostsRes.json());
                }
            } catch (error) {
                console.error("Failed to fetch finance data", error);
                toast.error("Failed to load financial records");
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [selectedMonth]);

    const updateBudget = async (amount: number) => {
        try {
            const res = await fetch("/api/finance/budget", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: selectedMonth, amount })
            });
            if (res.ok) {
                const data = await res.json();
                setBudget(data.amount);
                toast.success("Budget updated");
            }
        } catch (error) {
            toast.error("Failed to update budget");
        }
    };

    const addCategory = async (name: string, icon: string) => {
        try {
            const res = await fetch("/api/finance/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, icon })
            });
            if (res.ok) {
                const newCat = await res.json();
                setCategories([...categories, newCat]);
                toast.success("Category added");
            }
        } catch (error) {
            toast.error("Failed to add category");
        }
    };

    const updateCategory = async (id: string, name: string, icon: string) => {
        try {
            const res = await fetch(`/api/finance/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, icon })
            });
            if (res.ok) {
                const updated = await res.json();
                setCategories(categories.map(c => c.id === id ? updated : c));
                toast.success("Category updated");
            }
        } catch (error) {
            toast.error("Failed to update category");
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            const res = await fetch(`/api/finance/categories/${id}`, { method: "DELETE" });
            if (res.ok) {
                setCategories(categories.filter(c => c.id !== id));
                toast.success("Category deleted");
            }
        } catch (error) {
            toast.error("Failed to delete category");
        }
    };

    const addExpense = async (data: Omit<Expense, "id" | "month">) => {
        try {
            const res = await fetch("/api/finance/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const newExpense = await res.json();
                // Only add to list if it belongs to the current selected month
                if (newExpense.month === selectedMonth) {
                    setExpenses([newExpense, ...expenses]);
                }
                toast.success("Expense added");
            }
        } catch (error) {
            toast.error("Failed to add expense");
        }
    };

    const updateExpense = async (id: string, data: Partial<Expense>) => {
        try {
            const res = await fetch(`/api/finance/expenses/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updated = await res.json();
                setExpenses(expenses.map(e => e.id === id ? updated : e));
                toast.success("Expense updated");
            }
        } catch (error) {
            toast.error("Failed to update expense");
        }
    };

    const deleteExpense = async (id: string) => {
        try {
            const res = await fetch(`/api/finance/expenses/${id}`, { method: "DELETE" });
            if (res.ok) {
                setExpenses(expenses.filter(e => e.id !== id));
                toast.success("Expense deleted");
            }
        } catch (error) {
            toast.error("Failed to delete expense");
        }
    };

    const addFixedCost = async (name: string, amount: number) => {
        try {
            const res = await fetch("/api/finance/fixed-costs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: selectedMonth, name, amount })
            });
            if (res.ok) {
                const newFixed = await res.json();
                setFixedCosts([...fixedCosts, newFixed]);
                toast.success("Fixed cost added");
            }
        } catch (error) {
            toast.error("Failed to add fixed cost");
        }
    };

    const updateFixedCost = async (id: string, data: Partial<FixedCost>) => {
        try {
            const res = await fetch(`/api/finance/fixed-costs/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updated = await res.json();
                setFixedCosts(fixedCosts.map(f => f.id === id ? updated : f));
                toast.success("Fixed cost updated");
            }
        } catch (error) {
            toast.error("Failed to update fixed cost");
        }
    };

    const deleteFixedCost = async (id: string) => {
        try {
            const res = await fetch(`/api/finance/fixed-costs/${id}`, { method: "DELETE" });
            if (res.ok) {
                setFixedCosts(fixedCosts.filter(f => f.id !== id));
                toast.success("Fixed cost deleted");
            }
        } catch (error) {
            toast.error("Failed to delete fixed cost");
        }
    };

    const importFixedCosts = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/finance/fixed-costs/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: selectedMonth })
            });
            if (res.ok) {
                const data = await res.json();
                setFixedCosts(data);
                toast.success("Imported from previous month");
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to import");
            }
        } catch (error) {
            toast.error("Failed to import fixed costs");
        } finally {
            setIsLoading(false);
        }
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
            isLoading,
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
