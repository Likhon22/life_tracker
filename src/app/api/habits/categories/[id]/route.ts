import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { HabitCategory, Habit } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, icon } = await request.json();
        if (!name || !icon) {
            return NextResponse.json({ error: "Name and icon are required" }, { status: 400 });
        }

        await connectToDatabase();

        const existing = await HabitCategory.findOne({
            userId: session.user.id,
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
            _id: { $ne: params.id }
        });
        if (existing) {
            return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
        }

        const updated = await HabitCategory.findOneAndUpdate(
            { _id: params.id, userId: session.user.id },
            { name: name.trim(), icon },
            { returnDocument: "after" }
        );

        if (!updated) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update habit category:", error);
        return NextResponse.json({ error: "Failed to update habit category" }, { status: 500 });
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

        const habitCount = await Habit.countDocuments({ categoryId: params.id, userId: session.user.id });
        if (habitCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete a category that still has habits in it. Move or delete those habits first." },
                { status: 400 }
            );
        }

        const deleted = await HabitCategory.findOneAndDelete({ _id: params.id, userId: session.user.id });
        if (!deleted) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, id: params.id });
    } catch (error) {
        console.error("Failed to delete habit category:", error);
        return NextResponse.json({ error: "Failed to delete habit category" }, { status: 500 });
    }
}
