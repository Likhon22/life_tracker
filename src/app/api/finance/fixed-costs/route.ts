import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FinanceFixedCost } from "@/models";
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
        const fixedCosts = await FinanceFixedCost.find({ userId: session.user.id, month });

        return NextResponse.json(fixedCosts);

        return NextResponse.json(fixedCosts);
    } catch (error) {
        console.error("Failed to fetch fixed costs:", error);
        return NextResponse.json({ error: "Failed to fetch fixed costs" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { month, name, amount } = await request.json();
        if (!month || !name || amount === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectToDatabase();
        const fixedCost = await FinanceFixedCost.create({
            userId: session.user.id,
            month,
            name,
            amount
        });

        return NextResponse.json(fixedCost, { status: 201 });
    } catch (error) {
        console.error("Failed to create fixed cost:", error);
        return NextResponse.json({ error: "Failed to create fixed cost" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    // We can handle delete/update via a similar pattern as expenses or just a simpler update if we have the ID
    // For simplicity, let's assume we pass ID in the body for Fixed Costs or handle via a dynamic route if needed.
    // Actually, I'll add the [id] dynamic route for Fixed Costs too to be consistent.
}
