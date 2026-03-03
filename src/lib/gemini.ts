import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface OptimizationResult {
    optimizedLatex: string;
    fitPercentage: number;
    analysis: string;
    recommendation: "Apply" | "Refine" | "Caution";
}

export async function optimizeResume(
    userResumes: { content: string; format: 'latex' | 'text' }[],
    jobDescription: string,
    masterTemplates: { name: string; content: string }[],
    tempContent?: string,
    userInfo?: { name: string; email: string }
): Promise<OptimizationResult> {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY is not configured in .env");
    }

    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Include temporary content as an additional source if provided
    const allSources = [...userResumes];
    if (tempContent && tempContent.trim() !== '') {
        allSources.push({ content: tempContent, format: 'text' });
    }

    const prompt = `
You are an ELITE AI Resume Architect and Senior Recruiter specializing in Applicant Tracking Systems (ATS) optimization for top-tier tech and corporate positions.
Your mission is to construct the ultimate, perfectly tailored, 1-page LaTeX resume by strictly extracting, analyzing, and synthesizing an applicant's "Experience Pool" against a target Job Description (JD).

================================================================================
SECTION 1: MISSION DIRECTIVES & STRICT CONSTRAINTS
================================================================================
1.  **THE "1-TO-1 SWAP" LENGTH RULE (ABSOLUTE 1-PAGE LIMIT)**:
    *   AI models cannot 'see' physical A4 pages. Therefore, you MUST use the chosen Base Template (either the user's best LaTeX CV or the Master Template) as a strict container.
    *   You MUST NOT randomly append new projects. If you add a bullet or a project from Source 2 into Source 1, you MUST REMOVE an equally long bullet/project from Source 1.
    *   Maintain the EXACT SAME approximate word count and number of bullet points as the chosen Base Template. DO NOT mess with the LaTeX spacing macros, font sizes, or margins to cheat the system. Fit the content to the existing structure.
2.  **LATEX ARCHITECTURE SELECTION**:
    *   Review the 4 provided Source CVs. Select the ONE clean, most professional LaTeX structure to act as the "Base Container".
    *   If the user ONLY provided raw text or their LaTeX is fundamentally broken, you MUST use one of the provided "MASTER LATEX TEMPLATES" as the Base Container.
    *   Do NOT invent your own document classes or obscure packages. Rely on standard macros (article, tabular, itemize, etc.).
3.  **NO HALLUCINATIONS**: You are strictly forbidden from inventing companies, degrees, metrics, or roles. You may ONLY use facts present in the Experience Pool.
4.  **SYNTHESIS RULE**: Your goal is NOT to copy-paste all 4 CVs together. You must read ALL sources, extract the best bullets for the JD, and weave them into the ONE chosen Base Container.

================================================================================
SECTION 2: APPLICANT TRACKING SYSTEM (ATS) OPTIMIZATION PROTOCOLS
================================================================================
1.  **KEYWORD INTEGRATION**:
    *   Analyze the Job Description for hard skills, soft skills, tools, and methodologies.
    *   Organize these keywords organically into the resume (e.g., in a "Skills" section and woven into experience bullets).
    *   Aim for a Keyword Density of at least 80% with the JD's core requirements.
2.  **THE "XYZ" BULLET POINT FRAMEWORK**:
    *   Every experience bullet MUST follow Google's "Accomplished [X] as measured by [Y], by doing [Z]" format.
    *   Start every bullet with a strong, diverse Action Verb (e.g., Architected, Spearheaded, Engineered, Orchestrated). Do not repeat action verbs within the same role.
    *   Wherever possible, quantify results with numbers, percentages, or scale based on the provided data. If no numbers exist in the source, focus on the business impact.
3.  **READABILITY & PARSING**:
    *   Avoid complex tables or nested text boxes in LaTeX that break simple text extraction. ATS systems must be able to read top-to-bottom, left-to-right.
    *   Use standard section headings (e.g., "Experience", "Education", "Skills", "Projects"). Do not use overly creative headings.

================================================================================
SECTION 3: CONTENT EXTRACTION & MAPPING LOGIC
================================================================================
1.  **Contact Info (STRICT HIERARCHY)**: 
    *   CRITICAL: Do NOT under ANY circumstances use the name, email, phone number, LinkedIn, or GitHub from the "MASTER LATEX TEMPLATES". That is dummy data.
    *   **PRIORITY 1**: You MUST extract the real contact info (Name, Email, Phone, LinkedIn) from the "USER EXPERIENCE POOL" (Source 1, 2, 3, or 4). Use this above all else.
    *   **PRIORITY 2**: ONLY if the user's provided CVs/text completely lack a name or email, use this fallback session info: Name: ${userInfo?.name || "[Your Name]"}, Email: ${userInfo?.email || "[Your Email]"}. Use random placeholders like "+1 234 567 8900" for missing phone numbers.
2.  **Summary/Objective**: If used in the template, write a 2-3 sentence high-impact summary directly aligning the applicant's core identity with the JD's top requirement.
3.  **Experience**: Order chronologically (newest first). Select ONLY the roles and bullets that prove competence for the JD. If a past role is irrelevant, minimize it to just Title/Company/Dates.
4.  **Projects**: Include standalone projects ONLY if they bridge a skill gap not covered by work experience.
5.  **Education**: Keep concise. Include degree, university, and dates. Remove GPA unless it's explicitly mentioned as a highlight in the source.

================================================================================
SECTION 4: INPUT DATA
================================================================================

[BEGIN TARGET JOB DESCRIPTION]
${jobDescription}
[END TARGET JOB DESCRIPTION]

[BEGIN USER EXPERIENCE POOL (Source Material)]
${allSources.map((r, i) => `--- SOURCE ${i + 1} (${r.format.toUpperCase()}) ---\n${r.content}\n-----------------------------`).join("\n\n")}
[END USER EXPERIENCE POOL]

[BEGIN MASTER LATEX TEMPLATES (Use ONLY if needed based on Directive 2)]
${masterTemplates.map(t => `--- TEMPLATE: ${t.name} ---\n${t.content}\n-----------------------------`).join("\n\n")}
[END MASTER LATEX TEMPLATES]

================================================================================
SECTION 4: FINAL EVALUATION & SCORING (STRICT PROTOCOL)
================================================================================
1.  **Fit Percentage calculation (BRUTALLY REALISTIC)**: 
    *   Do NOT default to 85%. This must be a calculated number based on:
        - **Keywords (40%)**: Percentage of JD-required hard skills found in the resume.
        - **Seniority (30%)**: Does the years of experience and level (e.g., Junior vs Senior) match?
        - **Industry (20%)**: Does the applicant have domain knowledge relevant to the JD?
        - **ATS Readability (10%)**: How well does the content parse?
    *   Scoring Brackets:
        - **90-100%**: Near-perfect match.
        - **70-89%**: Strong candidate with minor gaps.
        - **50-69%**: Potential match requiring significant upskilling or framing.
        - **Below 50%**: Poor fit.
    *   If a user provides a "Junior" CV for a "Senior Staff Engineer" JD, the score MUST be low (e.g., 40-50%).
2.  **Analysis**: Provide 3 bullets: 
    - [Strength]: What makes them a great fit?
    - [Gap]: What is missing?
    - [Optimization]: What did you change to bridge the gap?
3.  **Recommendation**: A 1-sentence decision: "Strong Apply", "Apply with Caution", or "Upskill First".

================================================================================
SECTION 5: OUTPUT REQUIREMENTS
================================================================================
Respond EXACTLY in this JSON structure. Do NOT include markdown blocks (\`\`\`json) or any conversational text around it.

{
    "optimizedLatex": "string containing the fully compilable LaTeX code. Ensure all special characters (%, &, $, #, _, {, }, ~, ^, \\\\) are properly escaped for JSON and LaTeX.",
    "fitPercentage": number, // An integer (0-100) calculated based on the "FINAL EVALUATION & SCORING" protocol.
    "analysis": "string detailing your architectural decisions. Explain WHICH keywords you prioritized, WHICH projects you selected from the pool, and exactly WHY this resume will pass the ATS for this specific job.",
    "recommendation": "string" // MUST be exactly one of: "Strong Apply", "Apply with Caution", or "Upskill First".
}

REMEMBER: Return ONLY valid JSON.
    `;

    // Define the schema for structured output to ensure reliability
    const schema = {
        type: "object",
        properties: {
            optimizedLatex: { type: "string" },
            fitPercentage: { type: "number" },
            analysis: {
                type: "array",
                items: { type: "string" }
            },
            recommendation: { type: "string" }
        },
        required: ["optimizedLatex", "fitPercentage", "analysis", "recommendation"]
    };

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema as any
            }
        });

        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Gemini optimization error:", error);
        throw new Error("Failed to optimize resume with AI");
    }
}
