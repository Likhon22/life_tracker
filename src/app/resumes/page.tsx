"use client";

import { useState, useEffect } from "react";
import { FileCode, Plus, Loader2, Sparkles, LayoutGrid, Zap } from "lucide-react";
import { ModulePage } from "@/components/ModulePage";
import { ResumeCard } from "@/components/ResumeCard";
import { AICVOptimizer } from "@/components/AICVOptimizer";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface Resume {
    id: string;
    name: string;
    content: string;
    format: 'latex' | 'text';
    actsAsBase: boolean;
    isAnchor: boolean;
    isMasterTemplate: boolean;
}

export default function ResumeArchitectPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<'saved' | 'generator'>('generator');

    // Form state
    const [newName, setNewName] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newFormat, setNewFormat] = useState<'latex' | 'text'>('latex');

    const fetchResumes = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/resumes");
            if (res.ok) {
                const data = await res.json();
                setResumes(data);
            }
        } catch (error) {
            toast.error("Failed to load CV pool");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/resumes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, content: newContent, format: newFormat })
            });

            if (!res.ok) throw new Error(await res.text());

            toast.success("CV Version recorded");
            setNewName("");
            setNewContent("");
            setIsAdding(false);
            fetchResumes();
        } catch (error: any) {
            const err = JSON.parse(error.message);
            toast.error(err.error || "Failed to save CV");
        }
    };

    const handleDelete = async (id: string, silent: boolean = false) => {
        try {
            const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
            if (res.ok) {
                if (!silent) toast.success("Version removed");
                fetchResumes();
            }
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const confirmDelete = (id: string) => {
        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[200px]">
                <p className="text-sm font-medium text-white">
                    Remove this version?
                </p>
                <div className="flex justify-end gap-2 border-t border-white/5 pt-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 text-xs text-[#555555] hover:text-white cursor-pointer"
                    >
                        Keep
                    </button>
                    <button
                        onClick={() => {
                            handleDelete(id);
                            toast.dismiss(t.id);
                        }}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all cursor-pointer font-bold"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            position: 'top-center'
        });
    };

    const handleToggleBase = async (id: string, current: boolean) => {
        try {
            const res = await fetch(`/api/resumes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actsAsBase: !current })
            });
            if (res.ok) fetchResumes();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleToggleAnchor = async (id: string, current: boolean) => {
        try {
            // Optimistically update AI Generator page if needed, but let's just do the DB calls
            const res = await fetch(`/api/resumes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isAnchor: !current })
            });
            if (res.ok) fetchResumes();
        } catch (error) {
            toast.error("Failed to set anchor");
        }
    };

    return (
        <ModulePage
            title="Resume Architect"
            subtitle="Architect perfectly-matched LaTeX resumes using AI experience pooling."
            icon={FileCode}
            authDescription="Sign in to build your career experience pool and generate high-impact, job-matched CVs."
            headerContent={
                <div className="flex bg-[#111111] p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeTab === 'generator' ? "bg-blue-600 text-white shadow-lg" : "text-[#555555] hover:text-[#888888]"
                        )}
                    >
                        <Zap className="w-4 h-4" />
                        AI Generator
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeTab === 'saved' ? "bg-blue-600 text-white shadow-lg" : "text-[#555555] hover:text-[#888888]"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Saved Resumes
                    </button>
                </div>
            }
        >
            <div className="pb-12">
                {activeTab === 'generator' ? (
                    <AICVOptimizer onResumeSaved={fetchResumes} currentSavedSize={resumes.filter(r => !r.isMasterTemplate).length} />
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Priority Explanation Banner */}
                        <div className="bg-blue-600/5 border border-blue-500/10 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="p-4 bg-blue-500/10 rounded-2xl shadow-inner">
                                <Zap className="w-6 h-6 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            </div>
                            <div className="space-y-1 text-center md:text-left">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Structural Anchoring Active</h4>
                                <p className="text-xs text-[#888888] font-medium max-w-2xl leading-relaxed">
                                    The CV marked as <span className="text-blue-500 font-bold italic">Priority</span> acts as the unbreakable blueprint.
                                    The AI will pool experience from your entire vault but strictly enforce this structure, ensuring your LaTeX layout remains perfectly preserved and never overflows.
                                </p>
                            </div>
                        </div>

                        {/* Summary Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-1 bg-blue-500 rounded-full" />
                                <div>
                                    <h3 className="font-bold text-white tracking-tight">Experience Vault</h3>
                                    <p className="text-xs text-[#555555] font-bold uppercase tracking-widest">{resumes.filter(r => !r.isMasterTemplate).length} / 4 Versions Stored</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Version
                            </button>
                        </div>

                        {/* Add Version Form */}
                        {isAdding && (
                            <div className="bg-[#191919] border border-blue-500/20 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                                <form onSubmit={handleAdd} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[#555555] uppercase tracking-widest px-1">CV Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                placeholder="e.g. Frontend Specialist v1"
                                                className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[#555555] uppercase tracking-widest px-1">Format Type</label>
                                            <div className="flex bg-[#111111] p-1 rounded-xl border border-white/5">
                                                <button
                                                    type="button"
                                                    onClick={() => setNewFormat('latex')}
                                                    className={cn("flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer", newFormat === 'latex' ? "bg-[#1d1d1d] text-white" : "text-[#444444]")}
                                                >
                                                    LaTeX
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewFormat('text')}
                                                    className={cn("flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer", newFormat === 'text' ? "bg-[#1d1d1d] text-white" : "text-[#444444]")}
                                                >
                                                    Raw Text
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-[#555555] uppercase tracking-widest px-1">Code / Content</label>
                                        <textarea
                                            required
                                            value={newContent}
                                            onChange={(e) => setNewContent(e.target.value)}
                                            placeholder={newFormat === 'latex' ? "\\documentclass{...} \n\\begin{document}..." : "Past your raw career info/projects here..."}
                                            className="w-full h-64 bg-[#111111] border border-white/5 rounded-xl p-5 text-sm text-blue-400 font-mono focus:border-blue-500/50 outline-none transition-all resize-none shadow-inner"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsAdding(false)}
                                            className="px-6 py-2.5 text-xs font-bold text-[#555555] hover:text-[#888888] transition-all cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
                                        >
                                            Record Version
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {isLoading ? (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-20">
                                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                    <p className="text-sm font-bold uppercase tracking-[0.2em]">Deploying CV Pool...</p>
                                </div>
                            ) : resumes.length === 0 ? (
                                <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                                    <Sparkles className="w-12 h-12 text-[#222222] mb-6" />
                                    <p className="text-sm font-medium text-[#444444] text-center max-w-sm mb-8">
                                        You have no saved resumes. Click below to add your first LaTeX CV code to your account.
                                    </p>
                                    <button
                                        onClick={() => setIsAdding(true)}
                                        className="bg-blue-600/10 text-blue-500 border border-blue-500/20 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all cursor-pointer"
                                    >
                                        Add Your First LaTeX CV
                                    </button>
                                </div>
                            ) : (
                                resumes.map((resume: any) => (
                                    <ResumeCard
                                        key={resume.id}
                                        resume={resume}
                                        onDelete={confirmDelete}
                                        onToggleBase={handleToggleBase}
                                        onToggleAnchor={handleToggleAnchor}
                                        onEdit={(res) => {
                                            setNewName(res.name);
                                            setNewContent(res.content);
                                            setNewFormat(res.format);
                                            setIsAdding(true);
                                            // Handle deletion silently so user doesn't get double notifications
                                            handleDelete(res.id, true);
                                        }}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ModulePage>
    );
}
