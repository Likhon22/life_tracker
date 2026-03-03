"use client";

import { useSession, signIn } from "next-auth/react";
import { FinanceProvider } from "@/components/FinanceProvider";
import { BudgetSummary } from "@/components/finance/BudgetSummary";
import { AddExpense } from "@/components/finance/AddExpense";
import { FixedCosts } from "@/components/finance/FixedCosts";
import { FinanceCharts } from "@/components/finance/FinanceCharts";
import { MonthSelector } from "@/components/finance/MonthSelector";
import { RecentExpenses } from "@/components/finance/RecentExpenses";
import { Wallet } from "lucide-react";
import { ModulePage } from "@/components/ModulePage";

export default function FinancePage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#111111]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#111111] p-4 text-center">
                <div className="p-4 bg-blue-500/10 rounded-2xl mb-6">
                    <Wallet className="w-12 h-12 text-blue-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Finance Management</h1>
                <p className="text-[#888888] max-w-sm mb-8">
                    Sign in to track your monthly budget, daily expenses, and analyze your spending patterns securely.
                </p>
                <button
                    onClick={() => signIn("google")}
                    className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-white/5"
                >
                    Continue with Google
                </button>
            </div>
        );
    }

    return (
        <FinanceProvider>
            <ModulePage
                title="Finance Center"
                subtitle="Efficiently manage your wealth and optimize spending habits."
                icon={Wallet}
                authDescription="Sign in to track your monthly budget, daily expenses, and analyze your spending patterns securely."
                headerContent={<MonthSelector />}
            >
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 md:gap-8 items-start">
                    {/* Left Column: Controls & Summary */}
                    <div className="flex flex-col space-y-6 md:space-y-8">
                        <div className="order-2 md:order-1">
                            <BudgetSummary />
                        </div>
                        <div className="order-1 md:order-2">
                            <AddExpense />
                        </div>
                        <div className="order-3">
                            <FixedCosts />
                        </div>
                    </div>

                    {/* Right Column: Analytics & List */}
                    <div className="space-y-6 md:space-y-8">
                        <FinanceCharts />
                        <RecentExpenses />
                    </div>
                </div>
            </ModulePage>
        </FinanceProvider>
    );
}
