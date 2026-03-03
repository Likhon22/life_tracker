import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Habit } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { habitIds } = await request.json();

        if (!habitIds || !Array.isArray(habitIds)) {
            return NextResponse.json(
                { error: "habitIds array is required" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Perform bulk update of the order for each habit
        const updatePromises = habitIds.map((id, index) =>
            Habit.findOneAndUpdate(
                { _id: id, userId: session.user.id },
                { order: index }
            )
        );

        await Promise.all(updatePromises);

        return NextResponse.json({ message: "Reordered successfully" });
    } catch (error) {
        console.error("Failed to reorder habits:", error);
        return NextResponse.json(
            { error: "Failed to reorder habits" },
            { status: 500 }
        );
    }
}
