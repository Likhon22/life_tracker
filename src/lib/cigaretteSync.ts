import mongoose from "mongoose";
import { FinanceCategory, FinanceExpense } from "@/models";

// Cigarette logs always flow into Finance under a "Cigarettes" category so the two never drift apart.
export async function getOrCreateCigaretteCategory(userId: string, session: mongoose.ClientSession) {
    let category = await FinanceCategory.findOne({ userId, name: { $regex: /^cigarettes$/i } }).session(session);
    if (!category) {
        category = await FinanceCategory.create([{ userId, name: "Cigarettes", icon: "Cigarette" }], { session }).then((docs) => docs[0]);
    }
    return category;
}

// Note reflects who SMOKED it (consumedBySelf), not who paid — the expense only exists
// when paidBySelf is true, so the "(friend)" suffix clarifies it was bought for a friend.
function expenseNote(quantity: number, brandName: string, consumedBySelf: boolean) {
    return `${quantity}x ${brandName}${consumedBySelf ? "" : " (friend)"}`;
}

export async function createLinkedExpense(
    params: {
        userId: string;
        date: string;
        amount: number;
        quantity: number;
        brandName: string;
        consumedBySelf: boolean;
    },
    session: mongoose.ClientSession
) {
    const category = await getOrCreateCigaretteCategory(params.userId, session);
    const [expense] = await FinanceExpense.create(
        [{
            userId: params.userId,
            date: params.date,
            month: params.date.substring(0, 7),
            amount: params.amount,
            categoryId: category._id,
            note: expenseNote(params.quantity, params.brandName, params.consumedBySelf),
        }],
        { session }
    );
    return expense;
}

export async function syncLinkedExpense(
    financeExpenseId: unknown,
    params: { date: string; amount: number; quantity: number; brandName: string; consumedBySelf: boolean },
    session: mongoose.ClientSession
) {
    await FinanceExpense.findByIdAndUpdate(
        financeExpenseId,
        {
            date: params.date,
            month: params.date.substring(0, 7),
            amount: params.amount,
            note: expenseNote(params.quantity, params.brandName, params.consumedBySelf),
        },
        { session }
    );
}
