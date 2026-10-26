import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { CigaretteLog, CigaretteBrand, FinanceExpense } from "@/models";
import { syncLinkedExpense } from "@/lib/cigaretteSync";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { date, brandId, quantity, amount, isSelf, note } = await request.json();

        await connectToDatabase();

        const existingLog = await CigaretteLog.findOne({ _id: params.id, userId: session.user.id });
        if (!existingLog) {
            return NextResponse.json({ error: "Log not found" }, { status: 404 });
        }

        const nextBrandId = brandId ?? existingLog.brandId;
        const brand = await CigaretteBrand.findOne({ _id: nextBrandId, userId: session.user.id });
        if (!brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        const update = {
            date: date ?? existingLog.date,
            brandId: nextBrandId,
            quantity: quantity ?? existingLog.quantity,
            amount: amount ?? existingLog.amount,
            isSelf: isSelf ?? existingLog.isSelf,
            note: note ?? existingLog.note,
        };

        const updatedLog = await CigaretteLog.findOneAndUpdate(
            { _id: params.id, userId: session.user.id },
            update,
            { returnDocument: "after" }
        ).populate("brandId");

        if (updatedLog?.financeExpenseId) {
            await syncLinkedExpense(updatedLog.financeExpenseId, {
                date: update.date,
                amount: update.amount,
                quantity: update.quantity,
                brandName: brand.name,
                isSelf: update.isSelf,
            });
        }

        return NextResponse.json(updatedLog);
    } catch (error) {
        console.error("Failed to update cigarette log:", error);
        return NextResponse.json({ error: "Failed to update cigarette log" }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const deletedLog = await CigaretteLog.findOneAndDelete({ _id: params.id, userId: session.user.id });
        if (!deletedLog) {
            return NextResponse.json({ error: "Log not found" }, { status: 404 });
        }

        if (deletedLog.financeExpenseId) {
            await FinanceExpense.deleteOne({ _id: deletedLog.financeExpenseId, userId: session.user.id });
        }

        return NextResponse.json({ success: true, id: params.id });
    } catch (error) {
        console.error("Failed to delete cigarette log:", error);
        return NextResponse.json({ error: "Failed to delete cigarette log" }, { status: 500 });
    }
}
