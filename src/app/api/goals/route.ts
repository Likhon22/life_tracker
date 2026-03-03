import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { DailyGoal } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");

        if (!date) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        await connectToDatabase();
        const goals = await DailyGoal.find({
            userId: session.user.id,
            date
        }).sort({ order: 1, createdAt: 1 });

        return NextResponse.json(goals);
    } catch (error) {
        console.error("Failed to fetch goals:", error);
        return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text, date } = await request.json();
        if (!text || !date) {
            return NextResponse.json({ error: "Text and date are required" }, { status: 400 });
        }

        await connectToDatabase();

        // Simple order logic: get highest current order + 1
        const lastGoal = await DailyGoal.findOne({ userId: session.user.id, date }).sort({ order: -1 });
        const order = lastGoal ? lastGoal.order + 1 : 0;

        const goal = await DailyGoal.create({
            userId: session.user.id,
            text,
            date,
            order,
            completed: false
        });

        return NextResponse.json(goal, { status: 201 });
    } catch (error) {
        console.error("Failed to create goal:", error);
        return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
    }
}
