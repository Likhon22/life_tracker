import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;
const TARGET_USER_ID = "100094050892395924069";

async function cleanupData() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db!;
        console.log("Connected.");

        console.log(`Deleting all habits for user ${TARGET_USER_ID}...`);
        const habitResult = await db.collection("habits").deleteMany({ userId: TARGET_USER_ID });
        console.log(`✅ Deleted ${habitResult.deletedCount} habit(s).`);

        console.log(`Deleting all daily records for user ${TARGET_USER_ID}...`);
        const recordResult = await db.collection("dailyrecords").deleteMany({ userId: TARGET_USER_ID });
        console.log(`✅ Deleted ${recordResult.deletedCount} record(s).`);

        console.log("\nCleanup complete.");
        process.exit(0);
    } catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
}

cleanupData();
