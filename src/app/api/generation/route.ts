import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import Generation from "@/models/Generation";
import User from "@/models/userModel";
import redis from "@/lib/redis";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { email, prompt, modelName, framework, steps, output, files, imageUrl, source } = body;

    // deny generation saves that didn't come from the UI
    if (source !== "ui") {
      console.warn("Rejected generation save: source missing or not 'ui'");
      return NextResponse.json({ error: "Generation via URL disabled" }, { status: 400 });
    }

    // 🚨 Warn if framework is missing or empty
    if (!framework || framework.trim() === "") {
      console.warn("⚠️ Framework value is missing or empty in request body!");
    }

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ⚠️ Handle edge case: output missing
    if (!output) {
      return NextResponse.json(
        { error: "Generation failed, output missing" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newGeneration = await Generation.create({
      user: user._id,
      prompt,
      modelName,
      framework,
      steps,
      output,
      imageUrl,
      files,
    });

    const userIdStr = (user._id as Types.ObjectId).toString();
    const genIdStr = (newGeneration._id as Types.ObjectId).toString();
    const payload = newGeneration.toObject();

    // --- Redis: Push new history ---
    await redis.lpush(
      `history:${userIdStr}`,
      JSON.stringify({
        _id: genIdStr,
        prompt,
        modelName,
        framework,
        user: userIdStr,
      })
    );

    // Trim Redis history to keep only last 10
    await redis.ltrim(`history:${userIdStr}`, 0, 9);

    // Cache generation
    await Promise.all([
      // redis.set(`generation:${genIdStr}`, JSON.stringify(payload), { ex: 60 * 5 }),
      redis.set(`generation:${userIdStr}:${genIdStr}`, JSON.stringify(payload), { ex: 60 * 5 }),
    ]);

    // --- MongoDB: Ensure only last 10 ---
    const userGenerations = await Generation.find({ user: user._id })
      .sort({ createdAt: -1 })
      .skip(10) // skip the latest 10
      .select("_id");

    if (userGenerations.length > 0) {
      const idsToDelete = userGenerations.map((doc) => doc._id);
      await Generation.deleteMany({ _id: { $in: idsToDelete } });
    }

    return NextResponse.json({ success: true, generation: newGeneration });
  } catch (error) {
    console.error("❌ Error saving generation:", error);
    return NextResponse.json({ error: "Failed to save generation" });
  }
}