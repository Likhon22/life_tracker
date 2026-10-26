import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { CigaretteBrand } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const DEFAULT_BRANDS = [
    { name: "Lucky", pricePerStick: 12 },
    { name: "Benson Light", pricePerStick: 23 },
    { name: "Benson", pricePerStick: 23 },
    { name: "Gold Leaf", pricePerStick: 18 },
    { name: "Camel", pricePerStick: 10 },
    { name: "Marlboro", pricePerStick: 23 },
];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        let brands = await CigaretteBrand.find({ userId: session.user.id }).sort({ name: 1 });

        if (brands.length === 0) {
            const seeded = DEFAULT_BRANDS.map((b) => ({ ...b, userId: session.user.id }));
            await CigaretteBrand.insertMany(seeded);
            brands = await CigaretteBrand.find({ userId: session.user.id }).sort({ name: 1 });
        }

        return NextResponse.json(brands);
    } catch (error) {
        console.error("Failed to fetch cigarette brands:", error);
        return NextResponse.json({ error: "Failed to fetch cigarette brands" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, pricePerStick } = await request.json();
        if (!name || !pricePerStick) {
            return NextResponse.json({ error: "Name and price per stick are required" }, { status: 400 });
        }

        await connectToDatabase();

        const existing = await CigaretteBrand.findOne({
            userId: session.user.id,
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
        });
        if (existing) {
            return NextResponse.json({ error: "Brand already exists" }, { status: 400 });
        }

        const brand = await CigaretteBrand.create({
            userId: session.user.id,
            name: name.trim(),
            pricePerStick
        });

        return NextResponse.json(brand, { status: 201 });
    } catch (error) {
        console.error("Failed to create cigarette brand:", error);
        return NextResponse.json({ error: "Failed to create cigarette brand" }, { status: 500 });
    }
}
