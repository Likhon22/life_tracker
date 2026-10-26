import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { CigaretteLog, CigaretteBrand, FinanceExpense } from "@/models";
import { createLinkedExpense, syncLinkedExpense } from "@/lib/cigaretteSync";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { date, brandId, quantity, amount, consumedBySelf, paidBySelf, note } = await request.json();

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
            consumedBySelf: consumedBySelf ?? existingLog.consumedBySelf,
            paidBySelf: paidBySelf ?? existingLog.paidBySelf,
            note: note ?? existingLog.note,
        };

        // The log update and its Finance-expense side effect happen in one transaction.
        // paidBySelf can flip either direction, so the expense may need to be created,
        // synced, or removed depending on the before/after state.
        const dbSession = await mongoose.startSession();
        try {
            await dbSession.withTransaction(async () => {
                let financeExpenseId = existingLog.financeExpenseId;

                if (update.paidBySelf && existingLog.financeExpenseId) {
                    // Was paid by self, still is — just sync the existing expense.
                    await syncLinkedExpense(existingLog.financeExpenseId, {
                        date: update.date,
                        amount: update.amount,
                        quantity: update.quantity,
                        brandName: brand.name,
                        consumedBySelf: update.consumedBySelf,
                    }, dbSession);
                } else if (update.paidBySelf && !existingLog.financeExpenseId) {
                    // Friend paid before, you pay now — create the expense that never existed.
                    const expense = await createLinkedExpense({
                        userId: session.user.id,
                        date: update.date,
                        amount: update.amount,
                        quantity: update.quantity,
                        brandName: brand.name,
                        consumedBySelf: update.consumedBySelf,
                    }, dbSession);
                    financeExpenseId = expense._id;
                } else if (!update.paidBySelf && existingLog.financeExpenseId) {
                    // You paid before, friend pays now — that expense is no longer yours.
                    await FinanceExpense.deleteOne(
                        { _id: existingLog.financeExpenseId, userId: session.user.id },
                        { session: dbSession }
                    );
                    financeExpenseId = undefined;
                }
                // else: friend paid before and still does — no expense ever existed, nothing to do.

                // financeExpenseId needs an explicit $unset when it's cleared — assigning
                // `undefined` in a plain update object gets silently dropped, not persisted.
                await CigaretteLog.updateOne(
                    { _id: params.id, userId: session.user.id },
                    financeExpenseId
                        ? { $set: { ...update, financeExpenseId } }
                        : { $set: update, $unset: { financeExpenseId: 1 } },
                    { session: dbSession }
                );
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
