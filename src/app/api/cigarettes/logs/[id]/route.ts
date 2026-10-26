import { NextResponse } from "next/server";
import mongoose from "mongoose";
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

        // The log update and its linked Finance expense update happen in one transaction,
        // so the two can't end up showing different amounts/dates if one write fails.
        const dbSession = await mongoose.startSession();
        try {
            await dbSession.withTransaction(async () => {
                await CigaretteLog.updateOne(
                    { _id: params.id, userId: session.user.id },
                    update,
                    { session: dbSession }
                );

                if (existingLog.financeExpenseId) {
                    await syncLinkedExpense(existingLog.financeExpenseId, {
                        date: update.date,
                        amount: update.amount,
                        quantity: update.quantity,
                        brandName: brand.name,
                        isSelf: update.isSelf,
                    }, dbSession);
                }
            });
        } finally {
            await dbSession.endSession();
        }

        const updatedLog = await CigaretteLog.findById(params.id).populate("brandId");
        return NextResponse.json(updatedLog);
    } catch (error) {
        console.error("Failed to update cigarette log:", error);
        return NextResponse.json(
            { error: "Couldn't save the update — the linked Finance entry couldn't be updated, so nothing changed. Please try again." },
            { status: 500 }
        );
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

        const existingLog = await CigaretteLog.findOne({ _id: params.id, userId: session.user.id });
        if (!existingLog) {
            return NextResponse.json({ error: "Log not found" }, { status: 404 });
        }

        // Deleting the log and its linked Finance expense happens in one transaction,
        // so a failure partway through can't leave a stale expense with no matching log.
        const dbSession = await mongoose.startSession();
        try {
            await dbSession.withTransaction(async () => {
                await CigaretteLog.deleteOne({ _id: params.id, userId: session.user.id }, { session: dbSession });

                if (existingLog.financeExpenseId) {
                    await FinanceExpense.deleteOne(
                        { _id: existingLog.financeExpenseId, userId: session.user.id },
                        { session: dbSession }
                    );
                }
            });
        } finally {
            await dbSession.endSession();
        }

        return NextResponse.json({ success: true, id: params.id });
    } catch (error) {
        console.error("Failed to delete cigarette log:", error);
        return NextResponse.json(
            { error: "Couldn't delete — the linked Finance entry couldn't be removed, so nothing was deleted. Please try again." },
            { status: 500 }
        );
    }
}
