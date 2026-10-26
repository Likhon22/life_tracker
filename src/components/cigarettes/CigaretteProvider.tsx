"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export type CigaretteBrand = {
    id: string;
    name: string;
    pricePerStick: number;
};

export type CigaretteLog = {
    id: string;
    date: string;
    brandId: CigaretteBrand | string;
    quantity: number;
    amount: number;
    isSelf: boolean;
    note?: string;
};

type NewLogInput = {
    date: string;
    brandId: string;
    quantity: number;
    amount: number;
    isSelf: boolean;
    note?: string;
};

type CigaretteContextType = {
    brands: CigaretteBrand[];
    logs: CigaretteLog[];
    addBrand: (name: string, pricePerStick: number) => Promise<void>;
    updateBrand: (id: string, name: string, pricePerStick: number) => Promise<void>;
    deleteBrand: (id: string) => Promise<void>;
    addLog: (input: NewLogInput) => Promise<void>;
    updateLog: (id: string, input: Partial<NewLogInput>) => Promise<void>;
    deleteLog: (id: string) => Promise<void>;
    isLoading: boolean;
    // Derived stats
    todaySelfCount: number;
    todayFriendCount: number;
    todayCost: number;
    monthSelfCount: number;
    monthFriendCount: number;
    monthCost: number;
    byBrand: { brand: CigaretteBrand; sticks: number; cost: number }[];
    byDate: { date: string; sticks: number }[];
};

const CigaretteContext = createContext<CigaretteContextType | undefined>(undefined);

