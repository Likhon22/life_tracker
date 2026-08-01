"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Category, InvestmentItem } from "./types";

async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request to ${url} failed`);
    return res.json();
}

export function useInvestments() {
    const queryClient = useQueryClient();

    const categoriesQuery = useQuery({
        queryKey: ["investments", "categories"],
        queryFn: () => fetchJSON<Category[]>("/api/investments/categories"),
    });

    const investmentsQuery = useQuery({
        queryKey: ["investments", "list"],
        queryFn: () => fetchJSON<InvestmentItem[]>("/api/investments"),
    });

    const invalidateInvestments = () => queryClient.invalidateQueries({ queryKey: ["investments", "list"] });

    const addCategoryMutation = useMutation({
        mutationFn: async ({ name, icon }: { name: string; icon: string }) => {
            const res = await fetch("/api/investments/categories", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, icon }),
            });
            if (!res.ok) throw new Error("Failed to create category");
            return res.json() as Promise<Category>;
        },
        onSuccess: (cat) => {
            queryClient.setQueryData<Category[]>(["investments", "categories"], (prev = []) => [...prev, cat]);
            // Server auto-creates a default "General" investment under the new category
            invalidateInvestments();
            toast.success("Category folder created");
        },
        onError: () => toast.error("Failed to create category"),
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/investments/categories/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete category");
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<Category[]>(["investments", "categories"], (prev = []) =>
                prev.filter(c => c.id !== id));
            queryClient.setQueryData<InvestmentItem[]>(["investments", "list"], (prev = []) =>
                prev.filter(inv => {
                    const catId = typeof inv.categoryId === 'string' ? inv.categoryId : inv.categoryId?.id;
                    return catId !== id;
                }));
            toast.success("Category folder deleted");
        },
        onError: (error: Error) => toast.error(error.message || "Failed to delete category"),
    });

    const addInvestmentMutation = useMutation({
        mutationFn: async ({ name, categoryId, note }: { name: string; categoryId: string; note?: string }) => {
            const res = await fetch("/api/investments", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, categoryId, note }),
            });
            if (!res.ok) throw new Error("Failed to add asset");
            return res.json() as Promise<InvestmentItem>;
        },
        onSuccess: (inv) => {
            queryClient.setQueryData<InvestmentItem[]>(["investments", "list"], (prev = []) => [inv, ...prev]);
            toast.success("Asset added under category");
        },
        onError: () => toast.error("Failed to add asset"),
    });

    const deleteInvestmentMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete asset");
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<InvestmentItem[]>(["investments", "list"], (prev = []) =>
                prev.filter(i => i.id !== id));
            toast.success("Asset deleted");
        },
        onError: () => toast.error("Failed to delete asset"),
    });

    const updateInvestmentMutation = useMutation({
        mutationFn: async ({ id, name, note }: { id: string; name: string; note: string }) => {
            const res = await fetch(`/api/investments/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, note }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update asset");
            return data as InvestmentItem;
        },
        onSuccess: (updated) => {
            // The PUT response has no aggregated transactions/totals, so merge only the edited fields.
            queryClient.setQueryData<InvestmentItem[]>(["investments", "list"], (prev = []) =>
                prev.map(inv => inv.id === updated.id ? { ...inv, name: updated.name, note: updated.note } : inv));
            toast.success("Asset updated");
        },
        onError: (error: Error) => toast.error(error.message || "Failed to update asset"),
    });

    const addTransactionMutation = useMutation({
        mutationFn: async (vars: { investmentId: string; type: 'invest' | 'withdraw'; amount: number; date: string; note?: string }) => {
            const res = await fetch(`/api/investments/${vars.investmentId}/transactions`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: vars.type, amount: vars.amount, date: vars.date, note: vars.note }),
            });
            if (!res.ok) throw new Error("Failed to add transaction");
        },
        onSuccess: () => { invalidateInvestments(); toast.success("Transaction recorded"); },
        onError: () => toast.error("Failed to add transaction"),
    });

    const deleteTransactionMutation = useMutation({
        mutationFn: async (txId: string) => {
            const res = await fetch(`/api/investments/${txId}/transactions`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to remove transaction");
        },
        onSuccess: () => { invalidateInvestments(); toast.success("Transaction removed"); },
        onError: () => toast.error("Failed to remove transaction"),
    });

    const updateTransactionMutation = useMutation({
        mutationFn: async (vars: { txId: string; type: 'invest' | 'withdraw'; amount: number; date: string; note?: string }) => {
            const res = await fetch(`/api/investments/${vars.txId}/transactions`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: vars.type, amount: vars.amount, date: vars.date, note: vars.note }),
            });
            if (!res.ok) throw new Error("Failed to update transaction");
        },
        onSuccess: () => { invalidateInvestments(); toast.success("Transaction updated"); },
        onError: () => toast.error("Failed to update transaction"),
    });

    return {
        categories: categoriesQuery.data ?? [],
        investments: investmentsQuery.data ?? [],
        isLoading: categoriesQuery.isLoading || investmentsQuery.isLoading,

        addCategory: (name: string, icon: string) =>
            addCategoryMutation.mutateAsync({ name, icon }).catch(() => {}),
        deleteCategory: (id: string) =>
            deleteCategoryMutation.mutateAsync(id).catch(() => {}),

        addInvestment: (name: string, categoryId: string, note?: string) =>
            addInvestmentMutation.mutateAsync({ name, categoryId, note }).catch(() => {}),
        deleteInvestment: (id: string) =>
            deleteInvestmentMutation.mutateAsync(id).catch(() => {}),
        updateInvestment: (id: string, name: string, note: string) =>
            updateInvestmentMutation.mutateAsync({ id, name, note }).catch(() => {}),

        addTransaction: (investmentId: string, type: 'invest' | 'withdraw', amount: number, date: string, note?: string) =>
            addTransactionMutation.mutateAsync({ investmentId, type, amount, date, note }).catch(() => {}),
        deleteTransaction: (txId: string) =>
            deleteTransactionMutation.mutateAsync(txId).catch(() => {}),
        updateTransaction: (txId: string, type: 'invest' | 'withdraw', amount: number, date: string, note?: string) =>
            updateTransactionMutation.mutateAsync({ txId, type, amount, date, note }).catch(() => {}),
    };
}
