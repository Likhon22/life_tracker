import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FinanceExpense } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        await connectToDatabase();

        // Ensure the expense belongs to the user
        const expense = await FinanceExpense.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { ...body },
            { returnDocument: 'after' }
        ).populate("categoryId");

        if (!expense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Failed to update expense:", error);
        return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();
        const result = await FinanceExpense.deleteOne({ _id: id, userId: session.user.id });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Failed to delete expense:", error);
        return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
    }
}
