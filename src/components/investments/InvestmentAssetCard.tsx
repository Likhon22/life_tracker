"use client";

import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Edit2, Trash2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { confirmToast } from "@/lib/confirmToast";
import { TransactionRow } from "./TransactionRow";
import { InvestmentItem } from "./types";

export function InvestmentAssetCard({
    investment,
    onDelete,
    onUpdate,
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction,
}: {
    investment: InvestmentItem;
    onDelete: (id: string) => void;
    onUpdate: (id: string, name: string, note: string) => void;
    onAddTransaction: (investmentId: string, type: 'invest' | 'withdraw', amount: number, date: string, note?: string) => void;
    onUpdateTransaction: (txId: string, type: 'invest' | 'withdraw', amount: number, date: string, note?: string) => void;
    onDeleteTransaction: (txId: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(investment.name);
    const [editNote, setEditNote] = useState(investment.note || "");

    const [isAddingTx, setIsAddingTx] = useState(false);
    const [txType, setTxType] = useState<'invest' | 'withdraw'>('invest');
    const [txAmount, setTxAmount] = useState("");
    const [txDate, setTxDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [txNote, setTxNote] = useState("");

    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    const openTxForm = (type: 'invest' | 'withdraw') => {
        setIsAddingTx((prev) => !prev || txType !== type);
        setTxType(type);
        setTxAmount("");
        setTxNote("");
        setTxDate(format(new Date(), "yyyy-MM-dd"));
    };

    const submitTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        onAddTransaction(investment.id, txType, Number(txAmount), txDate, txNote);
        setIsAddingTx(false);
        setTxAmount("");
        setTxNote("");
    };

    const startEdit = () => {
        setEditName(investment.name);
        setEditNote(investment.note || "");
        setIsEditing(true);
    };

    const saveEdit = () => {
        onUpdate(investment.id, editName, editNote);
        setIsEditing(false);
    };

    const confirmDelete = () => {
        confirmToast({ message: "Delete this asset?", onConfirm: () => onDelete(investment.id) });
    };

    return (
        <div className="bg-[#1c1c1c] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
            {isEditing ? (
                <div className="p-4 space-y-3 bg-blue-500/5 border-b border-blue-500/20 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Edit Asset</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} className="h-[34px] px-3 py-2" />
                        <Input label="Note" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Optional note..." className="h-[34px] px-3 py-2" />
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}><Check className="w-3 h-3 inline mr-1" /> Save</Button>
                        <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}><X className="w-3 h-3 inline mr-1" /> Cancel</Button>
                    </div>
                </div>
            ) : (
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{investment.name}</span>
                            {investment.note && <span className="text-[10px] text-[#555] italic">({investment.note})</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                            <span className="text-[10px] text-[#666]">Invested: <strong className="text-[#888]">{investment.totalInvested.toLocaleString()}</strong></span>
                            <span className="text-[10px] text-[#666]">Withdrawn: <strong className="text-[#888]">{investment.totalWithdrawn.toLocaleString()}</strong></span>
                            {investment.firstEntryDate && (
                                <span className="text-[10px] text-[#555]">Entry: <strong className="text-[#777]">{investment.firstEntryDate}</strong></span>
                            )}
                            {investment.latestEntryDate && investment.latestEntryDate !== investment.firstEntryDate && (
                                <span className="text-[10px] text-[#555]">Latest: <strong className="text-[#777]">{investment.latestEntryDate}</strong></span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-right">
                            <div className="text-sm font-black text-white">{investment.activeCapital.toLocaleString()}</div>
                            <div className={cn("text-[9px] font-bold uppercase tracking-wider", investment.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                                {investment.pnl >= 0 ? "+" : ""}{investment.pnl.toLocaleString()} P&L
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openTxForm('invest')}
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                                <ArrowDownCircle className="w-3 h-3" /> Invest
                            </button>
                            <button
                                onClick={() => openTxForm('withdraw')}
                                className="px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                                <ArrowUpCircle className="w-3 h-3" /> Withdraw
                            </button>
                            <IconButton tone="primary" onClick={startEdit}>
                                <Edit2 className="w-3.5 h-3.5" />
                            </IconButton>
                            <IconButton onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}>
                                {isHistoryExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </IconButton>
                            <IconButton tone="danger" onClick={confirmDelete}>
                                <Trash2 className="w-3.5 h-3.5" />
                            </IconButton>
                        </div>
                    </div>
                </div>
            )}

            {isAddingTx && (
                <div className={cn("border-t p-4 animate-in slide-in-from-top-2 duration-200", txType === 'invest' ? "border-emerald-500/20 bg-emerald-500/5" : "border-orange-500/20 bg-orange-500/5")}>
                    <form onSubmit={submitTransaction} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                            <Input label="Amount" required type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="Amount" className="h-[38px]" />
                            <Input label="Date" type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="h-[38px]" />
                        </div>
                        <Input label="Note / Description" value={txNote} onChange={(e) => setTxNote(e.target.value)} placeholder="Re-investment, profit share, dividend, etc." className="h-[38px]" />
                        <div className="flex gap-2">
                            <button type="submit" className={cn("flex-1 text-white py-2 rounded-lg text-xs font-bold cursor-pointer transition-all", txType === 'invest' ? "bg-emerald-600 hover:bg-emerald-500" : "bg-orange-600 hover:bg-orange-500")}>
                                {txType === 'invest' ? 'Record Investment' : 'Record Withdrawal'}
                            </button>
                            <Button type="button" variant="secondary" onClick={() => setIsAddingTx(false)}>Cancel</Button>
                        </div>
                    </form>
                </div>
            )}

            {isHistoryExpanded && (
                <div className="border-t border-white/5 bg-black/10">
                    <div className="px-4 py-2 bg-white/[0.01] border-b border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-black text-[#555] uppercase tracking-widest">Transaction History</span>
                        <span className="text-[9px] text-[#555]">{investment.transactions.length} entries</span>
                    </div>
                    {investment.transactions.length === 0 ? (
                        <p className="p-6 text-xs text-[#444] text-center">No transactions recorded yet.</p>
                    ) : (
                        <div className="divide-y divide-white/[0.03] max-h-[300px] overflow-y-auto no-scrollbar">
                            {investment.transactions.map((tx) => (
                                <TransactionRow key={tx.id} tx={tx} onSave={onUpdateTransaction} onDelete={onDeleteTransaction} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
