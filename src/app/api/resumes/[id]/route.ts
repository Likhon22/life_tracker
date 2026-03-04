import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Resume } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        await connectToDatabase();

        // If setting as anchor, unset others
        if (body.isAnchor === true) {
            await Resume.updateMany(
                { userId: session.user.id, _id: { $ne: id } },
                { $set: { isAnchor: false } }
            );
        }

        // Ensure user owns the resume
        const resume = await Resume.findOne({ _id: id, userId: session.user.id });
        if (!resume) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        const updatedResume = await Resume.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true }
        );

        return NextResponse.json(updatedResume);
    } catch (error) {
        console.error("Failed to update resume:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();

        const result = await Resume.deleteOne({ _id: id, userId: session.user.id });
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("Failed to delete resume:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
