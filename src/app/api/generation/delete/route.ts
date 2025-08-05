import { NextResponse } from "next/server";
import Generation from "@/models/Generation";
import dbConnect from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

export async function DELETE() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await Generation.deleteMany({ user: userId });

    return NextResponse.json(
      {
        success: true,
        message: "All generation history deleted.",
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error clearing generation history:", error);
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
  }
}
