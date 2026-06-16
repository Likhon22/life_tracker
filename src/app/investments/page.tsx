"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    TrendingUp, Plus, Trash2, ArrowDownCircle, ArrowUpCircle,
    Loader2, ChevronDown, ChevronUp, Landmark, MoreHorizontal,
    X, Briefcase, Bitcoin, BarChart3
} from "lucide-react";
import * as Icons from "lucide-react";
import { ModulePage } from "@/components/ModulePage";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

const CATEGORY_ICONS = [
    "Bitcoin", "Briefcase", "BarChart3", "TrendingUp", "Landmark",
    "Building2", "Store", "Gem", "Coins", "Banknote",
    "PiggyBank", "CircleDollarSign", "HandCoins", "Wallet", "LineChart"
];

type Category = { id: string; name: string; icon: string };
type Transaction = { id: string; type: 'invest' | 'withdraw'; amount: number; date: string; note?: string };
type InvestmentItem = {
    id: string; name: string; categoryId: Category | string; note?: string;
    transactions: Transaction[];
    totalInvested: number; totalWithdrawn: number; activeCapital: number; pnl: number;
};

export default function InvestmentsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [investments, setInvestments] = useState<InvestmentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Add Category
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatIcon, setNewCatIcon] = useState("Bitcoin");

    // Add Investment
    const [showAddInvestment, setShowAddInvestment] = useState(false);
    const [newInvName, setNewInvName] = useState("");
    const [newInvCatId, setNewInvCatId] = useState("");
    const [newInvNote, setNewInvNote] = useState("");

    // Add Transaction
    const [txInvestmentId, setTxInvestmentId] = useState<string | null>(null);
    const [txType, setTxType] = useState<'invest' | 'withdraw'>('invest');
    const [txAmount, setTxAmount] = useState("");
    const [txDate, setTxDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [txNote, setTxNote] = useState("");

    // Expanded cards
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [catRes, invRes] = await Promise.all([
                fetch("/api/investments/categories"),
                fetch("/api/investments")
            ]);
            if (catRes.ok) setCategories(await catRes.json());
            if (invRes.ok) setInvestments(await invRes.json());
        } catch { toast.error("Failed to load data"); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/investments/categories", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCatName, icon: newCatIcon })
            });
            if (res.ok) {
                const cat = await res.json();
                setCategories([...categories, cat]);
                setNewCatName(""); setShowAddCategory(false);
                toast.success("Category added");
            }
        } catch { toast.error("Failed"); }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            const res = await fetch(`/api/investments/categories/${id}`, { method: "DELETE" });
            if (res.ok) {
                setCategories(categories.filter(c => c.id !== id));
                setInvestments(investments.filter(inv => {
                    const catId = typeof inv.categoryId === 'string' ? inv.categoryId : inv.categoryId?.id;
                    return catId !== id;
                }));
                toast.success("Category deleted");
            }
        } catch { toast.error("Failed"); }
    };

    const handleAddInvestment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/investments", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newInvName, categoryId: newInvCatId, note: newInvNote })
            });
            if (res.ok) {
                const inv = await res.json();
                setInvestments([inv, ...investments]);
                setNewInvName(""); setNewInvCatId(""); setNewInvNote(""); setShowAddInvestment(false);
                toast.success("Investment added");
            }
        } catch { toast.error("Failed"); }
    };

    const handleDeleteInvestment = async (id: string) => {
        try {
            const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
            if (res.ok) {
                setInvestments(investments.filter(i => i.id !== id));
                toast.success("Investment deleted");
            }
        } catch { toast.error("Failed"); }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!txInvestmentId) return;
        try {
            const res = await fetch(`/api/investments/${txInvestmentId}/transactions`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: txType, amount: Number(txAmount), date: txDate, note: txNote })
            });
            if (res.ok) {
                await fetchData(); // Refresh totals
                setTxInvestmentId(null); setTxAmount(""); setTxNote("");
                setTxDate(format(new Date(), "yyyy-MM-dd"));
                toast.success(txType === 'invest' ? "Investment recorded" : "Withdrawal recorded");
            }
        } catch { toast.error("Failed"); }
    };

    const handleDeleteTransaction = async (txId: string) => {
        try {
            const res = await fetch(`/api/investments/${txId}/transactions`, { method: "DELETE" });
            if (res.ok) { await fetchData(); toast.success("Transaction removed"); }
        } catch { toast.error("Failed"); }
    };

    // Totals across all investments
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
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard label="Total Invested" value={grandTotalInvested} color="blue" />
                    <SummaryCard label="Total Withdrawn" value={grandTotalWithdrawn} color="emerald" />
                    <SummaryCard label="Active Capital" value={grandActive} color="orange" />
                    <SummaryCard label="P&L" value={grandPnl} color={grandPnl >= 0 ? "emerald" : "red"} showSign />
                </div>

                {/* Category + Add Buttons Row */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                        {categories.map(cat => {
                            const Icon = (Icons as any)[cat.icon] || Briefcase;
                            return (
                                <div key={cat.id} className="group flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-[#ccc]">
                                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                                    {cat.name}
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all cursor-pointer ml-1">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                        {categories.length === 0 && !isLoading && (
                            <span className="text-xs text-[#555]">No categories yet. Add one to start.</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowAddCategory(!showAddCategory)} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer">
                            <Plus className="w-3.5 h-3.5" /> Category
                        </button>
                        <button onClick={() => { setShowAddInvestment(!showAddInvestment); if (!newInvCatId && categories.length) setNewInvCatId(categories[0].id); }} disabled={categories.length === 0} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-600/20">
                            <Plus className="w-3.5 h-3.5" /> Investment
                        </button>
                    </div>
                </div>

                {/* Add Category Form */}
                {showAddCategory && (
                    <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest">New Category</label>
                            <div className="flex gap-3">
                                <input required value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Crypto, Stocks, Business" className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all" />
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_ICONS.map(ic => {
                                    const Ic = (Icons as any)[ic] || Briefcase;
                                    return (
                                        <button key={ic} type="button" onClick={() => setNewCatIcon(ic)} className={cn("p-2.5 rounded-xl border transition-all cursor-pointer", newCatIcon === ic ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/5 text-[#666] hover:text-white")}>
                                            <Ic className="w-4 h-4" />
                                        </button>
                                    );
                                })}
                            </div>
                        </form>
                    </div>
                )}

                {/* Add Investment Form */}
                {showAddInvestment && (
                    <div className="bg-[#191919] border border-blue-500/20 rounded-2xl p-6 animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleAddInvestment} className="space-y-4">
                            <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest">New Investment</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input required value={newInvName} onChange={e => setNewInvName(e.target.value)} placeholder="e.g. Bitcoin, AAPL, Agnos Ltd" className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                                <select value={newInvCatId} onChange={e => setNewInvCatId(e.target.value)} className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 [color-scheme:dark]">
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <input value={newInvNote} onChange={e => setNewInvNote(e.target.value)} placeholder="Note (optional)" className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAddInvestment(false)} className="px-5 py-2 text-xs font-bold text-[#555] hover:text-white cursor-pointer transition-all">Cancel</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all">Create</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Investment Cards */}
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center opacity-20">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p className="text-sm font-bold uppercase tracking-[0.2em]">Loading Portfolio...</p>
                    </div>
                ) : investments.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                        <Landmark className="w-12 h-12 text-[#222] mb-6" />
                        <p className="text-sm font-medium text-[#444] text-center max-w-sm">
                            No investments yet. Add a category, then create your first investment.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {investments.map(inv => {
                            const cat = typeof inv.categoryId === 'string' ? categories.find(c => c.id === inv.categoryId) : inv.categoryId as any;
                            const CatIcon = cat ? ((Icons as any)[cat.icon] || Briefcase) : Briefcase;
                            const isExpanded = expandedId === inv.id;
                            const isAddingTx = txInvestmentId === inv.id;

                            return (
                                <div key={inv.id} className="bg-[#191919] border border-[#2d2d2d] rounded-2xl overflow-hidden transition-all hover:border-white/10">
                                    {/* Card Header */}
                                    <div className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-white/5 rounded-xl">
                                                <CatIcon className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white tracking-tight">{inv.name}</h3>
                                                <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">{cat?.name || "Unknown"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-white tracking-tighter">{inv.activeCapital.toLocaleString()}</div>
                                            <div className={cn("text-[10px] font-bold uppercase tracking-widest", inv.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                                                {inv.pnl >= 0 ? "+" : ""}{inv.pnl.toLocaleString()} P&L
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 border-t border-white/5">
                                        <div className="px-5 py-3 border-r border-white/5">
                                            <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest block">Invested</span>
                                            <span className="text-sm font-bold text-blue-400">{inv.totalInvested.toLocaleString()}</span>
                                        </div>
                                        <div className="px-5 py-3">
                                            <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest block">Withdrawn</span>
                                            <span className="text-sm font-bold text-emerald-400">{inv.totalWithdrawn.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex border-t border-white/5">
                                        <button onClick={() => { setTxInvestmentId(isAddingTx ? null : inv.id); setTxType('invest'); setTxAmount(""); setTxNote(""); setTxDate(format(new Date(), "yyyy-MM-dd")); }} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-bold text-[#888] hover:text-emerald-400 hover:bg-emerald-500/5 transition-all cursor-pointer">
                                            <ArrowDownCircle className="w-3.5 h-3.5" /> Add Investment
                                        </button>
                                        <div className="w-px bg-white/5" />
                                        <button onClick={() => { setTxInvestmentId(isAddingTx ? null : inv.id); setTxType('withdraw'); setTxAmount(""); setTxNote(""); setTxDate(format(new Date(), "yyyy-MM-dd")); }} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-bold text-[#888] hover:text-orange-400 hover:bg-orange-500/5 transition-all cursor-pointer">
                                            <ArrowUpCircle className="w-3.5 h-3.5" /> Withdraw
                                        </button>
                                        <div className="w-px bg-white/5" />
                                        <button onClick={() => setExpandedId(isExpanded ? null : inv.id)} className="px-4 flex items-center justify-center py-3 text-[10px] font-bold text-[#888] hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </button>
                                        <div className="w-px bg-white/5" />
                                        <button onClick={() => handleDeleteInvestment(inv.id)} className="px-4 flex items-center justify-center py-3 text-[10px] font-bold text-[#888] hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Add Transaction Form */}
                                    {isAddingTx && (
                                        <div className={cn("border-t p-4 animate-in slide-in-from-top-2 duration-200", txType === 'invest' ? "border-emerald-500/20 bg-emerald-500/5" : "border-orange-500/20 bg-orange-500/5")}>
                                            <form onSubmit={handleAddTransaction} className="space-y-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {txType === 'invest' ? <ArrowDownCircle className="w-4 h-4 text-emerald-400" /> : <ArrowUpCircle className="w-4 h-4 text-orange-400" />}
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", txType === 'invest' ? "text-emerald-400" : "text-orange-400")}>
                                                        {txType === 'invest' ? 'Record Investment' : 'Record Withdrawal'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-[1fr_auto] gap-3">
                                                    <input required type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="Amount" className="bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
                                                    <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                                                </div>
                                                <input value={txNote} onChange={e => setTxNote(e.target.value)} placeholder="Note (optional)" className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500" />
                                                <div className="flex gap-2">
                                                    <button type="submit" className={cn("flex-1 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all", txType === 'invest' ? "bg-emerald-600 hover:bg-emerald-500" : "bg-orange-600 hover:bg-orange-500")}>
                                                        {txType === 'invest' ? 'Record Investment' : 'Record Withdrawal'}
                                                    </button>
                                                    <button type="button" onClick={() => setTxInvestmentId(null)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all">Cancel</button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {/* Transaction History */}
                                    {isExpanded && inv.transactions.length > 0 && (
                                        <div className="border-t border-white/5 max-h-[300px] overflow-y-auto no-scrollbar">
                                            {inv.transactions.map(tx => (
                                                <div key={tx.id} className="flex items-center justify-between px-5 py-3 border-b border-white/[0.03] last:border-0 group/tx hover:bg-white/[0.02]">
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
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-[#555]">{tx.date}</span>
                                                        <button onClick={() => handleDeleteTransaction(tx.id)} className="opacity-0 group-hover/tx:opacity-100 p-1 text-red-500 hover:text-red-400 cursor-pointer transition-all">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {isExpanded && inv.transactions.length === 0 && (
                                        <div className="border-t border-white/5 py-8 text-center">
                                            <p className="text-xs text-[#444]">No transactions yet</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </ModulePage>
    );
}

function SummaryCard({ label, value, color, showSign }: { label: string; value: number; color: string; showSign?: boolean }) {
    const colorMap: any = {
        blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
        emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
        orange: "text-orange-400 border-orange-500/20 bg-orange-500/5",
        red: "text-red-400 border-red-500/20 bg-red-500/5",
    };
    return (
        <div className={cn("rounded-2xl border p-4 flex flex-col gap-1", colorMap[color])}>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{label}</span>
            <span className="text-xl font-black tracking-tighter">
                {showSign && value > 0 ? "+" : ""}{value.toLocaleString()}
            </span>
        </div>
    );
}
