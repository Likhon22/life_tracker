"use client";

import { useState } from "react";
import { FileText, Trash2, Edit3, ShieldCheck, ShieldAlert, Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeCardProps {
    resume: {
        id: string;
        name: string;
        content: string;
        format: 'latex' | 'text';
        actsAsBase: boolean;
        isMasterTemplate: boolean;
    };
    onDelete: (id: string) => void;
    onToggleBase: (id: string, current: boolean) => void;
    onEdit: (resume: any) => void;
}

export function ResumeCard({ resume, onDelete, onToggleBase, onEdit }: ResumeCardProps) {
    return (
        <div className={cn(
            "group relative bg-[#191919] border border-[#2d2d2d] rounded-2xl p-5 transition-all hover:bg-[#1c1c1c] hover:border-white/10",
            resume.isMasterTemplate && "border-blue-500/20 bg-blue-500/[0.02]"
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2.5 rounded-xl",
                        resume.format === 'latex' ? "bg-orange-500/10 text-orange-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                        {resume.format === 'latex' ? <Code className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-white tracking-tight">{resume.name}</h3>
                        <p className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mt-0.5">
                            {resume.isMasterTemplate ? "Master Template" : `${resume.format} Version`}
                        </p>
                    </div>
                </div>

                {!resume.isMasterTemplate && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(resume)}
                            className="p-2 text-[#555555] hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(resume.id)}
                            className="p-2 text-[#555555] hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-auto flex items-center justify-between">
                <button
                    disabled={resume.isMasterTemplate}
                    onClick={() => onToggleBase(resume.id, resume.actsAsBase)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        resume.actsAsBase
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            : "bg-white/5 text-[#555555] border border-transparent hover:text-[#888888]"
                    )}
                >
                    {resume.actsAsBase ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                    <span>{resume.actsAsBase ? "Active Pool" : "Inactive"}</span>
                </button>

                <span className="text-[10px] font-bold text-[#333333]">
                    {resume.content.length > 1000 ? `${(resume.content.length / 1024).toFixed(1)} KB` : `${resume.content.length} chars`}
                </span>
            </div>
        </div>
    );
}
