import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Habit, DailyRecord } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Habit name is required" }, { status: 400 });
        }

        await connectToDatabase();

        // Check for existing habit with the same name (excluding current)
        const existing = await Habit.findOne({
            userId: session.user.id,
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
            _id: { $ne: params.id }
        });

        if (existing) {
            return NextResponse.json({ error: "A habit with this name already exists" }, { status: 400 });
        }

        const updatedHabit = await Habit.findOneAndUpdate(
            { _id: params.id, userId: session.user.id },
            { name: name.trim() },
            { returnDocument: 'after' }
        );

        if (!updatedHabit) {
            return NextResponse.json({ error: "Habit not found" }, { status: 404 });
        }

        return NextResponse.json(updatedHabit);
    } catch (error) {
        console.error("Failed to update habit:", error);
        return NextResponse.json({ error: "Failed to update habit" }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const deletedHabit = await Habit.findOneAndDelete({ _id: params.id, userId: session.user.id });

        if (!deletedHabit) {
            return NextResponse.json({ error: "Habit not found" }, { status: 404 });
        }

        // Also remove this habit from all DailyRecords of THIS user
        await DailyRecord.updateMany(
            { userId: session.user.id },
            { $pull: { habitIds: params.id } }
        );

        return NextResponse.json({ success: true, id: params.id });
    } catch (error) {
        console.error("Failed to delete habit:", error);
        return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
    }
}
