"use client";

import { useFinance } from "@/components/FinanceProvider";
import { useState } from "react";
import { format } from "date-fns";
import * as Icons from "lucide-react";
import { cn, evaluateMath } from "@/lib/utils";
import { Plus, ChevronDown, LayoutGrid, X } from "lucide-react";
import { CategoryManager } from "./CategoryManager";

export function AddExpense() {
    const { categories, addExpense, isFutureMonth } = useFinance();
    const [amount, setAmount] = useState<string>("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const evaluatedAmount = evaluateMath(amount);
        if (evaluatedAmount <= 0) return;

        setIsSubmitting(true);
        try {
            await addExpense({
                date: format(new Date(), "yyyy-MM-dd"),
                amount: evaluatedAmount,
                categoryId: selectedCategoryId,
                note: note.trim()
            });
            setAmount("");
            setNote("");
            setSelectedCategoryId("");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const SelectedIcon = selectedCategory ? ((Icons as any)[selectedCategory.icon] || Icons.HelpCircle) : null;

    return (
        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-500/10 rounded-xl">
                        <Plus className="w-5 h-5 text-green-500" />
                    </div>
                    <h2 className="font-bold text-lg text-white tracking-tight">Add Expense</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Dropdown Selector */}
                <div className="space-y-2 relative">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em]">Category</label>
                        <button
                            type="button"
                            onClick={() => setIsManageModalOpen(true)}
                            className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-all cursor-pointer"
                        >
                            Manage
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-xl py-3.5 px-4 flex items-center justify-between group transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            {SelectedIcon ? (
                                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                    <SelectedIcon className="w-4 h-4 text-blue-500" />
                                </div>
                            ) : (
                                <div className="p-1.5 bg-white/5 rounded-lg">
                                    <LayoutGrid className="w-4 h-4 text-[#444444]" />
                                </div>
                            )}
                            <span className={cn(
                                "text-sm font-medium transition-colors",
                                selectedCategory ? "text-white" : "text-[#444444]"
                            )}>
                                {selectedCategory ? selectedCategory.name : "Select a category"}
                            </span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-[#444444] transition-transform duration-300", isDropdownOpen && "rotate-180")} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#191919] border border-[#2d2d2d] rounded-2xl shadow-2xl p-2 z-50 max-h-[240px] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {categories.map((cat) => {
                                const IconComponent = (Icons as any)[cat.icon] || Icons.HelpCircle;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => { setSelectedCategoryId(cat.id); setIsDropdownOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group",
                                            selectedCategoryId === cat.id ? "bg-blue-600 shadow-lg shadow-blue-600/20" : "hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            selectedCategoryId === cat.id ? "bg-white/20 text-white" : "bg-white/5 text-[#888888] group-hover:text-blue-500"
                                        )}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        <span className={cn(
                                            "text-sm font-bold tracking-tight",
                                            selectedCategoryId === cat.id ? "text-white" : "text-[#ededed]"
                                        )}>
                                            {cat.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em] px-1">Amount</label>
                    <input
                        type="text"
                        placeholder="0.00 (e.g. 5600+100)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 focus:border-blue-500 focus:bg-white/[0.08] text-white rounded-xl py-3.5 px-4 outline-none transition-all placeholder:text-[#444444] font-medium text-lg"
                        required
                    />
                </div>

                {/* Note Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] px-1">Note (Optional)</label>
                    <input
                        type="text"
                        placeholder="What was this for?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 focus:border-blue-500 focus:bg-white/[0.08] text-white rounded-xl py-3 px-4 outline-none transition-all placeholder:text-[#444444] text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !amount || !selectedCategoryId || isFutureMonth}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] cursor-pointer"
                >
                    {isSubmitting ? "Saving..." : isFutureMonth ? "Cannot Add to Future Month" : "Record Expense"}
                </button>
            </form>

            {/* Manage Categories Modal */}
            {isManageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm" onClick={() => setIsManageModalOpen(false)} />
                    <div className="bg-[#191919] border border-[#2d2d2d] rounded-[32px] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <button
                            onClick={() => setIsManageModalOpen(false)}
                            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-[#888888] hover:text-white transition-all z-10 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex-1 overflow-y-auto no-scrollbar pt-16 px-8 pb-8">
                            <CategoryManager />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
