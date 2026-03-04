"use client";

import { useState } from "react";
import { FileText, Trash2, Edit3, ShieldCheck, ShieldAlert, Code, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeCardProps {
    resume: {
        id: string;
        name: string;
        content: string;
        format: 'latex' | 'text';
        actsAsBase: boolean;
        isAnchor: boolean;
        isMasterTemplate: boolean;
    };
    onDelete: (id: string) => void;
    onToggleBase: (id: string, current: boolean) => void;
    onToggleAnchor: (id: string, current: boolean) => void;
    onEdit: (resume: any) => void;
}

export function ResumeCard({ resume, onDelete, onToggleBase, onToggleAnchor, onEdit }: ResumeCardProps) {
    return (
        <div className={cn(
            "group relative bg-[#191919] border border-[#2d2d2d] rounded-2xl p-5 transition-all hover:bg-[#1c1c1c] hover:border-white/10",
            resume.isAnchor && "ring-2 ring-blue-500/50 border-blue-500/40",
            resume.isMasterTemplate && "border-blue-500/20 bg-blue-500/[0.02]"
        )}>
            {resume.isAnchor && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1.5 rounded-lg shadow-lg z-10 animate-bounce-subtle">
                    <Target className="w-3 h-3" />
                </div>
            )}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-xl border border-white/5",
                        resume.format === 'latex' ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"
                    )}>
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white tracking-tight leading-tight group-hover:text-blue-400 transition-colors uppercase text-sm">
                            {resume.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                                resume.format === 'latex' ? "border-blue-500/20 text-blue-500/60" : "border-orange-500/20 text-orange-500/60"
                            )}>
                                {resume.format === 'latex' ? 'LaTeX SOURCE' : 'RAW CONTENT'}
                            </span>
                            {resume.isAnchor && (
                                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-emerald-500/20 text-emerald-500/60 bg-emerald-500/5">
                                    Map Active
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {!resume.isMasterTemplate && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(resume)}
                            className="p-2 text-[#555555] hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(resume.id)}
                            className="p-2 text-[#555555] hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {!resume.isMasterTemplate && (
                        <button
                            onClick={() => onToggleAnchor(resume.id, resume.isAnchor)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                                resume.isAnchor
                                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20"
                                    : "bg-white/5 text-[#555555] border-white/5 hover:text-[#888888] hover:bg-white/10"
                            )}
                            title="Set as Priority CV (Structure + Optimization Hub)"
                        >
                            <Target className={cn("w-3.5 h-3.5", resume.isAnchor ? "animate-pulse" : "")} />
                            <span>{resume.isAnchor ? "Priority CV" : "Set Priority"}</span>
                        </button>
                    )}

                    {resume.isMasterTemplate && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#444444] border border-white/5 bg-white/[0.02]">
                            <ShieldCheck className="w-3 h-3 opacity-30" />
                            <span>Master Style</span>
                        </div>
                    )}
                </div>

                <span className="text-[10px] font-bold text-[#333333]">
                    {resume.content.length > 1000 ? `${(resume.content.length / 1024).toFixed(1)} KB` : `${resume.content.length} chars`}
                </span>
            </div>
        </div>
    );
}
