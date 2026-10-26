import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Habit } from "@/models";
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
        let habits = await Habit.find({ userId: session.user.id }).sort({ order: 1, createdAt: 1 });

        // Seed default habits if the database is completely empty FOR THIS USER
        if (habits.length === 0) {
            const categories = await ensureHabitCategories(session.user.id);
            const productivity = categories.find((c) => c.name === "Productivity") ?? categories[0];
            const health = categories.find((c) => c.name === "Health") ?? categories[0];
            const personalGrowth = categories.find((c) => c.name === "Personal Growth") ?? categories[0];

            const defaultHabits = [
                { name: "To Do list", userId: session.user.id, order: 0, categoryId: productivity._id },
                { name: "Exercise", userId: session.user.id, order: 1, categoryId: health._id },
                { name: "Read", userId: session.user.id, order: 2, categoryId: personalGrowth._id },
            ];

            await Habit.insertMany(defaultHabits);
            habits = await Habit.find({ userId: session.user.id }).sort({ order: 1, createdAt: 1 });
        }

        return NextResponse.json(habits);
    } catch (error) {
        console.error("Failed to fetch habits:", error);
        return NextResponse.json(
            { error: "Failed to fetch habits" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, categoryId } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Habit name is required" },
                { status: 400 }
            );
        }

        if (!categoryId) {
            return NextResponse.json(
                { error: "Category is required" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Check for existing habit with the same name for this user
        const existingHabit = await Habit.findOne({
            userId: session.user.id,
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
        });

        if (existingHabit) {
            return NextResponse.json({ error: "Habit already exists" }, { status: 400 });
        }

        // Get the current max order to append the new habit at the end
        const habitCount = await Habit.countDocuments({ userId: session.user.id });

        const newHabit = await Habit.create({
            name: name.trim(),
            userId: session.user.id,
            order: habitCount,
            categoryId
        });

        return NextResponse.json(newHabit, { status: 201 });
    } catch (error) {
        console.error("Failed to create habit:", error);
        return NextResponse.json(
            { error: "Failed to create habit" },
            { status: 500 }
        );
    }
}
