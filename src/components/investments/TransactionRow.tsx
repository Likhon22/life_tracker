"use client";

import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Edit2, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { IconButton } from "@/components/ui/IconButton";
import { Transaction } from "./types";

export function TransactionRow({
    tx,
    onSave,
    onDelete,
}: {
    tx: Transaction;
    onSave: (txId: string, type: 'invest' | 'withdraw', amount: number, date: string, note?: string) => void;
    onDelete: (txId: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [amount, setAmount] = useState(tx.amount.toString());
    const [date, setDate] = useState(tx.date);
    const [note, setNote] = useState(tx.note || "");
    const [type, setType] = useState<'invest' | 'withdraw'>(tx.type);

    const startEdit = () => {
        setAmount(tx.amount.toString());
        setDate(tx.date);
        setNote(tx.note || "");
        setType(tx.type);
        setIsEditing(true);
    };

    const save = () => {
        onSave(tx.id, type, Number(amount), date, note);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-4 bg-white/[0.02] space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-[32px] px-2.5 py-1.5" />
                    <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-[32px] px-2.5 py-1.5" />
                    <Select label="Type" value={type} onChange={(e) => setType(e.target.value as 'invest' | 'withdraw')} className="h-[32px] px-2.5 py-1.5">
                        <option value="invest">Invest</option>
                        <option value="withdraw">Withdraw</option>
                    </Select>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex-1">
                        <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} className="h-[32px] px-2.5 py-1.5" />
                    </div>
                    <div className="flex gap-1.5 mt-5">
                        <IconButton tone="success" onClick={save}><Check className="w-3.5 h-3.5" /></IconButton>
                        <IconButton onClick={() => setIsEditing(false)}><X className="w-3.5 h-3.5" /></IconButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 group/tx hover:bg-white/[0.02]">
            <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-lg", tx.type === 'invest' ? "bg-emerald-500/10" : "bg-orange-500/10")}>
                    {tx.type === 'invest' ? <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowUpCircle className="w-3.5 h-3.5 text-orange-400" />}
                </div>
                <div>
                    <span className={cn("text-xs font-bold", tx.type === 'invest' ? "text-emerald-400" : "text-orange-400")}>
                        {tx.type === 'invest' ? '+' : '-'}{tx.amount.toLocaleString()}
                    </span>
                    {tx.note && <span className="text-[10px] text-[#555] ml-2">{tx.note}</span>}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#555]">{tx.date}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover/tx:opacity-100 transition-opacity">
                    <IconButton tone="primary" className="p-1" onClick={startEdit}><Edit2 className="w-3.5 h-3.5" /></IconButton>
                    <IconButton tone="danger" className="p-1" onClick={() => onDelete(tx.id)}><Trash2 className="w-3.5 h-3.5" /></IconButton>
                </div>
            </div>
        </div>
    );
}
