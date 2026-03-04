import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Resume } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { analyzeResume } from "@/lib/gemini/analysis";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate Limiting: 5 requests per 1 minute
        const ip = request.headers.get("x-forwarded-for") || "anonymous";
        const limitResult = rateLimit(`optimize_${ip}`, 5, 60 * 1000);

        if (!limitResult.success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again in a minute." },
                {
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((limitResult.reset - Date.now()) / 1000).toString()
                    }
                }
            );
        }

        const { jobDescription, tempContent } = await request.json();
        if (!jobDescription) {
            return NextResponse.json({ error: "Job description is required" }, { status: 400 });
        }

        await connectToDatabase();

        // 1. Fetch all user's saved CVs (the Experience Pool)
        const userPool = await Resume.find({
            userId: session.user.id,
            isMasterTemplate: false
        });

        // 2. Require at least 1 saved CV
        if (userPool.length === 0) {
            return NextResponse.json({ error: "VAULT_EMPTY" }, { status: 400 });
        }

        // 3. Find the Priority CV (Anchor), fallback to first
        const anchor = userPool.find(r => r.isAnchor) || userPool[0];

        // 4. AI Analysis
        const result = await analyzeResume({
            userResumes: userPool.map(r => ({ content: r.content, format: r.format, name: r.name })),
            jobDescription,
            anchorResume: { content: anchor.content, format: anchor.format, name: anchor.name },
            tempContent,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("AI Analysis failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process mission" },
            { status: 500 }
        );
    }
}
