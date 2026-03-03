import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;

async function fixDatabase() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db!;
        console.log("Connected.");

        // 1. Drop the old solo 'date_1' unique index from dailyrecords
        try {
            await db.collection("dailyrecords").dropIndex("date_1");
            console.log("✅ Dropped old 'date_1' index from dailyrecords.");
        } catch (e) {
            console.log("ℹ️  No old 'date_1' index found (already removed or doesn't exist). Skipping.");
        }

        // 2. Remove all habits that do NOT have a userId (these were seeded before auth was added)
        const result = await db.collection("habits").deleteMany({ userId: { $exists: false } });
        console.log(`✅ Removed ${result.deletedCount} orphaned habit(s) without a userId.`);

        // 3. Remove all dailyrecords that do NOT have a userId
        const result2 = await db.collection("dailyrecords").deleteMany({ userId: { $exists: false } });
        console.log(`✅ Removed ${result2.deletedCount} orphaned daily record(s) without a userId.`);

        console.log("\n🎉 Database is clean and ready. Restart your dev server.");
        process.exit(0);
    } catch (error) {
        console.error("Error fixing database:", error);
        process.exit(1);
    }
}

fixDatabase();
