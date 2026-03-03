"use client";

import { useFinance, COMMON_ICONS, Category } from "@/components/FinanceProvider";
import { useState } from "react";
import * as Icons from "lucide-react";
import { Plus, Trash2, Edit2, Check, X, Search, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export function CategoryManager({ onClose }: { onClose?: () => void }) {
    const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState(COMMON_ICONS[0]);
    const [searchIcon, setSearchIcon] = useState("");

    const filteredIcons = COMMON_ICONS.filter(icon =>
        icon.toLowerCase().includes(searchIcon.toLowerCase())
    );

    const handleSave = async () => {
        if (!name) return;
        if (editingId) {
            await updateCategory(editingId, name, selectedIcon);
            setEditingId(null);
        } else {
            await addCategory(name, selectedIcon);
            setIsAdding(false);
        }
        setName("");
        setSelectedIcon(COMMON_ICONS[0]);
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setName(cat.name);
        setSelectedIcon(cat.icon);
        setIsAdding(false);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 px-1">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl">
                        <LayoutGrid className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className="font-bold text-lg text-white tracking-tight">Manage Categories</h2>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/5 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] px-1">Category Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Subscriptions"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em]">Select Icon</label>
                            <div className="relative">
                                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#444444]" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchIcon}
                                    onChange={(e) => setSearchIcon(e.target.value)}
                                    className="bg-transparent border-b border-white/5 text-[10px] pl-6 py-1 outline-none focus:border-blue-500/50 text-white w-24"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-6 gap-2 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
                            {filteredIcons.map((iconName) => {
                                const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setSelectedIcon(iconName)}
                                        className={cn(
                                            "p-2.5 rounded-lg border transition-all flex items-center justify-center group cursor-pointer",
                                            selectedIcon === iconName
                                                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                                                : "bg-[#111111] border-white/5 text-[#444444] hover:text-white hover:border-white/10"
                                        )}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
                        >
                            {editingId ? "Update Category" : "Add Category"}
                        </button>
                        <button
                            onClick={() => { setIsAdding(false); setEditingId(null); setName(""); }}
                            className="bg-white/5 hover:bg-white/10 text-[#888888] hover:text-white font-bold px-6 rounded-xl text-sm transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 no-scrollbar">
                {categories.map((cat) => {
                    const IconComponent = (Icons as any)[cat.icon] || Icons.HelpCircle;
                    return (
                        <div key={cat.id} className="group flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/5 rounded-lg text-[#888888] group-hover:text-blue-500 transition-colors">
                                    <IconComponent className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-white tracking-tight">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => startEdit(cat)}
                                    className="p-2 text-[#555555] hover:text-blue-500 transition-all cursor-pointer"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => deleteCategory(cat.id)}
                                    className="p-2 text-[#555555] hover:text-red-500 transition-all cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
