import { FinanceCategory, FinanceExpense } from "@/models";

// Cigarette logs always flow into Finance under a "Cigarettes" category so the two never drift apart.
export async function getOrCreateCigaretteCategory(userId: string) {
    let category = await FinanceCategory.findOne({ userId, name: { $regex: /^cigarettes$/i } });
    if (!category) {
        category = await FinanceCategory.create({ userId, name: "Cigarettes", icon: "Cigarette" });
    }
    return category;
}

function expenseNote(quantity: number, brandName: string, isSelf: boolean) {
    return `${quantity}x ${brandName}${isSelf ? "" : " (friend)"}`;
}

export async function createLinkedExpense(params: {
    userId: string;
    date: string;
    amount: number;
    quantity: number;
    brandName: string;
    isSelf: boolean;
}) {
    const category = await getOrCreateCigaretteCategory(params.userId);
    return FinanceExpense.create({
        userId: params.userId,
        date: params.date,
        month: params.date.substring(0, 7),
        amount: params.amount,
        categoryId: category._id,
        note: expenseNote(params.quantity, params.brandName, params.isSelf),
    });
}

export async function syncLinkedExpense(
    financeExpenseId: unknown,
    params: { date: string; amount: number; quantity: number; brandName: string; isSelf: boolean }
) {
    await FinanceExpense.findByIdAndUpdate(financeExpenseId, {
        date: params.date,
        month: params.date.substring(0, 7),
        amount: params.amount,
        note: expenseNote(params.quantity, params.brandName, params.isSelf),
    });
}
