import { NextResponse } from "next/server";
import mongoose from "mongoose";
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

        const { date, brandId, quantity, amount, consumedBySelf, paidBySelf, note } = await request.json();
        if (!date || !brandId || !quantity || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectToDatabase();

        const brand = await CigaretteBrand.findOne({ _id: brandId, userId: session.user.id });
        if (!brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        const resolvedConsumedBySelf = consumedBySelf ?? true;
        const resolvedPaidBySelf = paidBySelf ?? true;

        // The log and its linked Finance expense (when you're the one who paid) are written
        // in one transaction: either both land or neither does.
        const dbSession = await mongoose.startSession();
        let logId;
        try {
            await dbSession.withTransaction(async () => {
                // Only your own money creates a Finance entry — a friend paying for your
                // cigarette isn't your expense, so nothing gets added to cost.
                const expenseId = resolvedPaidBySelf
                    ? (await createLinkedExpense({
                        userId: session.user.id,
                        date,
                        amount,
                        quantity,
                        brandName: brand.name,
                        consumedBySelf: resolvedConsumedBySelf,
                    }, dbSession))._id
                    : undefined;

                const [log] = await CigaretteLog.create([{
                    userId: session.user.id,
                    date,
                    brandId,
                    quantity,
                    amount,
                    consumedBySelf: resolvedConsumedBySelf,
                    paidBySelf: resolvedPaidBySelf,
                    note,
                    financeExpenseId: expenseId,
                }], { session: dbSession });

                logId = log._id;
            });
        } finally {
            await dbSession.endSession();
        }

        const populatedLog = await CigaretteLog.findById(logId).populate("brandId");
        return NextResponse.json(populatedLog, { status: 201 });
    } catch (error) {
        console.error("Failed to create cigarette log:", error);
        return NextResponse.json(
            { error: "Couldn't save the log — the cost couldn't be recorded in Finance, so nothing was saved. Please try again." },
            { status: 500 }
        );
    }
}
