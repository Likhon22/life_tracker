import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Investment, InvestmentTransaction } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");

        await connectToDatabase();

        const filter: any = { userId: session.user.id };
        if (categoryId) filter.categoryId = categoryId;

        const investments = await Investment.find(filter).populate("categoryId").sort({ createdAt: -1 });

        // Aggregate transactions for each investment
        const result = await Promise.all(investments.map(async (inv) => {
            const transactions = await InvestmentTransaction.find({ investmentId: inv._id }).sort({ date: -1 });
            const totalInvested = transactions.filter(t => t.type === 'invest').reduce((sum: number, t: any) => sum + t.amount, 0);
            const totalWithdrawn = transactions.filter(t => t.type === 'withdraw').reduce((sum: number, t: any) => sum + t.amount, 0);

            return {
                ...inv.toJSON(),
                transactions: transactions.map(t => t.toJSON()),
                totalInvested,
                totalWithdrawn,
                activeCapital: totalInvested - totalWithdrawn,
                pnl: totalWithdrawn - totalInvested
            };
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to fetch investments:", error);
        return NextResponse.json({ error: "Failed to fetch investments" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name, categoryId, note } = await request.json();
        if (!name || !categoryId) return NextResponse.json({ error: "Name and category required" }, { status: 400 });

        await connectToDatabase();
        const investment = await Investment.create({ userId: session.user.id, name, categoryId, note });
        const populated = await Investment.findById(investment._id).populate("categoryId");

        return NextResponse.json({
            ...populated!.toJSON(),
            transactions: [],
            totalInvested: 0,
            totalWithdrawn: 0,
            activeCapital: 0,
            pnl: 0
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create investment" }, { status: 500 });
    }
}
