import { NextRequest, NextResponse } from "next/server";
import Generation from "@/models/Generation";
import dbConnect from "@/dbConfig/dbConfig";

export async function PATCH(req: NextRequest,{ params }: { params: Promise<{ id: string }> }) {
  const { id: generationId } = await params;
  const { files } = await req.json();

  try {
    const updated = await Generation.findByIdAndUpdate(
      generationId,
      { files },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, updated }, { status: 200 });
  } catch (err) {
    console.error("❌ Error updating generation files:", err);
    return NextResponse.json({ error: "Failed to update files" }, { status: 500 });
  }
}


// GET /api/generation/[id]
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: generationId } = await context.params;

  try {
    // Connect to DB
    await dbConnect();

    const generation = await Generation.findById(generationId);

    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, generation }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching generation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: generationId } = await context.params;

  try {
    // Connect to the database
    await dbConnect();

    // Find and delete the generation
    const deleted = await Generation.findByIdAndDelete(generationId);

    if (!deleted) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Generation deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting generation:", error);
    return NextResponse.json({ error: "Failed to delete generation" }, { status: 500 });
  }
}
