import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { CigaretteBrand, CigaretteLog } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
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
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
            _id: { $ne: params.id }
        });
        if (existing) {
            return NextResponse.json({ error: "A brand with this name already exists" }, { status: 400 });
        }

        const updated = await CigaretteBrand.findOneAndUpdate(
            { _id: params.id, userId: session.user.id },
            { name: name.trim(), pricePerStick },
            { returnDocument: "after" }
        );

        if (!updated) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update cigarette brand:", error);
        return NextResponse.json({ error: "Failed to update cigarette brand" }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const logCount = await CigaretteLog.countDocuments({ brandId: params.id, userId: session.user.id });
        if (logCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete a brand that still has logged entries. Delete those logs first." },
                { status: 400 }
            );
        }

        const deleted = await CigaretteBrand.findOneAndDelete({ _id: params.id, userId: session.user.id });
        if (!deleted) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, id: params.id });
    } catch (error) {
        console.error("Failed to delete cigarette brand:", error);
        return NextResponse.json({ error: "Failed to delete cigarette brand" }, { status: 500 });
    }
}
