import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Resume } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch user's custom resumes + master templates
        const resumes = await Resume.find({
            $or: [
                { userId: session.user.id },
                { isMasterTemplate: true }
            ]
        }).sort({ createdAt: -1 });

        return NextResponse.json(resumes);
    } catch (error) {
        console.error("Failed to fetch resumes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, content, format = 'latex', actsAsBase = true } = await request.json();

        if (!name || !content) {
            return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
        }

        await connectToDatabase();

        // Enforce 4-item limit for custom resumes
        const customCount = await Resume.countDocuments({
            userId: session.user.id,
            isMasterTemplate: false
        });

        if (customCount >= 4) {
            return NextResponse.json({ error: "Maximum of 4 custom resumes allowed" }, { status: 400 });
        }

        // Check if this is the first LaTeX resume for the user to auto-anchor it
        const existingLatexCount = await Resume.countDocuments({
            userId: session.user.id,
            format: 'latex',
            isMasterTemplate: false
        });

        const newResume = await Resume.create({
            userId: session.user.id,
            name,
            content,
            format,
            actsAsBase,
            isAnchor: format === 'latex' && existingLatexCount === 0,
            isMasterTemplate: false
        });

        return NextResponse.json(newResume, { status: 201 });
    } catch (error) {
        console.error("Failed to create resume:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
