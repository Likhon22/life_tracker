"use client";

import { useFinance, Expense } from "@/components/FinanceProvider";
import { format, parseISO } from "date-fns";
import * as Icons from "lucide-react";
import { Trash2, Edit2, Calendar, MoreHorizontal, Check, X } from "lucide-react";
import { useState } from "react";
import { cn, evaluateMath } from "@/lib/utils";

export function RecentExpenses() {
    const { expenses, deleteExpense, updateExpense, categories, isFutureMonth } = useFinance();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState("");
    const [editNote, setEditNote] = useState("");

    const handleSave = async (id: string) => {
        await updateExpense(id, {
            amount: evaluateMath(editAmount),
            note: editNote
        });
        setEditingId(null);
    };

    const startEdit = (exp: Expense) => {
        setEditingId(exp.id);
        setEditAmount(exp.amount.toString());
        setEditNote(exp.note || "");
    };

    return (
        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-500/10 rounded-xl">
                        <Calendar className="w-5 h-5 text-orange-500" />
                    </div>
                    <h2 className="font-bold text-lg text-white tracking-tight">Recent Expenses</h2>
                </div>
            </div>

            <div className="space-y-6 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
                {expenses.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-[#444444] border-2 border-dashed border-white/5 rounded-3xl">
                        <MoreHorizontal className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-sm font-medium">No expenses this month yet</span>
                    </div>
                ) : (
                    Object.entries(
                        expenses.reduce((groups: { [key: string]: Expense[] }, expense) => {
                            const date = expense.date;
                            if (!groups[date]) groups[date] = [];
                            groups[date].push(expense);
                            return groups;
                        }, {})
                    )
                        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)) // Sort days descending
                        .map(([date, items]) => (
                            <div key={date} className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="h-px flex-1 bg-white/5" />
                                    <span className="text-[10px] font-black text-[#888888] uppercase tracking-[0.2em] whitespace-nowrap">
                                        {format(parseISO(date), "dd MMMM yyyy")}
                                    </span>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                                <div className="space-y-3">
                                    {items.map((exp) => {
                                        const cat = typeof exp.categoryId === 'string'
                                            ? categories.find(c => c.id === exp.categoryId)
                                            : exp.categoryId;
                                        const IconComponent = cat ? ((Icons as any)[cat.icon] || Icons.HelpCircle) : Icons.HelpCircle;
                                        const isEditing = editingId === exp.id;

                                        return (
                                            <div key={exp.id} className="group bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.06] transition-all relative overflow-hidden">
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                                                <IconComponent className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-sm font-bold text-white">{cat?.name || "Unknown"}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                value={editAmount}
                                                                onChange={(e) => setEditAmount(e.target.value)}
                                                                className="bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                                                placeholder="Amount"
                                                                onKeyDown={(e) => e.key === 'Enter' && handleSave(exp.id)}
                                                            />
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleSave(exp.id)} className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl p-2 transition-all cursor-pointer">
                                                                    <Check className="w-4 h-4 mx-auto" />
                                                                </button>
                                                                <button onClick={() => setEditingId(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl p-2 transition-all cursor-pointer">
                                                                    <X className="w-4 h-4 mx-auto" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={editNote}
                                                            onChange={(e) => setEditNote(e.target.value)}
                                                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                                                            placeholder="Add note..."
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-white/5 rounded-xl text-[#888888] group-hover:text-blue-500 transition-colors">
                                                                <IconComponent className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-sm font-bold text-white tracking-tight">{cat?.name || "Unknown"}</span>
                                                                {exp.note && <span className="text-[11px] text-[#888888] italic truncate max-w-[150px]">{exp.note}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="text-lg font-black text-white tracking-tighter">{exp.amount.toLocaleString()}</div>
                                                            {!isFutureMonth && (
                                                                <div className="flex items-center gap-1 transition-all">
                                                                    <button onClick={() => startEdit(exp)} className="p-2 text-[#777777] hover:text-blue-500 transition-all cursor-pointer">
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button onClick={() => deleteExpense(exp.id)} className="p-2 text-[#777777] hover:text-red-500 transition-all cursor-pointer">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                )}
            </div>
        </div>
    );
}
