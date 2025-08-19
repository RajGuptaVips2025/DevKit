import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import Generation from "@/models/Generation";
import User from "@/models/userModel";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();

    // 🔍 Debug log: see exactly what's coming from the frontend
    console.log("📩 Incoming /api/generation payload:", body);

    const { email, prompt, modelName, framework, steps, output, files, imageUrl } = body;

    // 🚨 Warn if framework is missing or empty
    if (!framework || framework.trim() === "") {
      console.warn("⚠️ Framework value is missing or empty in request body!");
    }

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
      framework, // 👈 This will save only if schema supports it
      steps,
      output,
      imageUrl,
      files,
    });

    console.log("✅ Saved generation:", newGeneration);

    return NextResponse.json({ success: true, generation: newGeneration });
  } catch (error) {
    console.error("❌ Error saving generation:", error);
    return NextResponse.json({ error: "Failed to save generation" });
  }
}