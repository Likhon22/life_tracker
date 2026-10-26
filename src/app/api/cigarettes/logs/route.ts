import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { CigaretteLog, CigaretteBrand } from "@/models";
import { createLinkedExpense } from "@/lib/cigaretteSync";
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
        const logs = await CigaretteLog.find({
            userId: session.user.id,
            date: { $regex: `^${month}` }
        }).populate("brandId").sort({ date: -1, createdAt: -1 });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Failed to fetch cigarette logs:", error);
        return NextResponse.json({ error: "Failed to fetch cigarette logs" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { date, brandId, quantity, amount, isSelf, note } = await request.json();
        if (!date || !brandId || !quantity || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectToDatabase();

        const brand = await CigaretteBrand.findOne({ _id: brandId, userId: session.user.id });
        if (!brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        const expense = await createLinkedExpense({
            userId: session.user.id,
            date,
            amount,
            quantity,
            brandName: brand.name,
            isSelf: isSelf ?? true,
        });

        const log = await CigaretteLog.create({
            userId: session.user.id,
            date,
            brandId,
            quantity,
            amount,
            isSelf: isSelf ?? true,
            note,
            financeExpenseId: expense._id,
        });

        const populatedLog = await CigaretteLog.findById(log._id).populate("brandId");
        return NextResponse.json(populatedLog, { status: 201 });
    } catch (error) {
        console.error("Failed to create cigarette log:", error);
        return NextResponse.json({ error: "Failed to create cigarette log" }, { status: 500 });
    }
}
