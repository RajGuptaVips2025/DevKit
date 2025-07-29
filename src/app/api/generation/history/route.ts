import { NextRequest, NextResponse } from "next/server";
import Generation from "@/models/Generation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust path

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Query only for this user's history
    const generations = await Generation.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("prompt modelName user");

    return NextResponse.json({ success: true, data: generations });
  } catch (error) {
    console.error("❌ Error fetching history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}