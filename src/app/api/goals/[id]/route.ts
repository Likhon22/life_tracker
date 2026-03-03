import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { DailyGoal } from "@/models";
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
        const goal = await DailyGoal.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { $set: body },
            { new: true, returnDocument: 'after' }
        );

        if (!goal) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        return NextResponse.json(goal);
    } catch (error) {
        console.error("Failed to update goal:", error);
        return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
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
        const result = await DailyGoal.deleteOne({ _id: id, userId: session.user.id });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Goal deleted" });
    } catch (error) {
        console.error("Failed to delete goal:", error);
        return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
    }
}
