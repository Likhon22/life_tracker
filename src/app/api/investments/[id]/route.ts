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
