import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;

async function wipeDatabase() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");

        console.log("Dropping existing habits and records...");
        await mongoose.connection.db?.collection("habits").deleteMany({});
        await mongoose.connection.db?.collection("dailyrecords").deleteMany({});

        console.log("Database wiped successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error wiping database:", error);
        process.exit(1);
    }
}

wipeDatabase();
