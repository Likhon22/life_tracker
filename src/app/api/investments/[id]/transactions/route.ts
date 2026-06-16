import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { InvestmentTransaction } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const { type, amount, date, note } = await request.json();

        if (!type || !amount || !date) {
            return NextResponse.json({ error: "Type, amount, and date are required" }, { status: 400 });
        }

        await connectToDatabase();
        const transaction = await InvestmentTransaction.create({
            userId: session.user.id,
            investmentId: id,
            type,
            amount,
            date,
            note
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to add transaction" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await connectToDatabase();

        await InvestmentTransaction.deleteOne({ _id: id, userId: session.user.id });
        return NextResponse.json({ message: "Transaction deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
    }
}
