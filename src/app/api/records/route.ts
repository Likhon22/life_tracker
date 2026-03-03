import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { DailyRecord } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month"); // Optional: e.g., '2024-12'

        await connectToDatabase();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { userId: session.user.id };
        if (month) {
            // Find all records that start with the given YYYY-MM
            query.date = { $regex: `^${month}` };
        }

        const records = await DailyRecord.find(query);

        // Convert to the DailyRecord client type format: { '2024-12-17': ['habitId1', 'habitId2'] }
        const formattedRecords: Record<string, string[]> = {};
        records.forEach((record) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formattedRecords[record.date] = record.habitIds.map((id: any) => id.toString());
        });

        return NextResponse.json(formattedRecords);
    } catch (error) {
        console.error("Failed to fetch records:", error);
        return NextResponse.json(
            { error: "Failed to fetch records" },
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

        const { date, habitId } = await request.json();

        if (!date || !habitId) {
            return NextResponse.json(
                { error: "Date and habitId are required" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Find the record for the specific date AND user
        let record = await DailyRecord.findOne({ date, userId: session.user.id });

        if (!record) {
            // Create new record for the date
            record = await DailyRecord.create({
                date,
                userId: session.user.id,
                habitIds: [habitId],
            });
        } else {
            // Toggle the habitId
            const habitObjectId = habitId;
            const index = record.habitIds.indexOf(habitObjectId);

            if (index > -1) {
                // Remove it if exists
                record.habitIds.splice(index, 1);
            } else {
                // Add it if not exists
                record.habitIds.push(habitObjectId);
            }

            await record.save();
        }

        // Return the updated habitIds array for that date
        return NextResponse.json({
            date: record.date,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            habitIds: record.habitIds.map((id: any) => id.toString())
        });

    } catch (error) {
        console.error("Failed to update record:", error);
        return NextResponse.json(
            { error: "Failed to update record" },
            { status: 500 }
        );
    }
}
