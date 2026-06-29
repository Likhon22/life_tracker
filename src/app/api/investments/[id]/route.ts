import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Investment, InvestmentTransaction } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await connectToDatabase();

        await InvestmentTransaction.deleteMany({ investmentId: id });
        await Investment.deleteOne({ _id: id, userId: session.user.id });

        return NextResponse.json({ message: "Investment deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete investment" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const { name, note } = await request.json();

        await connectToDatabase();

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (note !== undefined) updateData.note = note;

        const investment = await Investment.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            updateData,
            { new: true }
        ).populate("categoryId");

        if (!investment) {
            return NextResponse.json({ error: "Investment not found" }, { status: 404 });
        }

        return NextResponse.json(investment);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update investment" }, { status: 500 });
    }
}
