import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { InvestmentCategory, Investment, InvestmentTransaction } from "@/models";
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

        // Delete all transactions and investments under this category
        const investments = await Investment.find({ categoryId: id, userId: session.user.id });
        const investmentIds = investments.map(i => i._id);
        await InvestmentTransaction.deleteMany({ investmentId: { $in: investmentIds } });
        await Investment.deleteMany({ categoryId: id, userId: session.user.id });
        await InvestmentCategory.deleteOne({ _id: id, userId: session.user.id });

        return NextResponse.json({ message: "Category and all related data deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
