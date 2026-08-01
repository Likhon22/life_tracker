"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2, Landmark } from "lucide-react";
import { ModulePage } from "@/components/layout/ModulePage";
import { Button } from "@/components/ui/Button";
import { useInvestments } from "@/components/investments/useInvestments";
import { SummaryCard } from "@/components/investments/SummaryCard";
import { AddCategoryForm } from "@/components/investments/AddCategoryForm";
import { CategoryFolder } from "@/components/investments/CategoryFolder";
import { InvestmentItem } from "@/components/investments/types";

export default function InvestmentsPage() {
    const {
        categories, investments, isLoading,
        addCategory, deleteCategory,
        addInvestment, deleteInvestment, updateInvestment,
        addTransaction, updateTransaction, deleteTransaction,
    } = useInvestments();

    const [showAddCategory, setShowAddCategory] = useState(false);
    const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

    // Group investments by category once per data change instead of filtering
    // the full array on every category on every render (was O(n * m)).
    const investmentsByCategory = useMemo(() => {
        const map = new Map<string, InvestmentItem[]>();
        for (const inv of investments) {
            const catId = typeof inv.categoryId === 'string' ? inv.categoryId : inv.categoryId?.id;
            if (!catId) continue;
            const bucket = map.get(catId);
            if (bucket) bucket.push(inv);
            else map.set(catId, [inv]);
        }
        return map;
    }, [investments]);

    const grandTotalInvested = investments.reduce((s, i) => s + i.totalInvested, 0);
    const grandTotalWithdrawn = investments.reduce((s, i) => s + i.totalWithdrawn, 0);
    const grandActive = grandTotalInvested - grandTotalWithdrawn;
    const grandPnl = grandTotalWithdrawn - grandTotalInvested;

    return (
        <ModulePage
            title="Investment Tracker"
            subtitle="Track your investments across crypto, stocks, and business ventures."
            icon={Landmark}
            authDescription="Sign in to track your investment portfolio."
        >
            <div className="pb-12 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard label="Total Invested" value={grandTotalInvested} color="blue" />
                    <SummaryCard label="Total Withdrawn" value={grandTotalWithdrawn} color="emerald" />
                    <SummaryCard label="Active Capital" value={grandActive} color="orange" />
                    <SummaryCard label="P&L" value={grandPnl} color={grandPnl >= 0 ? "emerald" : "red"} showSign />
                </div>

                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-[#888888] uppercase tracking-wider">Asset Folders</h2>
                    <Button size="sm" onClick={() => setShowAddCategory(!showAddCategory)} className="flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Create Category Folder
                    </Button>
                </div>

                {showAddCategory && (
                    <AddCategoryForm
                        onSubmit={(name, icon) => {
                            addCategory(name, icon);
                            setShowAddCategory(false);
                        }}
                    />
                )}

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center opacity-20">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p className="text-sm font-bold uppercase tracking-[0.2em]">Loading Folders...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                        <Landmark className="w-12 h-12 text-[#222] mb-6" />
                        <p className="text-sm font-medium text-[#444] text-center max-w-sm">
                            No categories yet. Create a category folder to begin tracking investments.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {categories.map((cat) => (
                            <CategoryFolder
                                key={cat.id}
                                category={cat}
                                investments={investmentsByCategory.get(cat.id) || []}
                                isExpanded={expandedCategoryId === cat.id}
                                onToggleExpand={() => setExpandedCategoryId(expandedCategoryId === cat.id ? null : cat.id)}
                                onDeleteCategory={deleteCategory}
                                onAddInvestment={addInvestment}
                                onDeleteInvestment={deleteInvestment}
                                onUpdateInvestment={updateInvestment}
                                onAddTransaction={addTransaction}
                                onUpdateTransaction={updateTransaction}
                                onDeleteTransaction={deleteTransaction}
                            />
                        ))}
                    </div>
                )}
            </div>
        </ModulePage>
    );
}
