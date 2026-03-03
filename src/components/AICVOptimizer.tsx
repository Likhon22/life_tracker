"use client";

import { useState } from "react";
import { Zap, Target, Loader2, ClipboardCheck, AlertCircle, Sparkles, Save, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface AICVOptimizerProps {
    onResumeSaved?: () => void;
    currentSavedSize?: number;
}

export function AICVOptimizer({ onResumeSaved, currentSavedSize = 0 }: AICVOptimizerProps) {
    const [jobDescription, setJobDescription] = useState("");
    const [tempContent, setTempContent] = useState("");
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleOptimize = async () => {
        if (!jobDescription.trim()) {
            toast.error("Please provide a job description");
            return;
        }

        try {
            setIsOptimizing(true);
            const res = await fetch("/api/resumes/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobDescription, tempContent })
            });

            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            setResult(data);
            toast.success("Mission Accomplished! Resume optimized.");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "AI Mission Failed");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleSaveToVault = async () => {
        if (!result?.optimizedLatex) return;

        try {
            setIsSaving(true);
            const res = await fetch("/api/resumes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `Optimized CV - ${new Date().toLocaleDateString()}`,
                    content: result.optimizedLatex,
                    format: 'latex'
                })
            });

            if (!res.ok) throw new Error(await res.text());

            toast.success("Saved to your resumes!");
            if (onResumeSaved) onResumeSaved();
        } catch (error: any) {
            const err = JSON.parse(error.message);
            toast.error(err.error || "Failed to save CV");
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = () => {
        if (result?.optimizedLatex) {
            navigator.clipboard.writeText(result.optimizedLatex);
            toast.success("LaTeX code copied!");
        }
    };

    return (
        <div className="space-y-6">
            {/* Glassmorphism Loading Overlay */}
            {isOptimizing && (
                <div className="fixed inset-0 top-0 left-0 w-full h-full min-h-screen z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="relative">
                        {/* Orbiting rings */}
                        <div className="absolute inset-0 w-32 h-32 border-4 border-blue-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                        <div className="w-32 h-32 border-t-4 border-blue-500 rounded-full animate-spin shadow-lg shadow-blue-500/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-8 h-8 text-blue-500 fill-blue-500/20 animate-pulse" />
                        </div>
                    </div>
                    <div className="mt-8 text-center space-y-2">
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Architecting...</h2>
                        <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                            <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                            Pooling Experience
                            <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-75" />
                            Optimizing ATS
                            <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-150" />
                            Finalizing LaTeX
                        </div>
                        <p className="text-xs text-[#555555] font-medium max-w-[200px] mx-auto mt-4 px-4 py-2 bg-white/5 border border-white/5 rounded-xl">
                            Gemini is currently cross-referencing your pool with the target mission description.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-[#191919] border border-[#2d2d2d] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <Target className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-white tracking-tight">Mission Objective</h2>
                            <p className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mt-0.5">Paste target job description</p>
                        </div>
                    </div>

                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the Job Description here. The AI will analyze your saved resumes to build the perfect match..."
                        className="w-full h-48 bg-[#111111] border border-white/5 rounded-2xl p-5 text-sm text-[#ededed] outline-none focus:border-blue-500/50 transition-all font-medium resize-none shadow-inner mb-6"
                    />

                    <div className="flex items-center gap-4 mb-4 mt-2">
                        <div className="p-2 bg-orange-500/10 rounded-xl">
                            <FileText className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-white tracking-tight">Temporary Experience Dump (Optional)</h2>
                            <p className="text-[9px] font-bold text-[#555555] uppercase tracking-widest mt-0.5">Not saved to db. Used only for this generation.</p>
                        </div>
                    </div>

                    <textarea
                        value={tempContent}
                        onChange={(e) => setTempContent(e.target.value)}
                        placeholder="Provide raw text of your skills, projects, or existing text CV here..."
                        className="w-full h-32 bg-[#111111] border border-white/5 rounded-2xl p-5 text-sm text-[#ededed] outline-none focus:border-orange-500/50 transition-all font-medium resize-none shadow-inner"
                    />

                    <div className="mt-8 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#444444] uppercase tracking-widest">
                            <Sparkles className="w-3 h-3" />
                            <span>Experience Pooling Active</span>
                        </div>

                        <button
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-600/20 flex items-center gap-3"
                        >
                            {isOptimizing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Architecting...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 fill-white" />
                                    <span>Generate Optimized CV</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* AI Results Board */}
                {result && (
                    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[#191919] border border-[#2d2d2d] rounded-3xl p-8 shadow-xl flex flex-col justify-center">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative w-32 h-32 mb-6">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="58"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 58}
                                            strokeDashoffset={2 * Math.PI * 58 * (1 - result.fitPercentage / 100)}
                                            strokeLinecap="round"
                                            className="text-blue-500 transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-white">{result.fitPercentage}%</span>
                                        <span className="text-[10px] font-bold text-[#555555] uppercase tracking-tighter">Match</span>
                                    </div>
                                </div>

                                <div className={cn(
                                    "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 border",
                                    result.recommendation === "Strong Apply" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                        result.recommendation === "Apply with Caution" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                            "bg-red-500/10 text-red-500 border-red-500/20"
                                )}>
                                    Status: {result.recommendation}
                                </div>

                                <div className="space-y-4 text-left w-full">
                                    {Array.isArray(result.analysis) ? (
                                        result.analysis.map((point: string, idx: number) => (
                                            <div key={idx} className="flex items-start gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl">
                                                <div className="p-1.5 bg-[#252525] rounded-lg mt-0.5">
                                                    <AlertCircle className="w-3 h-3 text-blue-500" />
                                                </div>
                                                <p className="text-[11px] text-[#888888] font-medium leading-relaxed">
                                                    {point}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-4 h-4 text-[#555555] shrink-0 mt-0.5" />
                                            <p className="text-xs text-[#888888] leading-relaxed">
                                                {result.analysis}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1 bg-[#191919] border border-[#2d2d2d] rounded-3xl p-8 shadow-xl flex flex-col min-h-[600px]">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                <div className="flex items-center gap-3">
                                    <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                                    <div>
                                        <h3 className="font-bold text-white tracking-tight text-lg">Optimized LaTeX Code</h3>
                                        <p className="text-[10px] font-bold text-[#555555] uppercase tracking-wider">Strictly formatted for ATS</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-[#ededed] rounded-xl text-xs font-bold transition-all border border-white/5"
                                    >
                                        <ClipboardCheck className="w-4 h-4" />
                                        <span>Copy</span>
                                    </button>
                                    <button
                                        onClick={handleSaveToVault}
                                        disabled={isSaving || currentSavedSize >= 4}
                                        className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-xl text-xs font-bold transition-all"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        <span>{currentSavedSize >= 4 ? "Limit Reached (4/4)" : "Save Result"}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 bg-[#111111] rounded-2xl p-6 overflow-auto border border-white/5 shadow-inner">
                                <pre className="text-[11px] font-mono text-blue-400/80 leading-relaxed no-scrollbar whitespace-pre-wrap">
                                    {result.optimizedLatex}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
