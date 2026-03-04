import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Resume } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { optimizeResume } from "@/lib/gemini";
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

        // 1. Fetch user's "Experience Pool" (custom resumes marked as base)
        const userPool = await Resume.find({
            userId: session.user.id,
            actsAsBase: true,
            isMasterTemplate: false
        });

        // 2. Find the Structural Anchor (Priority CV)
        const anchor = await Resume.findOne({
            userId: session.user.id,
            isAnchor: true
        });

        // 3. Fetch Master Templates for structural fallback
        const masterTemplates = await Resume.find({ isMasterTemplate: true });

        // 4. AI Orchestration
        const result = await optimizeResume(
            userPool.map(r => ({ content: r.content, format: r.format })),
            jobDescription,
            masterTemplates.map(t => ({ name: t.name, content: t.content })),
            anchor ? { content: anchor.content, format: anchor.format } : undefined,
            tempContent,
            { name: session.user.name || '', email: session.user.email || '' }
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("AI Optimization failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process mission" },
            { status: 500 }
        );
    }
}
