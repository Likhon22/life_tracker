"use client";

import { useCigarettes, type CigaretteLog, type CigaretteBrand } from "./CigaretteProvider";
import { format, parseISO } from "date-fns";
import { Trash2, Edit2, Calendar, MoreHorizontal, Check, X, User, Users } from "lucide-react";
import { useState } from "react";
import { cn, evaluateMath } from "@/lib/utils";

function brandOf(log: CigaretteLog): CigaretteBrand | undefined {
    return typeof log.brandId === "string" ? undefined : log.brandId;
}

export function LogList() {
    const { logs, deleteLog, updateLog } = useCigarettes();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editQuantity, setEditQuantity] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editIsSelf, setEditIsSelf] = useState(true);

    const handleSave = async (id: string) => {
        await updateLog(id, {
            quantity: parseInt(editQuantity, 10) || 1,
            amount: evaluateMath(editAmount),
            isSelf: editIsSelf,
        });
        setEditingId(null);
    };

    const startEdit = (log: CigaretteLog) => {
        setEditingId(log.id);
        setEditQuantity(log.quantity.toString());
        setEditAmount(log.amount.toString());
        setEditIsSelf(log.isSelf);
    };

    return (
        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 rounded-xl">
                    <Calendar className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="font-bold text-lg text-white tracking-tight">Recent Logs</h2>
            </div>

            <div className="space-y-6 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
                {logs.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-[#444444] border-2 border-dashed border-white/5 rounded-3xl">
                        <MoreHorizontal className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-sm font-medium">No logs this month yet</span>
                    </div>
                ) : (
                    Object.entries(
                        logs.reduce((groups: { [key: string]: CigaretteLog[] }, log) => {
                            if (!groups[log.date]) groups[log.date] = [];
                            groups[log.date].push(log);
                            return groups;
                        }, {})
                    )
                        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
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
                                    {items.map((log) => {
                                        const brand = brandOf(log);
                                        const isEditing = editingId === log.id;

                                        return (
                                            <div key={log.id} className="group bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.06] transition-all">
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <span className="text-sm font-bold text-white">{brand?.name || "Unknown"}</span>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input
                                                                type="number"
                                                                value={editQuantity}
                                                                onChange={(e) => setEditQuantity(e.target.value)}
                                                                className="bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                                                placeholder="Quantity"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={editAmount}
                                                                onChange={(e) => setEditAmount(e.target.value)}
                                                                className="bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                                                placeholder="Amount"
                                                                onKeyDown={(e) => e.key === 'Enter' && handleSave(log.id)}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-1.5 bg-white/5 rounded-xl p-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditIsSelf(true)}
                                                                className={cn(
                                                                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer",
                                                                    editIsSelf ? "bg-blue-600 text-white" : "text-[#888888] hover:text-white"
                                                                )}
                                                            >
                                                                <User className="w-3.5 h-3.5" /> Myself
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditIsSelf(false)}
                                                                className={cn(
                                                                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer",
                                                                    !editIsSelf ? "bg-orange-600 text-white" : "text-[#888888] hover:text-white"
                                                                )}
                                                            >
                                                                <Users className="w-3.5 h-3.5" /> Friend
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleSave(log.id)} className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl p-2 transition-all cursor-pointer">
                                                                <Check className="w-4 h-4 mx-auto" />
                                                            </button>
                                                            <button onClick={() => setEditingId(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl p-2 transition-all cursor-pointer">
                                                                <X className="w-4 h-4 mx-auto" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "p-3 rounded-xl transition-colors",
                                                                log.isSelf ? "bg-white/5 text-[#888888] group-hover:text-blue-500" : "bg-orange-500/10 text-orange-500"
                                                            )}>
                                                                {log.isSelf ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-sm font-bold text-white tracking-tight">
                                                                    {brand?.name || "Unknown"} &times; {log.quantity}
                                                                </span>
                                                                <span className="text-[11px] text-[#888888]">
                                                                    {log.isSelf ? "Myself" : "Friend"}{log.note ? ` · ${log.note}` : ""}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="text-lg font-black text-white tracking-tighter">{log.amount.toLocaleString()}</div>
                                                            <div className="flex items-center gap-1 transition-all">
                                                                <button onClick={() => startEdit(log)} className="p-2 text-[#777777] hover:text-blue-500 transition-all cursor-pointer">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button onClick={() => deleteLog(log.id)} className="p-2 text-[#777777] hover:text-red-500 transition-all cursor-pointer">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
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
