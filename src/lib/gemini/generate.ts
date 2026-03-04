import { getGeminiModel } from "./client";
import { buildGeneratePrompt } from "../prompts/generatePrompt";
import { ProjectSlot, ExperienceSwap, SkillCategory } from "./analysis";

export interface GenerateResult {
    optimizedLatex: string;
}

interface GenerateCvParams {
    userResumes: { content: string; format: 'latex' | 'text'; name: string }[];
    jobDescription: string;
    priorityCv: { content: string; name: string };
    // Structured blueprint from the analysis step — no re-analysis needed
    projectSlots: ProjectSlot[];
    experienceSwaps: ExperienceSwap[];
    skillConsolidation: SkillCategory[];
}

export async function generateCombinedCV({ userResumes, jobDescription, priorityCv, projectSlots, experienceSwaps, skillConsolidation }: GenerateCvParams): Promise<GenerateResult> {
    const model = getGeminiModel();

    const poolSection = userResumes
        .map((r, i) => `--- CV ${i + 1}: ${r.name} (${r.format.toUpperCase()}) ---\n${r.content}\n---`)
        .join('\n\n');

    const prompt = buildGeneratePrompt({
        priorityCv: priorityCv.content,
        poolSection,
        jobDescription,
        projectSlots,
        experienceSwaps,
        skillConsolidation
    });

    const schema = {
        type: "object",
        properties: {
            optimizedLatex: { type: "string" }
        },
        required: ["optimizedLatex"]
    };

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema as any
        }
    });

    const parsed = JSON.parse(result.response.text());
    const fixed = fixLatexBackslashes(parsed.optimizedLatex);
    return { optimizedLatex: fixed };
}

/**
 * Repairs backslash mangling caused by JSON encoding/decoding of LaTeX.
 */
function fixLatexBackslashes(latex: string): string {
    // Fix 1: \[<length>] → \\[<length>]  (line-break + vspace lost a backslash via JSON)
    let fixed = latex.replace(/(?<!\\)\\\[(\d+(?:\.\d+)?(?:pt|em|ex|mm|cm|in))\]/g, '\\\\[$1]');

    // Fix 2: $|$ \\ (newline) \href → $|$ \ (newline) \href
    // The AI turns the inline link separator `\ $|$ \` into `\ $|$ \\` (hard newline),
    // collapsing the horizontal header row into a vertical column.
    fixed = fixed.replace(
        /(\$\|\$\s*)\\\\(\r?\n\s*\\(?:href|raisebox))/g,
        '$1\\ $2'
    );

    return fixed;
}
