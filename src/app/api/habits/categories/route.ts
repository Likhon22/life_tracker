import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { HabitCategory } from "@/models";
import { ensureHabitCategories } from "@/lib/habitCategories";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const categories = await ensureHabitCategories(session.user.id);

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Failed to fetch habit categories:", error);
        return NextResponse.json({ error: "Failed to fetch habit categories" }, { status: 500 });
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

        const existing = await HabitCategory.findOne({
            userId: session.user.id,
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
        });
        if (existing) {
            return NextResponse.json({ error: "Category already exists" }, { status: 400 });
        }

        const category = await HabitCategory.create({
            userId: session.user.id,
            name: name.trim(),
            icon
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Failed to create habit category:", error);
        return NextResponse.json({ error: "Failed to create habit category" }, { status: 500 });
    }
}
