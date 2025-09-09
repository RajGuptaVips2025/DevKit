import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import Generation from "@/models/Generation";
import User from "@/models/userModel";
import redis from "@/lib/redis";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis as UpstashRedis } from "@upstash/redis";
import redisHelpers from "@/lib/redisHelpers";

const redisUpstash = UpstashRedis.fromEnv();
const ratelimit = new Ratelimit({
  redis: redisUpstash,
  limiter: Ratelimit.tokenBucket(10, "24 h", 10),
});

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, prompt, modelName, framework, steps, output, files, imageUrl, source } = body;

    if (source !== "ui") {
      return NextResponse.json({ error: "Generation via URL disabled" }, { status: 400 });
    }

    if (!email || !output) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const identifier = `user:${user._id.toString()}`;
    const res = await ratelimit.limit(identifier);

    if (!res.success) {
      return NextResponse.json(
        { error: "Daily limit reached" },
        { status: 429 }
      );
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

    await redis.ltrim(`history:${userIdStr}`, 0, 9);

    // await redis.set(
    //   `generation:${userIdStr}:${genIdStr}`,
    //   JSON.stringify(payload),
    //   { ex: 60 * 5 }
    // );

    // cache generation object (use helper)
    await redisHelpers.setJson(
      `generation:${userIdStr}:${genIdStr}`,
      payload,
      { ex: 60 * 5 }
    );

    // ✅ set 30s cooldown for this user
    const cooldownKey = `cooldown:${userIdStr}`;
    try {
      await redis.set(cooldownKey, Date.now().toString(), { ex: 30 });
    } catch (e) {
      console.error("⚠️ Failed to set cooldown key in Redis", e);
    }

    const userGenerations = await Generation.find({ user: user._id })
      .sort({ createdAt: -1 })
      .skip(10)
      .select("_id");

    if (userGenerations.length > 0) {
      const idsToDelete = userGenerations.map((doc) => doc._id);
      await Generation.deleteMany({ _id: { $in: idsToDelete } });
    }

    const cooldownTtl = await redis.ttl(cooldownKey); // returns seconds

    return NextResponse.json({ success: true, generation: newGeneration, cooldownRemaining: cooldownTtl > 0 ? cooldownTtl : 0 });
  } catch (error) {
    console.error("❌ Error saving generation:", error);
    return NextResponse.json({ error: "Failed to save generation" }, { status: 500 });
  }
}