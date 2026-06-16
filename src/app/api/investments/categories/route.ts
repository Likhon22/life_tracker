import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { InvestmentCategory, Investment } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();
        const categories = await InvestmentCategory.find({ userId: session.user.id }).sort({ name: 1 });
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name, icon } = await request.json();
        if (!name || !icon) return NextResponse.json({ error: "Name and icon required" }, { status: 400 });

        await connectToDatabase();
        const category = await InvestmentCategory.create({ userId: session.user.id, name, icon });
        
        // Auto-create default General investment
        await Investment.create({
            userId: session.user.id,
            name: "General",
            categoryId: category._id
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