async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request to ${url} failed`);
    return res.json();
}

function brandOf(log: CigaretteLog): CigaretteBrand | undefined {
    return typeof log.brandId === "string" ? undefined : log.brandId;
}

export function CigaretteProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const currentMonth = todayStr.substring(0, 7);

    const brandsQuery = useQuery({
        queryKey: ["cigaretteBrands"],
        queryFn: () => fetchJSON<CigaretteBrand[]>("/api/cigarettes/brands"),
    });

    const logsQuery = useQuery({
        queryKey: ["cigaretteLogs", currentMonth],
        queryFn: () => fetchJSON<CigaretteLog[]>(`/api/cigarettes/logs?month=${currentMonth}`),
    });

    const brands = brandsQuery.data ?? [];
    const logs = logsQuery.data ?? [];

    const addBrandMutation = useMutation({
        mutationFn: async ({ name, pricePerStick }: { name: string; pricePerStick: number }) => {
            const res = await fetch("/api/cigarettes/brands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, pricePerStick }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add brand");
            }
            return res.json() as Promise<CigaretteBrand>;
        },
        onSuccess: (newBrand) => {
            queryClient.setQueryData<CigaretteBrand[]>(["cigaretteBrands"], (prev = []) => [...prev, newBrand]);
            toast.success("Brand added");
        },
        onError: (error: Error) => toast.error(error.message),
    });
    const addBrand = async (name: string, pricePerStick: number) => {
        await addBrandMutation.mutateAsync({ name, pricePerStick }).catch(() => {});
    };

    const updateBrandMutation = useMutation({
        mutationFn: async ({ id, name, pricePerStick }: { id: string; name: string; pricePerStick: number }) => {
            const res = await fetch(`/api/cigarettes/brands/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, pricePerStick }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update brand");
            }
            return res.json() as Promise<CigaretteBrand>;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<CigaretteBrand[]>(["cigaretteBrands"], (prev = []) =>
                prev.map((b) => (b.id === updated.id ? updated : b))
            );
            toast.success("Brand updated");
        },
        onError: (error: Error) => toast.error(error.message),
    });
    const updateBrand = async (id: string, name: string, pricePerStick: number) => {
        await updateBrandMutation.mutateAsync({ id, name, pricePerStick }).catch(() => {});
    };

    const deleteBrandMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/cigarettes/brands/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete brand");
            }
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<CigaretteBrand[]>(["cigaretteBrands"], (prev = []) => prev.filter((b) => b.id !== id));
            toast.success("Brand deleted");
        },
        onError: (error: Error) => toast.error(error.message),
    });
    const deleteBrand = async (id: string) => {
        await deleteBrandMutation.mutateAsync(id).catch(() => {});
    };

    const addLogMutation = useMutation({
        mutationFn: async (input: NewLogInput) => {
            const res = await fetch("/api/cigarettes/logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add log");
            }
            return res.json() as Promise<CigaretteLog>;
        },
        onSuccess: (newLog) => {
            queryClient.setQueryData<CigaretteLog[]>(["cigaretteLogs", currentMonth], (prev = []) => [newLog, ...prev]);
            toast.success("Logged");
        },
        onError: (error: Error) => toast.error(error.message),
    });
    const addLog = async (input: NewLogInput) => {
        await addLogMutation.mutateAsync(input).catch(() => {});
    };

    const updateLogMutation = useMutation({
        mutationFn: async ({ id, input }: { id: string; input: Partial<NewLogInput> }) => {
            const res = await fetch(`/api/cigarettes/logs/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update log");
            }
            return res.json() as Promise<CigaretteLog>;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<CigaretteLog[]>(["cigaretteLogs", currentMonth], (prev = []) =>
                prev.map((l) => (l.id === updated.id ? updated : l))
            );
            toast.success("Log updated");
        },
        onError: (error: Error) => toast.error(error.message),
    });
    const updateLog = async (id: string, input: Partial<NewLogInput>) => {
        await updateLogMutation.mutateAsync({ id, input }).catch(() => {});
    };

    const deleteLogMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/cigarettes/logs/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete log");
            }
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<CigaretteLog[]>(["cigaretteLogs", currentMonth], (prev = []) => prev.filter((l) => l.id !== id));
            toast.success("Log deleted");
        },
        onError: (error: Error) => toast.error(error.message),
    });
    const deleteLog = async (id: string) => {
        await deleteLogMutation.mutateAsync(id).catch(() => {});
    };

    const stats = useMemo(() => {
        const todayLogs = logs.filter((l) => l.date === todayStr);
        const todaySelfCount = todayLogs.filter((l) => l.isSelf).reduce((sum, l) => sum + l.quantity, 0);
        const todayFriendCount = todayLogs.filter((l) => !l.isSelf).reduce((sum, l) => sum + l.quantity, 0);
        const todayCost = todayLogs.reduce((sum, l) => sum + l.amount, 0);

        const monthSelfCount = logs.filter((l) => l.isSelf).reduce((sum, l) => sum + l.quantity, 0);
        const monthFriendCount = logs.filter((l) => !l.isSelf).reduce((sum, l) => sum + l.quantity, 0);
        const monthCost = logs.reduce((sum, l) => sum + l.amount, 0);

        const brandMap = new Map<string, { brand: CigaretteBrand; sticks: number; cost: number }>();
        for (const log of logs) {
            const brand = brandOf(log);
            if (!brand) continue;
            const entry = brandMap.get(brand.id) ?? { brand, sticks: 0, cost: 0 };
            entry.sticks += log.quantity;
            entry.cost += log.amount;
            brandMap.set(brand.id, entry);
        }
        const byBrand = Array.from(brandMap.values()).sort((a, b) => b.sticks - a.sticks);

        const dateMap = new Map<string, number>();
        for (const log of logs) {
            if (!log.isSelf) continue;
            dateMap.set(log.date, (dateMap.get(log.date) ?? 0) + log.quantity);
        }
        const byDate = Array.from(dateMap.entries())
            .map(([date, sticks]) => ({ date, sticks }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return { todaySelfCount, todayFriendCount, todayCost, monthSelfCount, monthFriendCount, monthCost, byBrand, byDate };
    }, [logs, todayStr]);

    return (
        <CigaretteContext.Provider value={{
            brands,
            logs,
            addBrand,
            updateBrand,
            deleteBrand,
            addLog,
            updateLog,
            deleteLog,
            isLoading: brandsQuery.isLoading || logsQuery.isLoading,
            ...stats,
        }}>
            {children}
        </CigaretteContext.Provider>
    );
}

export function useCigarettes() {
    const context = useContext(CigaretteContext);
    if (context === undefined) {
        throw new Error("useCigarettes must be used within a CigaretteProvider");
    }
    return context;
}
