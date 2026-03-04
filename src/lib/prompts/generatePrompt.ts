import { ProjectSlot, ExperienceSwap, SkillCategory } from "../gemini/analysis";

export interface GeneratePromptParams {
   priorityCv: string;
   poolSection: string;
   jobDescription: string;
   projectSlots: ProjectSlot[];
   experienceSwaps: ExperienceSwap[];
   skillConsolidation: SkillCategory[];
}

export function buildGeneratePrompt({ priorityCv, poolSection, jobDescription, projectSlots, experienceSwaps, skillConsolidation }: GeneratePromptParams): string {
   const projectInstructions = (projectSlots || []).map(slot => {
      if (slot.action === 'KEEP') {
         return `  Slot ${slot.slotNumber} (${slot.currentProject}): KEEP as-is${slot.textTweaks ? `. Minor tweak: ${slot.textTweaks}` : ''}`;
      }
      return `  Slot ${slot.slotNumber}: REPLACE "${slot.currentProject}" → use "${slot.recommendedProject}" (from ${slot.sourceCv}). Reason: ${slot.reason}. ${slot.textTweaks ? `Text tweak: ${slot.textTweaks}` : ''}`;
   }).join('\n');

   const experienceInstructions = (experienceSwaps || []).map(exp => {
      const bulletLines = (exp.bullets || []).map((b, i) => {
         if (b.action === 'KEEP') return `    Bullet ${i + 1}: KEEP (starts with "${b.originalPreview}")`;
         if (b.action === 'TWEAK') return `    Bullet ${i + 1}: TWEAK — replace with: "${b.newContent}"`;
         return `    Bullet ${i + 1}: REPLACE — use this content (from ${b.sourceCv}): "${b.newContent}"`;
      }).join('\n');
      return `  Role: ${exp.role}\n${bulletLines}`;
   }).join('\n\n');

   const skillInstructions = (skillConsolidation || []).map(cat =>
      `  ${cat.category}: ${(cat.skills || []).join(', ')}`
   ).join('\n');

   return `
You are a RegEx Find-and-Replace Engine — NOT an AI writer or creative assistant.
Your ONLY job is to apply a precise, pre-computed content blueprint to an existing LaTeX resume.
You MUST NOT rewrite, restructure, expand, or creatively improve anything.

================================================================================
PRIORITY CV (YOUR IMMUTABLE STRUCTURE — COPY BYTE FOR BYTE, EXCEPT WHERE INSTRUCTED)
================================================================================
${priorityCv}

================================================================================
EXPERIENCE POOL (Reference for content specified in the blueprint below)
================================================================================
${poolSection}

================================================================================
JOB DESCRIPTION (Context only — do NOT use this to invent new content)
================================================================================
${jobDescription}

================================================================================
CONTENT BLUEPRINT — APPLY EXACTLY THESE CHANGES, NOTHING MORE
================================================================================

PROJECT SLOTS:
${projectInstructions}

EXPERIENCE BULLET CHANGES:
${experienceInstructions}

SKILLS SECTION — use this exact skill set:
${skillInstructions}

================================================================================
ABSOLUTE RULES — VIOLATION = MISSION FAILURE
================================================================================
1.  **BYTE-FOR-BYTE CLONE**: Copy everything in the Priority CV exactly. Only change what the blueprint above specifies.
2.  **LENGTH INVARIANT**: The total line count must NOT change. If you replace a project, the new project description must occupy the same number of lines as the old one. Trim or pad to match.
3.  **HEADER LOCKDOWN**: Every line before the first \\section{} command must be copied 100% verbatim. DO NOT touch the name, email, \\href links, phone, or tabularx structure.
4.  **INLINE SEPARATOR**: In the header, link separators use "\\ $|$ \\ " (backslash-space, pipe, backslash-space) — DO NOT convert this to "\\\\" (double backslash). That would break the layout.
5.  **NO TRUNCATION**: Return the ENTIRE document including \\end{document}. Stopping early = catastrophic failure.
6.  **ENVIRONMENT BALANCING**: Every \\begin{...} MUST have \\end{...}.
7.  **NO NEW PACKAGES**: Do NOT add \\usepackage{} that are not in the Priority CV. Forbidden: fontspec.
8.  **\\\\[Xpt] SAFETY**: The sequence \\\\[6pt] must remain \\\\[6pt]. Do not collapse to \\[6pt].

Return ONLY a valid JSON object:
{
  "optimizedLatex": "string: the complete, compilable LaTeX document"
}
`;
}
