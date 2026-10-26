"use client";

import { useCigarettes } from "./CigaretteProvider";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, User, Users, X } from "lucide-react";
import { cn, evaluateMath } from "@/lib/utils";
import { BrandSelect } from "./BrandSelect";
import { BrandManager } from "./BrandManager";

export function LogEntryForm() {
    const { brands, addLog } = useCigarettes();
    const [brandId, setBrandId] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [consumedBySelf, setConsumedBySelf] = useState(true);
    const [paidBySelf, setPaidBySelf] = useState(true);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);

    // Auto-calculate the amount from brand price x quantity, but the field stays editable
    // for when the shop charges a bit differently than the exact math.
    useEffect(() => {
        const brand = brands.find((b) => b.id === brandId);
        const qty = parseInt(quantity, 10);
        if (brand && qty > 0) {
            setAmount(String(brand.pricePerStick * qty));
        }
    }, [brandId, quantity, brands]);

    useEffect(() => {
        if (!brandId && brands.length > 0) setBrandId(brands[0].id);
    }, [brands, brandId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseInt(quantity, 10);
        const evaluatedAmount = evaluateMath(amount);
        if (!brandId || qty <= 0 || evaluatedAmount <= 0) return;

        setIsSubmitting(true);
        try {
            await addLog({
                date,
                brandId,
                quantity: qty,
                amount: evaluatedAmount,
                consumedBySelf,
                paidBySelf,
                note: note.trim() || undefined,
            });
            setQuantity("1");
            setNote("");
            setConsumedBySelf(true);
            setPaidBySelf(true);
            setDate(format(new Date(), "yyyy-MM-dd"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-500/10 rounded-xl">
                        <Plus className="w-5 h-5 text-red-500" />
                    </div>
                    <h2 className="font-bold text-lg text-white tracking-tight">Log Cigarette</h2>
                </div>
                <button
                    type="button"
                    onClick={() => setIsManageOpen(true)}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-all cursor-pointer"
                >
                    Manage Brands
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] px-1">Brand</label>
                    <BrandSelect brands={brands} value={brandId} onChange={setBrandId} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em] px-1">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 focus:border-blue-500 focus:bg-white/[0.08] text-white rounded-xl py-3 px-4 outline-none transition-all font-medium"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em] px-1">Amount</label>
                        <input
                            type="text"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 focus:border-blue-500 focus:bg-white/[0.08] text-white rounded-xl py-3 px-4 outline-none transition-all font-medium"
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em] px-1">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 focus:border-blue-500 focus:bg-white/[0.08] text-white rounded-xl py-3 px-4 outline-none transition-all font-medium text-sm [color-scheme:dark]"
                    />
                </div>

                {/* Who smoked it vs. who paid for it are independent — e.g. a friend can cover your bill */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em] px-1">Smoked By</label>
                        <div className="grid grid-cols-2 gap-1.5 bg-white/5 rounded-xl p-1">
                            <button
                                type="button"
                                onClick={() => setConsumedBySelf(true)}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer",
                                    consumedBySelf ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-[#888888] hover:text-white"
                                )}
                            >
                                <User className="w-3.5 h-3.5" /> Myself
                            </button>
                            <button
                                type="button"
                                onClick={() => setConsumedBySelf(false)}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer",
                                    !consumedBySelf ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-[#888888] hover:text-white"
                                )}
                            >
                                <Users className="w-3.5 h-3.5" /> Friend
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-[0.2em] px-1">Paid By</label>
                        <div className="grid grid-cols-2 gap-1.5 bg-white/5 rounded-xl p-1">
                            <button
                                type="button"
                                onClick={() => setPaidBySelf(true)}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer",
                                    paidBySelf ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-[#888888] hover:text-white"
                                )}
                            >
                                <User className="w-3.5 h-3.5" /> Myself
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaidBySelf(false)}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer",
                                    !paidBySelf ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-[#888888] hover:text-white"
                                )}
                            >
                                <Users className="w-3.5 h-3.5" /> Friend
                            </button>
                        </div>
                    </div>
                </div>
                {!paidBySelf && (
                    <div className="flex items-center gap-1.5 text-[11px] text-orange-400 bg-orange-500/5 px-3 py-2 rounded-xl -mt-2">
                        Friend paid — this won&apos;t be added to your Finance cost.
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-blue-500 focus:bg-white/[0.08] text-white rounded-xl py-3 px-4 outline-none transition-all placeholder:text-[#444444] text-sm"
                />

                <button
                    type="submit"
                    disabled={isSubmitting || !brandId}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] cursor-pointer"
                >
                    {isSubmitting ? "Saving..." : "Log It"}
                </button>
            </form>

            {isManageOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm" onClick={() => setIsManageOpen(false)} />
                    <div className="bg-[#191919] border border-[#2d2d2d] rounded-[32px] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <button
                            onClick={() => setIsManageOpen(false)}
                            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-[#888888] hover:text-white transition-all z-10 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex-1 overflow-y-auto no-scrollbar pt-16 px-8 pb-8">
                            <BrandManager />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
