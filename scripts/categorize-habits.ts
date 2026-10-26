import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;

const DEFAULT_HABIT_CATEGORIES = [
    { name: "Faith", icon: "Moon" },
    { name: "Career", icon: "Briefcase" },
    { name: "Business", icon: "TrendingUp" },
    { name: "Health", icon: "Dumbbell" },
    { name: "Relationships", icon: "Users" },
    { name: "Finance", icon: "Wallet" },
    { name: "Personal Growth", icon: "GraduationCap" },
    { name: "Self-Care", icon: "Scissors" },
    { name: "Productivity", icon: "CheckSquare" },
];

// Exact habit name -> category name. Anything not listed here falls back to "Productivity".
const HABIT_TO_CATEGORY: Record<string, string> = {
    "To-Do list": "Productivity",
    "To Do list": "Productivity",
    "2hour learn_1": "Career",
    "2hour learn_2": "Career",
    "2hour cold mail_1": "Career",
    "2hour cold mail_2": "Career",
    "2hour build_1": "Career",
    "2hour build_2": "Career",
    "2 hour youtuber_1": "Business",
    "2 hour youtuber_2": "Business",
    "5 Job apply": "Career",
    "1hour fragmen_1": "Business",
    "1 hour another business": "Business",
    "1hour ad_1": "Business",
    "Git push": "Career",
    "7 hour sleep": "Health",
    "Meditation": "Health",
    "Exercise": "Health",
    "English Practice 10 min": "Personal Growth",
    "New Connection": "Relationships",
    "Room clean": "Self-Care",
    "Fajar": "Faith",
    "Zohar": "Faith",
    "Asar": "Faith",
    "Magrib": "Faith",
    "Isha": "Faith",
    "NSS": "Faith",
    "2 time brush": "Health",
    "Read": "Personal Growth",
    "zero junk food": "Health",
    "better relationship": "Relationships",
    "spendingTracked": "Finance",
    "Grooming": "Self-Care",
    "Daily Reflection": "Personal Growth",
    "Journal writing": "Personal Growth",
};

async function run() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db!;
    console.log("Connected.");

    const habits = await db.collection("habits").find({}).toArray();
    const userIds: string[] = Array.from(new Set(habits.map((h) => h.userId)));

    for (const userId of userIds) {
        console.log(`\nUser ${userId}:`);

        let categories = await db.collection("habitcategories").find({ userId }).toArray();
        if (categories.length === 0) {
            const seeded = DEFAULT_HABIT_CATEGORIES.map((cat) => ({ ...cat, userId }));
            await db.collection("habitcategories").insertMany(seeded);
            categories = await db.collection("habitcategories").find({ userId }).toArray();
            console.log(`  Seeded ${categories.length} default categories.`);
        } else {
            console.log(`  Found ${categories.length} existing categories.`);
        }

        const categoryIdByName = new Map(categories.map((c) => [c.name, c._id]));
        const productivityId = categoryIdByName.get("Productivity");

        const userHabits = habits.filter((h) => h.userId === userId);
        for (const habit of userHabits) {
            if (habit.categoryId) continue; // already categorized, don't touch

            const categoryName = HABIT_TO_CATEGORY[habit.name];
            const categoryId = categoryName ? categoryIdByName.get(categoryName) : undefined;
            const finalCategoryId = categoryId ?? productivityId;

            if (!categoryName) {
                console.log(`  ! No mapping for "${habit.name}", defaulting to Productivity.`);
            }

            await db.collection("habits").updateOne(
                { _id: habit._id },
                { $set: { categoryId: finalCategoryId } }
            );
            console.log(`  "${habit.name}" -> ${categoryName ?? "Productivity"}`);
        }
    }

    console.log("\nDone.");
    process.exit(0);
}

run().catch((error) => {
    console.error("Error categorizing habits:", error);
    process.exit(1);
});
