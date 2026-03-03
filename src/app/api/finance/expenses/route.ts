import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FinanceExpense } from "@/models";
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
        const expenses = await FinanceExpense.find({
            userId: session.user.id,
            month
        }).populate("categoryId").sort({ date: -1, createdAt: -1 });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { date, amount, categoryId, note } = await request.json();
        if (!date || !amount || !categoryId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const month = date.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD

        await connectToDatabase();
        const expense = await FinanceExpense.create({
            userId: session.user.id,
            date,
            month,
            amount,
            categoryId,
            note
        });

        const populatedExpense = await FinanceExpense.findById(expense._id).populate("categoryId");

        return NextResponse.json(populatedExpense, { status: 201 });
    } catch (error) {
        console.error("Failed to create expense:", error);
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }
}
