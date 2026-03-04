"use client";

import { useState } from "react";
import {
    Zap, Target, Loader2, CheckCircle2, XCircle, Lightbulb,
    Star, BookOpen, Vault, Copy, FileCode, Check, Layers,
    ArrowRightLeft, Wrench, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface AICVOptimizerProps {
    hasVaultItems?: boolean;
}

export function AICVOptimizer({ hasVaultItems = false }: AICVOptimizerProps) {
    const [jobDescription, setJobDescription] = useState("");
    const [tempContent, setTempContent] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLatex, setGeneratedLatex] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleAnalyze = async () => {
        if (!jobDescription.trim()) { toast.error("Please provide a job description"); return; }
        try {
            setIsAnalyzing(true);
            setResult(null);
            setGeneratedLatex(null);
            const res = await fetch("/api/resumes/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobDescription, tempContent })
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error === "VAULT_EMPTY" ? "Save at least one CV to your Vault first!" : data.error || "Analysis failed");
                return;
            }
            setResult(data);
            toast.success("Blueprint ready!");
        } catch {
            toast.error("AI Analysis Failed");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerate = async () => {
        if (!result) return;
        try {
            setIsGenerating(true);
            setGeneratedLatex(null);
            const res = await fetch("/api/resumes/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobDescription,
                    projectSlots: result.projectSlots,
                    experienceSwaps: result.experienceSwaps,
                    skillConsolidation: result.skillConsolidation,
                })
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.error === "INCOMPLETE_LATEX") toast.error(data.details, { duration: 6000 });
                else toast.error(data.error || "Generation failed");
                return;
            }
            setGeneratedLatex(data.optimizedLatex);
            toast.success("LaTeX generated! Paste into Overleaf.");
        } catch {
            toast.error("Generation failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyLatex = () => {
        if (!generatedLatex) return;
        navigator.clipboard.writeText(generatedLatex);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("LaTeX copied!");
    };

    const actionColor = (a: string) =>
        a === "KEEP" ? "text-emerald-400" : a === "TWEAK" ? "text-yellow-400" : "text-orange-400";
    const actionIcon = (a: string) =>
        a === "KEEP" ? <CheckCircle2 className="w-3 h-3 shrink-0" /> :
            a === "TWEAK" ? <Wrench className="w-3 h-3 shrink-0" /> :
                <ArrowRightLeft className="w-3 h-3 shrink-0" />;

    if (!hasVaultItems) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-10 border-2 border-dashed border-white/10 rounded-3xl text-center gap-4">
                <Vault className="w-16 h-16 text-[#333]" />
                <h3 className="text-xl font-bold text-white">Your Vault is Empty</h3>
                <p className="text-sm text-[#666] max-w-sm">
                    Save at least one CV to the <strong className="text-white">Experience Vault</strong> first. The AI will analyze your vault to match against the job description.
                </p>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Go to → Saved Resumes → Add New Version</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Loading Overlays */}
            {(isAnalyzing || isGenerating) && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 w-32 h-32 border-4 border-blue-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                        <div className="w-32 h-32 border-t-4 border-blue-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-8 h-8 text-blue-500 fill-blue-500/20 animate-pulse" />
                        </div>
                    </div>
                    <div className="mt-8 text-center">
                        <h2 className="text-2xl font-black text-white uppercase">{isAnalyzing ? "Analyzing Pool..." : "Generating CV..."}</h2>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
                            {isAnalyzing ? "Curating projects · Matching bullets · Mapping skills" : "Applying blueprint · Preserving structure"}
                        </p>
                    </div>
                </div>
            )}

            {/* Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-[#191919] border border-[#2d2d2d] rounded-3xl p-6 flex flex-col gap-3">
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest flex items-center gap-2"><Target className="w-3 h-3" /> Job Description</label>
                    <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the target job description here..." className="flex-1 bg-[#111] border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all resize-none font-medium min-h-[200px]" />
                </div>
                <div className="bg-[#191919] border border-[#2d2d2d] rounded-3xl p-6 flex flex-col gap-3">
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest flex items-center gap-2"><BookOpen className="w-3 h-3" /> Extra Experience (Optional)</label>
                    <textarea value={tempContent} onChange={e => setTempContent(e.target.value)} placeholder="Any extra skills or projects not in your saved CVs..." className="flex-1 bg-[#111] border border-white/5 rounded-2xl p-4 text-sm text-[#aaa] outline-none focus:border-blue-500/50 transition-all resize-none font-medium min-h-[200px]" />
                    <p className="text-[10px] text-[#444]">Not saved to DB. Only used for this analysis.</p>
                </div>
            </div>

            <button onClick={handleAnalyze} disabled={isAnalyzing || !jobDescription.trim()} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold transition-all cursor-pointer shadow-lg shadow-blue-600/20">
                <Zap className="w-5 h-5" /> Analyze & Build Blueprint
            </button>

            {/* Results */}
            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">

                    {/* Score + Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-4">
                        <div className={cn("flex flex-col items-center justify-center rounded-2xl border p-5 gap-1",
                            result.fitPercentage >= 80 ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" :
                                result.fitPercentage >= 60 ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/5" :
                                    "text-red-400 border-red-400/20 bg-red-400/5"
                        )}>
                            <span className="text-5xl font-black">{result.fitPercentage}%</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest">Pool Match</span>
                        </div>
                        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-5 flex flex-col gap-3">
                            <p className="text-sm text-[#ccc] leading-relaxed">{result.summary}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Strengths</p>
                                    {result.strengths?.map((s: string, i: number) => <p key={i} className="text-xs text-[#aaa] leading-relaxed mb-1 flex gap-1.5"><span className="text-emerald-500 mt-0.5">✓</span>{s}</p>)}
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1.5">Gaps</p>
                                    {result.gaps?.map((g: string, i: number) => <p key={i} className="text-xs text-[#aaa] leading-relaxed mb-1 flex gap-1.5"><span className="text-red-400 mt-0.5">✗</span>{g}</p>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project Slots */}
                    {result.projectSlots?.length > 0 && (
                        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Layers className="w-4 h-4 text-purple-400" />
                                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Project Slot Curation</h4>
                                <span className="text-[9px] text-[#444] ml-auto">{result.projectSlots.length} slots in Priority CV</span>
                            </div>
                            <div className="space-y-2">
                                {result.projectSlots.map((slot: any, i: number) => (
                                    <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl border",
                                        slot.action === 'KEEP' ? "border-emerald-500/10 bg-emerald-500/5" : "border-orange-400/10 bg-orange-400/5"
                                    )}>
                                        <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded mt-0.5 shrink-0",
                                            slot.action === 'KEEP' ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-400/10 text-orange-400"
                                        )}>{slot.action}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white">
                                                {slot.action === 'KEEP' ? slot.currentProject : <><span className="line-through text-[#555]">{slot.currentProject}</span> → <span className="text-orange-400">{slot.recommendedProject}</span></>}
                                                {slot.sourceCv && <span className="text-[9px] text-[#555] ml-2 font-normal">from {slot.sourceCv}</span>}
                                            </p>
                                            <p className="text-xs text-[#888] mt-0.5">{slot.reason}</p>
                                            {slot.textTweaks && <p className="text-xs text-yellow-400/80 mt-1 flex items-center gap-1"><Wrench className="w-3 h-3" /> {slot.textTweaks}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Experience Swaps */}
                    {result.experienceSwaps?.length > 0 && (
                        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Experience Bullet Blueprint</h4>
                            </div>
                            {result.experienceSwaps.map((exp: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <p className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1">{exp.role}</p>
                                    {exp.bullets?.map((b: any, j: number) => (
                                        <div key={j} className="flex items-start gap-2 pl-2">
                                            <span className={cn("mt-0.5", actionColor(b.action))}>{actionIcon(b.action)}</span>
                                            <div>
                                                <span className={cn("text-[9px] font-bold uppercase mr-2", actionColor(b.action))}>{b.action}</span>
                                                {b.action === 'KEEP'
                                                    ? <span className="text-xs text-[#666]">"{b.originalPreview}..."</span>
                                                    : <span className="text-xs text-[#ccc]">{b.newContent}</span>}
                                                {b.sourceCv && <span className="text-[9px] text-[#444] ml-1">— from {b.sourceCv}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Skill Consolidation */}
                    {result.skillConsolidation?.length > 0 && (
                        <div className="bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 space-y-3">
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Curated Skill Set (From All CVs)</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {result.skillConsolidation.map((cat: any, i: number) => (
                                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                                        <p className="text-[9px] font-bold text-[#555] uppercase tracking-widest mb-1.5">{cat.category}</p>
                                        <p className="text-xs text-[#ccc] flex flex-wrap gap-1">
                                            {cat.skills?.map((s: string, j: number) => (
                                                <span key={j} className="bg-white/5 border border-white/5 rounded-md px-1.5 py-0.5">{s}</span>
                                            ))}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full flex items-center justify-center gap-3 bg-[#191919] hover:bg-[#222] border border-blue-500/30 hover:border-blue-500/60 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold transition-all cursor-pointer">
                        {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating LaTeX...</> : <><FileCode className="w-5 h-5 text-blue-400" /> Generate Combined CV (LaTeX)</>}
                    </button>

                    {/* LaTeX Output */}
                    {generatedLatex && (
                        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden animate-in fade-in duration-300">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#191919]">
                                <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest flex items-center gap-2"><FileCode className="w-3 h-3" /> Generated LaTeX — Paste into Overleaf</span>
                                <button onClick={copyLatex} className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? "Copied!" : "Copy All"}
                                </button>
                            </div>
                            <pre className="p-5 text-xs text-[#aaa] font-mono overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed no-scrollbar">{generatedLatex}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
