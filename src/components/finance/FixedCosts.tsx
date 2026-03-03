"use client";

import { useFinance } from "@/components/FinanceProvider";
import { useState } from "react";
import { Receipt, Plus, Trash2, Home, Power, ShoppingCart, MoreHorizontal, Edit2, Check, X } from "lucide-react";
import { cn, evaluateMath } from "@/lib/utils";

const FIXED_COST_SUGGESTIONS = [
    { name: "Rent", icon: Home },
    { name: "Home Utilities", icon: Power },
    { name: "Home Groceries", icon: ShoppingCart },
    { name: "Internet", icon: Receipt },
];

export function FixedCosts() {
    const { fixedCosts, addFixedCost, deleteFixedCost, updateFixedCost, isFutureMonth, isPastMonth, isCurrentMonth, isNextMonth, importFixedCosts } = useFinance();
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editAmount, setEditAmount] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;
        await addFixedCost(name, evaluateMath(amount));
        setName("");
        setAmount("");
        setIsAdding(false);
    };

    const handleUpdate = async (id: string) => {
        if (!editName || !editAmount) return;
        await updateFixedCost(id, { name: editName, amount: evaluateMath(editAmount) });
        setEditingId(null);
    };

    const startEdit = (cost: any) => {
        setEditingId(cost.id);
        setEditName(cost.name);
        setEditAmount(cost.amount.toString());
        setIsAdding(false);
    };

    return (
        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl">
                        <Receipt className="w-5 h-5 text-purple-500" />
                    </div>
                    <h2 className="font-bold text-lg text-white tracking-tight">Fixed Monthly Costs</h2>
                </div>
                {!isFutureMonth && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[#888888] hover:text-white transition-all cursor-pointer"
                    >
                        <Plus className={cn("w-4 h-4 transition-transform", isAdding && "rotate-45")} />
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input
                        type="text"
                        placeholder="Cost name (e.g. Rent)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#111111] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500 transition-all font-medium"
                        required
                    />
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Amount (e.g. 5600+100)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex-1 bg-[#111111] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500 transition-all font-medium"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all cursor-pointer"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {FIXED_COST_SUGGESTIONS.map((s) => (
                            <button
                                key={s.name}
                                type="button"
                                onClick={() => setName(s.name)}
                                className="text-[10px] bg-white/10 hover:bg-white/20 text-[#888888] hover:text-[#ededed] px-2 py-1 rounded transition-all font-bold uppercase tracking-wider"
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </form>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] lg:max-h-none no-scrollbar">
                {fixedCosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                        <Receipt className="w-8 h-8 text-[#333333] mb-3 opacity-20" />
                        <p className="text-sm font-medium text-[#555555] text-center mb-4">No fixed costs recorded for this month</p>
                        {(isCurrentMonth || isNextMonth) && (
                            <button
                                onClick={importFixedCosts}
                                className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-2 transition-all cursor-pointer bg-blue-500/5 px-4 py-2 rounded-xl hover:bg-blue-500/10 active:scale-95"
                            >
                                Import from previous month
                            </button>
                        )}
                    </div>
                ) : (
                    fixedCosts.map((cost) => {
                        const isEditing = editingId === cost.id;
                        return (
                            <div key={cost.id} className="group bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:bg-white/[0.06] transition-all relative">
                                {isEditing ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#555555] uppercase tracking-widest px-1">Name</label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#555555] uppercase tracking-widest px-1">Amount</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    className="flex-1 min-w-0 bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none transition-all"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cost.id)}
                                                />
                                                <div className="flex gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => handleUpdate(cost.id)}
                                                        className="w-10 h-10 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all cursor-pointer shadow-lg shadow-green-600/10 active:scale-95 flex items-center justify-center"
                                                        title="Save"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="w-10 h-10 bg-white/5 hover:bg-white/10 text-[#888888] hover:text-white rounded-lg transition-all cursor-pointer flex items-center justify-center border border-white/5"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-bold text-white tracking-tight">{cost.name}</span>
                                            <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">{cost.amount.toLocaleString()} / mo</span>
                                        </div>
                                        {!isFutureMonth && (
                                            <div className="flex items-center gap-1 transition-all">
                                                <button
                                                    onClick={() => startEdit(cost)}
                                                    className="p-2.5 text-[#888888] hover:text-blue-500 transition-all cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteFixedCost(cost.id)}
                                                    className="p-2.5 text-[#888888] hover:text-red-500 transition-all cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {fixedCosts.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#888888] uppercase tracking-widest">Fixed Total</span>
                        <span className="text-lg font-black text-white">{fixedCosts.reduce((s, c) => s + c.amount, 0).toLocaleString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
