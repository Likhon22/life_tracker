import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Resume } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateCombinedCV } from "@/lib/gemini/generate";
import { ProjectSlot, ExperienceSwap, SkillCategory } from "@/lib/gemini/analysis";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ip = request.headers.get("x-forwarded-for") || "anonymous";
        const limitResult = rateLimit(`generate_${ip}`, 3, 2 * 60 * 1000);

        if (!limitResult.success) {
            return NextResponse.json(
                { error: "Too many generation requests. Please wait 2 minutes." },
                { status: 429 }
            );
        }

        // Receive the full blueprint from the frontend (already computed by /optimize)
        const { jobDescription, projectSlots, experienceSwaps, skillConsolidation } = await request.json() as {
            jobDescription: string;
            projectSlots: ProjectSlot[];
            experienceSwaps: ExperienceSwap[];
            skillConsolidation: SkillCategory[];
        };

        if (!jobDescription || !projectSlots) {
            return NextResponse.json({ error: "Job description and blueprint are required" }, { status: 400 });
        }

        await connectToDatabase();

        const userPool = await Resume.find({
            userId: session.user.id,
            isMasterTemplate: false
        });

        if (userPool.length === 0) {
            return NextResponse.json({ error: "VAULT_EMPTY" }, { status: 400 });
        }

        // Priority CV must be LaTeX
        const priorityCv = userPool.find(r => r.isAnchor && r.format === 'latex')
            || userPool.find(r => r.format === 'latex');

        if (!priorityCv) {
            return NextResponse.json(
                { error: "A LaTeX CV must be saved in your Vault to generate a combined LaTeX document." },
                { status: 400 }
            );
        }

        // Validate completeness
        const latex = priorityCv.content;
        const missingParts: string[] = [];
        if (!latex.includes('\\documentclass')) missingParts.push('\\documentclass{...} (preamble)');
        if (!latex.includes('\\begin{document}')) missingParts.push('\\begin{document}');
        if (!latex.includes('\\end{document}')) missingParts.push('\\end{document}');

        if (missingParts.length > 0) {
            return NextResponse.json({
                error: `INCOMPLETE_LATEX`,
                details: `Your Priority CV "${priorityCv.name}" is missing: ${missingParts.join(', ')}. Please update it with a complete LaTeX document before generating.`
            }, { status: 400 });
        }

        const result = await generateCombinedCV({
            userResumes: userPool.map(r => ({ content: r.content, format: r.format, name: r.name })),
            jobDescription,
            priorityCv: { content: priorityCv.content, name: priorityCv.name },
            projectSlots,
            experienceSwaps,
            skillConsolidation,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("CV Generation failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate CV" },
            { status: 500 }
        );
    }
}
