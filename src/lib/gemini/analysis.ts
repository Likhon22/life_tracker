import { getGeminiModel } from "./client";
import { buildAnalysisPrompt } from "../prompts/analysisPrompt";

// --- Types ---

export interface ProjectSlot {
    slotNumber: number;
    action: "KEEP" | "REPLACE";
    currentProject: string;
    recommendedProject: string;
    sourceCv: string;
    reason: string;
    textTweaks: string;
}

export interface BulletSwap {
    action: "KEEP" | "TWEAK" | "REPLACE";
    originalPreview: string;
    newContent: string;
    sourceCv: string;
}

export interface ExperienceSwap {
    role: string;
    bullets: BulletSwap[];
}

export interface SkillCategory {
    category: string;
    skills: string[];
}

export interface AnalysisResult {
    fitPercentage: number;
    summary: string;
    strengths: string[];
    gaps: string[];
    projectSlots: ProjectSlot[];
    experienceSwaps: ExperienceSwap[];
    skillConsolidation: SkillCategory[];
}

// --- Function ---

interface AnalyzeResumeParams {
    userResumes: { content: string; format: 'latex' | 'text'; name: string }[];
    jobDescription: string;
    anchorResume?: { content: string; format: 'latex' | 'text'; name: string };
    tempContent?: string;
}

export async function analyzeResume({ userResumes, jobDescription, anchorResume, tempContent }: AnalyzeResumeParams): Promise<AnalysisResult> {
    const model = getGeminiModel();

    const allSources = [...userResumes];
    if (tempContent?.trim()) {
        allSources.push({ content: tempContent, format: 'text', name: 'Extra Info (Temporary)' });
    }

    const poolSection = allSources
        .map((r, i) => `--- CV ${i + 1}: ${r.name} (${r.format.toUpperCase()}) ---\n${r.content}\n---`)
        .join('\n\n');

    const priorityCvSection = anchorResume
        ? `PRIORITY CV (Named: "${anchorResume.name}"):\n---\n${anchorResume.content}\n---`
        : "NO PRIORITY CV SET. Analyze the experience pool as a whole and provide slot-level recommendations based on a typical 1-page CV structure.";

    const prompt = buildAnalysisPrompt({ jobDescription, poolSection, priorityCvSection });

    const schema = {
        type: "object",
        properties: {
            fitPercentage: { type: "number" },
            summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            gaps: { type: "array", items: { type: "string" } },
            projectSlots: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        slotNumber: { type: "number" },
                        action: { type: "string" },
                        currentProject: { type: "string" },
                        recommendedProject: { type: "string" },
                        sourceCv: { type: "string" },
                        reason: { type: "string" },
                        textTweaks: { type: "string" }
                    }
                }
            },
            experienceSwaps: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        role: { type: "string" },
                        bullets: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    action: { type: "string" },
                                    originalPreview: { type: "string" },
                                    newContent: { type: "string" },
                                    sourceCv: { type: "string" }
                                }
                            }
                        }
                    }
                }
            },
            skillConsolidation: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        category: { type: "string" },
                        skills: { type: "array", items: { type: "string" } }
                    }
                }
            }
        },
        required: ["fitPercentage", "summary", "strengths", "gaps", "projectSlots", "experienceSwaps", "skillConsolidation"]
    };

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema as any
        }
    });

    return JSON.parse(result.response.text());
}
