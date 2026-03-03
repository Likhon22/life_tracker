import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FinanceFixedCost } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        await connectToDatabase();
        const fixedCost = await FinanceFixedCost.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { ...body },
            { returnDocument: "after" }
        );

        if (!fixedCost) {
            return NextResponse.json({ error: "Fixed cost not found" }, { status: 404 });
        }

        return NextResponse.json(fixedCost);
    } catch (error) {
        console.error("Failed to update fixed cost:", error);
        return NextResponse.json({ error: "Failed to update fixed cost" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();
        const result = await FinanceFixedCost.deleteOne({ _id: id, userId: session.user.id });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Fixed cost not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Fixed cost deleted successfully" });
    } catch (error) {
        console.error("Failed to delete fixed cost:", error);
        return NextResponse.json({ error: "Failed to delete fixed cost" }, { status: 500 });
    }
}
