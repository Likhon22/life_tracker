"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    TrendingUp, Plus, Trash2, ArrowDownCircle, ArrowUpCircle,
    Loader2, ChevronDown, ChevronUp, Landmark, Edit2,
    X, Briefcase, Bitcoin, BarChart3, Check, Folder, FolderOpen
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
    firstEntryDate: string | null; latestEntryDate: string | null;
};

export default function InvestmentsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [investments, setInvestments] = useState<InvestmentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Navigation and Accordion States
    const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
    const [expandedInvestmentId, setExpandedInvestmentId] = useState<string | null>(null);

    // Add Category Form
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatIcon, setNewCatIcon] = useState("Bitcoin");

    // Add Investment Inline Form (per category)
    const [newInvNames, setNewInvNames] = useState<Record<string, string>>({});
    const [newInvNotes, setNewInvNotes] = useState<Record<string, string>>({});

    // Add Transaction Form
    const [txInvestmentId, setTxInvestmentId] = useState<string | null>(null);
    const [txType, setTxType] = useState<'invest' | 'withdraw'>('invest');
    const [txAmount, setTxAmount] = useState("");
    const [txDate, setTxDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [txNote, setTxNote] = useState("");

    // Edit Transaction Inline Form
    const [editingTxId, setEditingTxId] = useState<string | null>(null);
    const [editTxAmount, setEditTxAmount] = useState("");
    const [editTxDate, setEditTxDate] = useState("");
    const [editTxNote, setEditTxNote] = useState("");
    const [editTxType, setEditTxType] = useState<'invest' | 'withdraw'>('invest');

    // Edit Investment Asset
    const [editingInvId, setEditingInvId] = useState<string | null>(null);
    const [editInvName, setEditInvName] = useState("");
    const [editInvNote, setEditInvNote] = useState("");

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

    useEffect(() => {
        fetchData();
    }, []);

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
                toast.success("Category folder created");
                await fetchData(); // Fetch default "General" asset
            }
        } catch { toast.error("Failed"); }
    };

    const handleDeleteCategory = async (id: string) => {
        // Pre-check on the frontend
        const folderInvestments = investments.filter(inv => {
            const catId = typeof inv.categoryId === 'string' ? inv.categoryId : inv.categoryId?.id;
            return catId === id;
        });
        const hasTransactions = folderInvestments.some(inv => inv.transactions && inv.transactions.length > 0);

        if (hasTransactions) {
            toast.error("Cannot delete folder because it contains transaction history. Delete the transactions first.");
            return;
        }

        if (!confirm("Are you sure? This will delete this category and any empty assets inside it.")) return;
        try {
            const res = await fetch(`/api/investments/categories/${id}`, { method: "DELETE" });
            const data = await res.json();
            
            if (res.ok) {
                setCategories(categories.filter(c => c.id !== id));
                setInvestments(investments.filter(inv => {
                    const catId = typeof inv.categoryId === 'string' ? inv.categoryId : inv.categoryId?.id;
                    return catId !== id;
                }));
                if (expandedCategoryId === id) setExpandedCategoryId(null);
                toast.success("Category folder deleted");
            } else {
                toast.error(data.error || "Failed to delete category");
            }
        } catch { toast.error("Failed to delete category"); }
    };

    const handleAddInvestment = async (catId: string) => {
        const name = newInvNames[catId]?.trim();
        if (!name) return;

        try {
            const res = await fetch("/api/investments", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, categoryId: catId, note: newInvNotes[catId] || "" })
            });
            if (res.ok) {
                const inv = await res.json();
                setInvestments([inv, ...investments]);
                setNewInvNames({ ...newInvNames, [catId]: "" });
                setNewInvNotes({ ...newInvNotes, [catId]: "" });
                toast.success("Asset added under category");
            }
        } catch { toast.error("Failed to add asset"); }
    };

    const handleDeleteInvestment = async (id: string) => {
        if (!confirm("Are you sure you want to delete this asset?")) return;
        try {
            const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
            if (res.ok) {
                setInvestments(investments.filter(i => i.id !== id));
                toast.success("Asset deleted");
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
                await fetchData();
                setTxInvestmentId(null); setTxAmount(""); setTxNote("");
                setTxDate(format(new Date(), "yyyy-MM-dd"));
                toast.success("Transaction recorded");
            }
        } catch { toast.error("Failed to add transaction"); }
    };

    const handleDeleteTransaction = async (txId: string) => {
        try {
            const res = await fetch(`/api/investments/${txId}/transactions`, { method: "DELETE" });
            if (res.ok) { await fetchData(); toast.success("Transaction removed"); }
        } catch { toast.error("Failed"); }
    };

    const startEditTransaction = (tx: Transaction) => {
        setEditingTxId(tx.id);
        setEditTxAmount(tx.amount.toString());
        setEditTxDate(tx.date);
        setEditTxNote(tx.note || "");
        setEditTxType(tx.type);
    };

    const handleSaveTransaction = async (txId: string) => {
        try {
            const res = await fetch(`/api/investments/${txId}/transactions`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: editTxType,
                    amount: Number(editTxAmount),
                    date: editTxDate,
                    note: editTxNote
                })
            });
            if (res.ok) {
                await fetchData();
                setEditingTxId(null);
                toast.success("Transaction updated");
            }
        } catch { toast.error("Failed to update transaction"); }
    };

    const startEditInvestment = (inv: InvestmentItem) => {
        setEditingInvId(inv.id);
        setEditInvName(inv.name);
        setEditInvNote(inv.note || "");
    };

    const handleSaveInvestment = async (id: string) => {
        try {
            const res = await fetch(`/api/investments/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editInvName, note: editInvNote })
            });
            if (res.ok) {
                await fetchData();
                setEditingInvId(null);
                toast.success("Asset updated");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to update");
            }
        } catch { toast.error("Failed to update asset"); }
    };

    // Global Grand Totals
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

                {/* Control Actions */}
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-[#888888] uppercase tracking-wider">Asset Folders</h2>
                    <button onClick={() => setShowAddCategory(!showAddCategory)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-600/20">
                        <Plus className="w-3.5 h-3.5" /> Create Category Folder
                    </button>
                </div>

                {/* Add Category Form */}
                {showAddCategory && (
                    <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest">New Category Folder</label>
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

                {/* Category Folders Grid */}
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
                        {categories.map(cat => {
                            const CatIcon = (Icons as any)[cat.icon] || Briefcase;
                            const folderInvestments = investments.filter(inv => {
                                const catId = typeof inv.categoryId === 'string' ? inv.categoryId : inv.categoryId?.id;
                                return catId === cat.id;
                            });

                            // Calculate Category Folder Totals
                            const catInvested = folderInvestments.reduce((sum, i) => sum + i.totalInvested, 0);
                            const catWithdrawn = folderInvestments.reduce((sum, i) => sum + i.totalWithdrawn, 0);
                            const catActive = catInvested - catWithdrawn;
                            const catPnl = catWithdrawn - catInvested;

                            const isFolderExpanded = expandedCategoryId === cat.id;

                            return (
                                <div key={cat.id} className="bg-[#191919] border border-[#2d2d2d] rounded-2xl overflow-hidden transition-all duration-300">
                                    {/* Folder Header Row */}
                                    <div
                                        onClick={() => setExpandedCategoryId(isFolderExpanded ? null : cat.id)}
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/5 rounded-xl text-blue-400">
                                                {isFolderExpanded ? <FolderOpen className="w-6 h-6 text-orange-400 animate-pulse" /> : <Folder className="w-6 h-6 text-blue-400" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CatIcon className="w-4 h-4 text-[#888]" />
                                                    <h3 className="text-base font-bold text-white tracking-tight">{cat.name}</h3>
                                                </div>
                                                <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest mt-0.5">
                                                    {folderInvestments.length} {folderInvestments.length === 1 ? 'asset' : 'assets'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Folder Totals Summary */}
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
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                                    className="p-2 text-[#444] hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {isFolderExpanded ? <ChevronUp className="w-4 h-4 text-[#888]" /> : <ChevronDown className="w-4 h-4 text-[#888]" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile totals display inside collapsed header */}
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

                                    {/* Expanded Folder Content */}
                                    {isFolderExpanded && (
                                        <div className="border-t border-white/5 bg-black/20 p-5 space-y-6 animate-in slide-in-from-top-3 duration-200">
                                            {/* Sub-form: Add asset under category */}
                                            <div className="flex flex-col sm:flex-row gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[9px] font-black text-[#666] uppercase tracking-widest block pl-1">Asset Name</label>
                                                    <input
                                                        placeholder="e.g. Bitcoin, AAPL, Agnos Ltd"
                                                        value={newInvNames[cat.id] || ""}
                                                        onChange={e => setNewInvNames({ ...newInvNames, [cat.id]: e.target.value })}
                                                        className="w-full bg-[#111] border border-white/5 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[9px] font-black text-[#666] uppercase tracking-widest block pl-1">Optional Note</label>
                                                    <input
                                                        placeholder="Investment details..."
                                                        value={newInvNotes[cat.id] || ""}
                                                        onChange={e => setNewInvNotes({ ...newInvNotes, [cat.id]: e.target.value })}
                                                        className="w-full bg-[#111] border border-white/5 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddInvestment(cat.id)}
                                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer h-[32px] sm:h-auto"
                                                    >
                                                        Add Asset
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Investment Assets list inside Category */}
                                            <div className="grid grid-cols-1 gap-4">
                                                {folderInvestments.map(inv => {
                                                    const isAddingTx = txInvestmentId === inv.id;
                                                    const isHistoryExpanded = expandedInvestmentId === inv.id;
                                                    const isEditingInv = editingInvId === inv.id;

                                                    return (
                                                        <div key={inv.id} className="bg-[#1c1c1c] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
                                                            {/* Asset Details Header */}
                                                            {isEditingInv ? (
                                                                <div className="p-4 space-y-3 bg-blue-500/5 border-b border-blue-500/20 animate-in fade-in duration-200">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                                                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Edit Asset</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        <div className="flex flex-col gap-1">
                                                                            <label className="text-[8px] font-black text-[#666] uppercase tracking-widest pl-1">Name</label>
                                                                            <input value={editInvName} onChange={e => setEditInvName(e.target.value)} className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 h-[34px]" />
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <label className="text-[8px] font-black text-[#666] uppercase tracking-widest pl-1">Note</label>
                                                                            <input value={editInvNote} onChange={e => setEditInvNote(e.target.value)} placeholder="Optional note..." className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 h-[34px]" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => handleSaveInvestment(inv.id)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1">
                                                                            <Check className="w-3 h-3" /> Save
                                                                        </button>
                                                                        <button onClick={() => setEditingInvId(null)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1">
                                                                            <X className="w-3 h-3" /> Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-sm text-white">{inv.name}</span>
                                                                        {inv.note && <span className="text-[10px] text-[#555] italic">({inv.note})</span>}
                                                                    </div>
                                                                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                                                                        <span className="text-[10px] text-[#666]">Invested: <strong className="text-[#888]">{inv.totalInvested.toLocaleString()}</strong></span>
                                                                        <span className="text-[10px] text-[#666]">Withdrawn: <strong className="text-[#888]">{inv.totalWithdrawn.toLocaleString()}</strong></span>
                                                                        {inv.firstEntryDate && (
                                                                            <span className="text-[10px] text-[#555]">Entry: <strong className="text-[#777]">{inv.firstEntryDate}</strong></span>
                                                                        )}
                                                                        {inv.latestEntryDate && inv.latestEntryDate !== inv.firstEntryDate && (
                                                                            <span className="text-[10px] text-[#555]">Latest: <strong className="text-[#777]">{inv.latestEntryDate}</strong></span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between sm:justify-end gap-6">
                                                                    <div className="text-right">
                                                                        <div className="text-sm font-black text-white">{inv.activeCapital.toLocaleString()}</div>
                                                                        <div className={cn("text-[9px] font-bold uppercase tracking-wider", inv.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                                                                            {inv.pnl >= 0 ? "+" : ""}{inv.pnl.toLocaleString()} P&L
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => { setTxInvestmentId(isAddingTx ? null : inv.id); setTxType('invest'); setTxAmount(""); setTxNote(""); setTxDate(format(new Date(), "yyyy-MM-dd")); }}
                                                                            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                                                        >
                                                                            <ArrowDownCircle className="w-3 h-3" /> Invest
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setTxInvestmentId(isAddingTx ? null : inv.id); setTxType('withdraw'); setTxAmount(""); setTxNote(""); setTxDate(format(new Date(), "yyyy-MM-dd")); }}
                                                                            className="px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                                                        >
                                                                            <ArrowUpCircle className="w-3 h-3" /> Withdraw
                                                                        </button>
                                                                        <button
                                                                            onClick={() => startEditInvestment(inv)}
                                                                            className="p-1.5 bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 text-[#888] rounded-lg transition-all cursor-pointer"
                                                                        >
                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setExpandedInvestmentId(isHistoryExpanded ? null : inv.id)}
                                                                            className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all cursor-pointer"
                                                                        >
                                                                            {isHistoryExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteInvestment(inv.id)}
                                                                            className="p-1.5 bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-white rounded-lg transition-all cursor-pointer"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            )}

                                                            {/* Record Transaction Form */}
                                                            {isAddingTx && (
                                                                <div className={cn("border-t p-4 animate-in slide-in-from-top-2 duration-200", txType === 'invest' ? "border-emerald-500/20 bg-emerald-500/5" : "border-orange-500/20 bg-orange-500/5")}>
                                                                    <form onSubmit={handleAddTransaction} className="space-y-3">
                                                                        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                                                                            <div className="flex flex-col gap-1.5">
                                                                                <label className="text-[9px] font-black text-[#888] uppercase tracking-widest pl-1">Amount</label>
                                                                                <input required type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="Amount" className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 h-[38px]" />
                                                                            </div>
                                                                            <div className="flex flex-col gap-1.5">
                                                                                <label className="text-[9px] font-black text-[#888] uppercase tracking-widest pl-1">Date</label>
                                                                                <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 [color-scheme:dark] h-[38px]" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1.5">
                                                                            <label className="text-[9px] font-black text-[#888] uppercase tracking-widest pl-1">Note / Description</label>
                                                                            <input value={txNote} onChange={e => setTxNote(e.target.value)} placeholder="Re-investment, profit share, dividend, etc." className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 h-[38px]" />
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button type="submit" className={cn("flex-1 text-white py-2 rounded-lg text-xs font-bold cursor-pointer transition-all", txType === 'invest' ? "bg-emerald-600 hover:bg-emerald-500" : "bg-orange-600 hover:bg-orange-500")}>
                                                                                {txType === 'invest' ? 'Record Investment' : 'Record Withdrawal'}
                                                                            </button>
                                                                            <button type="button" onClick={() => setTxInvestmentId(null)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all">Cancel</button>
                                                                        </div>
                                                                    </form>
                                                                </div>
                                                            )}

                                                            {/* Transaction History & Inline Editing */}
                                                            {isHistoryExpanded && (
                                                                <div className="border-t border-white/5 bg-black/10">
                                                                    <div className="px-4 py-2 bg-white/[0.01] border-b border-white/5 flex items-center justify-between">
                                                                        <span className="text-[9px] font-black text-[#555] uppercase tracking-widest">Transaction History</span>
                                                                        <span className="text-[9px] text-[#555]">{inv.transactions.length} entries</span>
                                                                    </div>
                                                                    {inv.transactions.length === 0 ? (
                                                                        <p className="p-6 text-xs text-[#444] text-center">No transactions recorded yet.</p>
                                                                    ) : (
                                                                        <div className="divide-y divide-white/[0.03] max-h-[300px] overflow-y-auto no-scrollbar">
                                                                            {inv.transactions.map(tx => {
                                                                                const isEditingTx = editingTxId === tx.id;

                                                                                if (isEditingTx) {
                                                                                    return (
                                                                                        <div key={tx.id} className="p-4 bg-white/[0.02] space-y-3 animate-in fade-in duration-200">
                                                                                            <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                                                                                                <div className="flex flex-col gap-1">
                                                                                                    <label className="text-[8px] font-black text-[#555] uppercase tracking-widest pl-1">Amount</label>
                                                                                                    <input type="number" value={editTxAmount} onChange={e => setEditTxAmount(e.target.value)} className="bg-[#111] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500 h-[32px]" />
                                                                                                </div>
                                                                                                <div className="flex flex-col gap-1">
                                                                                                    <label className="text-[8px] font-black text-[#555] uppercase tracking-widest pl-1">Date</label>
                                                                                                    <input type="date" value={editTxDate} onChange={e => setEditTxDate(e.target.value)} className="bg-[#111] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500 [color-scheme:dark] h-[32px]" />
                                                                                                </div>
                                                                                                <div className="flex flex-col gap-1">
                                                                                                    <label className="text-[8px] font-black text-[#555] uppercase tracking-widest pl-1">Type</label>
                                                                                                    <select value={editTxType} onChange={e => setEditTxType(e.target.value as any)} className="bg-[#111] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500 [color-scheme:dark] h-[32px]">
                                                                                                        <option value="invest">Invest</option>
                                                                                                        <option value="withdraw">Withdraw</option>
                                                                                                    </select>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex gap-3 items-center">
                                                                                                <div className="flex-1 flex flex-col gap-1">
                                                                                                    <label className="text-[8px] font-black text-[#555] uppercase tracking-widest pl-1">Note</label>
                                                                                                    <input value={editTxNote} onChange={e => setEditTxNote(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500 h-[32px]" />
                                                                                                </div>
                                                                                                <div className="flex gap-1.5 mt-5">
                                                                                                    <button onClick={() => handleSaveTransaction(tx.id)} className="bg-green-600 hover:bg-green-500 text-white rounded-lg p-1.5 cursor-pointer">
                                                                                                        <Check className="w-3.5 h-3.5" />
                                                                                                    </button>
                                                                                                    <button onClick={() => setEditingTxId(null)} className="bg-white/5 hover:bg-white/10 text-white rounded-lg p-1.5 cursor-pointer">
                                                                                                        <X className="w-3.5 h-3.5" />
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                return (
                                                                                    <div key={tx.id} className="flex items-center justify-between px-4 py-3 group/tx hover:bg-white/[0.02]">
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
                                                                                                <button onClick={() => startEditTransaction(tx)} className="p-1 text-[#888] hover:text-blue-500 transition-colors">
                                                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                                <button onClick={() => handleDeleteTransaction(tx.id)} className="p-1 text-[#888] hover:text-red-500 transition-colors">
                                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
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
