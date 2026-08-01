"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { Briefcase, Folder, FolderOpen, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { confirmToast } from "@/lib/confirmToast";
import { InvestmentAssetCard } from "./InvestmentAssetCard";
import { Category, InvestmentItem } from "./types";

export function CategoryFolder({
    category,
    investments,
    isExpanded,
    onToggleExpand,
    onDeleteCategory,
    onAddInvestment,
    onDeleteInvestment,
    onUpdateInvestment,
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction,
}: {
    category: Category;
    investments: InvestmentItem[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onDeleteCategory: (id: string) => void;
    onAddInvestment: (name: string, categoryId: string, note?: string) => void;
    onDeleteInvestment: (id: string) => void;
    onUpdateInvestment: (id: string, name: string, note: string) => void;
    onAddTransaction: (investmentId: string, type: 'invest' | 'withdraw', amount: number, date: string, note?: string) => void;
    onUpdateTransaction: (txId: string, type: 'invest' | 'withdraw', amount: number, date: string, note?: string) => void;
    onDeleteTransaction: (txId: string) => void;
}) {
    const [newName, setNewName] = useState("");
    const [newNote, setNewNote] = useState("");

    const CatIcon = (Icons as any)[category.icon] || Briefcase;

    const catInvested = investments.reduce((sum, i) => sum + i.totalInvested, 0);
    const catWithdrawn = investments.reduce((sum, i) => sum + i.totalWithdrawn, 0);
    const catActive = catInvested - catWithdrawn;
    const catPnl = catWithdrawn - catInvested;

    const handleAddInvestment = () => {
        const name = newName.trim();
        if (!name) return;
        onAddInvestment(name, category.id, newNote);
        setNewName("");
        setNewNote("");
    };

    const handleDeleteCategory = () => {
        const hasTransactions = investments.some((inv) => inv.transactions && inv.transactions.length > 0);
        if (hasTransactions) {
            confirmToast({
                message: "Cannot delete this folder.",
                description: "It contains transaction history. Delete the transactions first.",
                confirmLabel: "OK",
                onConfirm: () => {},
            });
            return;
        }
        confirmToast({
            message: "Delete this category?",
            description: "This will also remove any empty assets inside it.",
            onConfirm: () => onDeleteCategory(category.id),
        });
    };

    return (
        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl overflow-hidden transition-all duration-300">
            <div
                onClick={onToggleExpand}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl text-blue-400">
                        {isExpanded ? <FolderOpen className="w-6 h-6 text-orange-400 animate-pulse" /> : <Folder className="w-6 h-6 text-blue-400" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <CatIcon className="w-4 h-4 text-[#888]" />
                            <h3 className="text-base font-bold text-white tracking-tight">{category.name}</h3>
                        </div>
                        <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest mt-0.5">
                            {investments.length} {investments.length === 1 ? 'asset' : 'assets'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest block">Active Capital</span>
                        <span className="text-sm font-black text-white">{catActive.toLocaleString()}</span>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest block">P&L</span>
                        <span className={cn("text-sm font-black", catPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {catPnl >= 0 ? "+" : ""}{catPnl.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <IconButton tone="danger" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(); }}>
                            <Trash2 className="w-4 h-4" />
                        </IconButton>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#888]" /> : <ChevronDown className="w-4 h-4 text-[#888]" />}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 px-5 pb-4 sm:hidden border-b border-white/5">
                <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest block">Active</span>
                    <span className="text-xs font-bold text-white">{catActive.toLocaleString()}</span>
                </div>
                <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest block">P&L</span>
                    <span className={cn("text-xs font-bold", catPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {catPnl >= 0 ? "+" : ""}{catPnl.toLocaleString()}
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-white/5 bg-black/20 p-5 space-y-6 animate-in slide-in-from-top-3 duration-200">
                    <div className="flex flex-col sm:flex-row gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        <div className="flex-1">
                            <Input label="Asset Name" placeholder="e.g. Bitcoin, AAPL, Agnos Ltd" value={newName} onChange={(e) => setNewName(e.target.value)} className="text-xs px-3 py-2" />
                        </div>
                        <div className="flex-1">
                            <Input label="Optional Note" placeholder="Investment details..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="text-xs px-3 py-2" />
                        </div>
                        <div className="flex items-end">
                            <Button type="button" size="sm" onClick={handleAddInvestment} className="w-full sm:w-auto h-[32px] sm:h-auto">
                                Add Asset
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {investments.map((inv) => (
                            <InvestmentAssetCard
                                key={inv.id}
                                investment={inv}
                                onDelete={onDeleteInvestment}
                                onUpdate={onUpdateInvestment}
                                onAddTransaction={onAddTransaction}
                                onUpdateTransaction={onUpdateTransaction}
                                onDeleteTransaction={onDeleteTransaction}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
