import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FinanceFixedCost } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { month } = await request.json();
        if (!month) {
            return NextResponse.json({ error: "Month is required" }, { status: 400 });
        }

        await connectToDatabase();

        // Check if current month already has records
        const existing = await FinanceFixedCost.find({ userId: session.user.id, month });
        if (existing.length > 0) {
            return NextResponse.json({ error: "Current month already has fixed costs" }, { status: 400 });
        }

        // Find most recent past month with records
        const lastRecord = await FinanceFixedCost.findOne({
            userId: session.user.id,
            month: { $lt: month }
        }).sort({ month: -1 });

        if (!lastRecord) {
            return NextResponse.json({ error: "No past records found to import" }, { status: 404 });
        }

        const recentMonth = lastRecord.month;
        const recentCosts = await FinanceFixedCost.find({ userId: session.user.id, month: recentMonth });

        // Clone them
        const newCostsItems = recentCosts.map(cost => ({
            userId: session.user.id,
            month,
            name: cost.name,
            amount: cost.amount
        }));

        await FinanceFixedCost.insertMany(newCostsItems);
        const updatedFixedCosts = await FinanceFixedCost.find({ userId: session.user.id, month });

        return NextResponse.json(updatedFixedCosts);
    } catch (error) {
        console.error("Failed to import fixed costs:", error);
        return NextResponse.json({ error: "Failed to import fixed costs" }, { status: 500 });
    }
}
