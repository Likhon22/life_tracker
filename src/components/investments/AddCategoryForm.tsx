"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const CATEGORY_ICONS = [
    "Bitcoin", "Briefcase", "BarChart3", "TrendingUp", "Landmark",
    "Building2", "Store", "Gem", "Coins", "Banknote",
    "PiggyBank", "CircleDollarSign", "HandCoins", "Wallet", "LineChart"
];

export function AddCategoryForm({ onSubmit }: { onSubmit: (name: string, icon: string) => void }) {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("Bitcoin");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit(name.trim(), icon);
        setName("");
        setIcon("Bitcoin");
    };

    return (
        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest">New Category Folder</label>
                <div className="flex gap-3">
                    <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Crypto, Stocks, Business" className="flex-1" />
                    <Button type="submit">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {CATEGORY_ICONS.map((ic) => {
                        const Ic = (Icons as any)[ic] || Briefcase;
                        return (
                            <button
                                key={ic}
                                type="button"
                                onClick={() => setIcon(ic)}
                                className={cn(
                                    "p-2.5 rounded-xl border transition-all cursor-pointer",
                                    icon === ic ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/5 text-[#666] hover:text-white"
                                )}
                            >
                                <Ic className="w-4 h-4" />
                            </button>
                        );
                    })}
                </div>
            </form>
        </div>
    );
}
