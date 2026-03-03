"use client";

import { useFinance } from "@/components/FinanceProvider";
import { TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, Edit2, Check, X } from "lucide-react";
import { cn, evaluateMath } from "@/lib/utils";
import { useState } from "react";

export function BudgetSummary() {
    const { budget, totalSpent, remainingBudget, updateBudget, isFutureMonth } = useFinance();
    const [isEditing, setIsEditing] = useState(false);
    const [newBudget, setNewBudget] = useState(budget.toString());

    const handleSave = async () => {
        const val = evaluateMath(newBudget);
        await updateBudget(val);
        setIsEditing(false);
    };

    return (
        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-10 -mt-10" />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl">
                        <Wallet className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className="font-bold text-lg text-white tracking-tight">Monthly Overview</h2>
                </div>
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <button onClick={handleSave} className="p-2.5 bg-green-500/10 hover:bg-green-500/20 rounded-xl text-green-500 transition-all cursor-pointer">
                            <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsEditing(false)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-all cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    !isFutureMonth && (
                        <button
                            onClick={() => { setIsEditing(true); setNewBudget(budget.toString()); }}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-lg active:scale-95",
                                budget === 0
                                    ? "bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-500 animate-pulse"
                                    : "bg-white/5 text-[#888888] hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {budget === 0 ? "Set Budget" : "Edit Budget"}
                        </button>
                    )
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Total Budget */}
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <div className="flex flex-col gap-1 w-full">
                        <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em]">Total Monthly Budget</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={newBudget}
                                onChange={(e) => setNewBudget(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-2xl font-bold text-white outline-none focus:border-blue-500 w-full"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            />
                        ) : (
                            <div className="text-2xl font-bold text-white tracking-tight">{budget.toLocaleString()}</div>
                        )}
                    </div>
                    {!isEditing && <ArrowUpCircle className="w-5 h-5 text-[#333333]" />}
                </div>

                {/* Total Spent */}
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em]">Total Spent</span>
                        <div className="text-2xl font-bold text-white tracking-tight">{totalSpent.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-red-500/80 bg-red-500/5 px-2 py-1 rounded-md">
                        <TrendingUp className="w-3 h-3" />
                        {budget > 0 ? ((totalSpent / budget) * 100).toFixed(0) : 0}%
                    </div>
                </div>

                {/* Remaining Balance */}
                <div className="flex justify-between items-end pt-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em]">Remaining</span>
                        <div className={cn(
                            "text-3xl font-black tracking-tighter transition-colors",
                            remainingBudget >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                            {remainingBudget.toLocaleString()}
                        </div>
                    </div>
                    <div className={cn(
                        "p-3 rounded-2xl transition-all",
                        remainingBudget >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                        <ArrowDownCircle className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
}
