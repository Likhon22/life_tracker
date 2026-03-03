import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FinanceBudget } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month"); // YYYY-MM

        if (!month) {
            return NextResponse.json({ error: "Month is required" }, { status: 400 });
        }

        await connectToDatabase();
        const budget = await FinanceBudget.findOne({ userId: session.user.id, month });

        return NextResponse.json(budget || { amount: 0, month });
    } catch (error) {
        console.error("Failed to fetch budget:", error);
        return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { month, amount } = await request.json();
        if (!month || amount === undefined) {
            return NextResponse.json({ error: "Month and amount are required" }, { status: 400 });
        }

        await connectToDatabase();
        const budget = await FinanceBudget.findOneAndUpdate(
            { userId: session.user.id, month },
            { amount },
            { upsert: true, returnDocument: 'after' }
        );

        return NextResponse.json(budget);
    } catch (error) {
        console.error("Failed to update budget:", error);
        return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
    }
}
