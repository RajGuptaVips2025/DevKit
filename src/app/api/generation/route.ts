import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import Generation from "@/models/Generation";
import User from "@/models/userModel";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { email, prompt, modelName, steps, output, files, imageUrl } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newGeneration = await Generation.create({
      user: user._id,
      prompt,
      modelName,
      steps,
      output,
      imageUrl,
      files,
    });

    return NextResponse.json({ success: true, generation: newGeneration });
  } catch (error) {
    console.error("❌ Error saving generation:", error);
    return NextResponse.json({ error: "Failed to save generation" });
  }
}