import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FinanceCategory } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const DEFAULT_CATEGORIES = [
    { name: "Dinner", icon: "Utensils" },
    { name: "Lunch", icon: "Sandwich" },
    { name: "Breakfast", icon: "Coffee" },
    { name: "Groceries", icon: "ShoppingBasket" },
    { name: "Transportation", icon: "Car" },
    { name: "Cigarettes", icon: "Cigarette" },
    { name: "Medicine", icon: "Pill" },
    { name: "Beverages", icon: "CupSoda" },
    { name: "Adda / Hangout", icon: "Users" },
];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        let categories = await FinanceCategory.find({ userId: session.user.id });

        if (categories.length === 0) {
            const seeded = DEFAULT_CATEGORIES.map(cat => ({
                ...cat,
                userId: session.user.id
            }));
            await FinanceCategory.insertMany(seeded);
            categories = await FinanceCategory.find({ userId: session.user.id });
        }

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, icon } = await request.json();
        if (!name || !icon) {
            return NextResponse.json({ error: "Name and icon are required" }, { status: 400 });
        }

        await connectToDatabase();
        const category = await FinanceCategory.create({
            userId: session.user.id,
            name,
            icon
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Failed to create category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
