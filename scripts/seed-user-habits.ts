import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;
const TARGET_USER_ID = "100094050892395924069";

// Prioritized list as requested
const orderedHabits = [
    "To-Do list",
    "2hour devops_1",
    "2hour devops_2",
    "1 hour code",
    "2hour ml_1",
    "2 hour ml_2",
    "2hour own_project_1",
    "2hour own_project_2",
    "1_hour_internals",
    "Git push",
    "Office_4hour_1",
    "Office_4hour_2",
    "Office_4hour_3",
    "Office_4hour_4",
    "2 hour buesiness_project_1",
    "2 hour buesiness_project_2",
    "Meditation",
    "Gym",
    "English Practice 10 min",
    "Room clean",
    "Fajar",
    "Zohar",
    "Asar",
    "Magrib",
    "Isha",
    "NSS",
    "2 time brush",
    "zero junk food",
    "better relationship",
    "spendingTracked",
    "linkedin post"
];

async function seedHabits() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db!;
        console.log("Connected.");

        console.log(`Cleaning up any existing habits for user ${TARGET_USER_ID} before seeding...`);
        await db.collection("habits").deleteMany({ userId: TARGET_USER_ID });

        const habitsToInsert = orderedHabits.map((name, index) => ({
            name,
            userId: TARGET_USER_ID,
            order: index,
            createdAt: new Date(Date.now() + index * 1000) // Staggered creation for secondary sort
        }));

        const result = await db.collection("habits").insertMany(habitsToInsert);
        console.log(`✅ Successfully seeded ${result.insertedCount} prioritized habit(s) for user ${TARGET_USER_ID}.`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding habits:", error);
        process.exit(1);
    }
}

seedHabits();
