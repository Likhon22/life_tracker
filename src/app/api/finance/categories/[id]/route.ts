import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { FinanceCategory } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();

        await connectToDatabase();

        // Ensure the category belongs to the user
        const category = await FinanceCategory.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { ...body },
            { returnDocument: 'after' }
        );

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error("Failed to update category:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        await connectToDatabase();
        const result = await FinanceCategory.deleteOne({ _id: id, userId: session.user.id });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Failed to delete category:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
