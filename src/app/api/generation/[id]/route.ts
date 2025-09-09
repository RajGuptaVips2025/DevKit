// src/app/api/generation/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import Generation from "@/models/Generation";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import redis from "@/lib/redis";
import redisHelpers from "@/lib/redisHelpers";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

type ParamsCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: ParamsCtx) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const generationId = id;
  if (!generationId || generationId === "undefined") {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

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

    const payload = typeof updated.toObject === "function" ? updated.toObject() : updated;

    const genIdStr = (payload._id as Types.ObjectId).toString();
    const userIdStr = typeof payload.user === "string" ? payload.user : payload.user.toString();

    await redisHelpers.setJson(`generation:${userIdStr}:${genIdStr}`, payload, { ex: 60 * 5 });

    return NextResponse.json({ success: true, updated: payload }, { status: 200 });
  } catch (err) {
    console.error("❌ Error updating generation files:", err);
    return NextResponse.json({ error: "Failed to update files" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await ctx.params;
  const generationId = id;

  if (!generationId || generationId === "undefined") {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const cacheKey = `generation:${userId}:${generationId}`;

  try {
    const cached = await redisHelpers.getJson(cacheKey);

    if (cached && typeof cached === "object") {
      return NextResponse.json({ success: true, generation: cached, cached: true }, { status: 200 });
    }

    if (cached && typeof cached === "string") {
      console.warn(`⚠️ Invalid cached string found at ${cacheKey}, deleting key and falling back to DB.`);
      try { await redis.del(cacheKey); } catch (e) { console.error("Redis del error:", e); }
    }

    const generation = await Generation.findById(generationId).lean();
    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    await redisHelpers.setJson(cacheKey, generation, { ex: 60 * 5 });

    return NextResponse.json({ success: true, generation, cached: false }, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching generation:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await ctx.params;
  const generationId = id;
  const userScopedKey = `generation:${userId}:${generationId}`;
  const historyKey = `history:${userId}`;

  try {
    const deleted = await Generation.findOneAndDelete({
      _id: new Types.ObjectId(generationId),
      user: new Types.ObjectId(userId),
    });

    if (!deleted) {
      return NextResponse.json({ error: "Generation not found or unauthorized" }, { status: 404 });
    }

    const listItem = JSON.stringify({
      _id: (deleted._id as Types.ObjectId).toString(),
      prompt: deleted.prompt,
      modelName: deleted.modelName,
      framework: deleted.framework,
      user: deleted.user.toString(),
    });

    try {
      if (typeof (redis as any).multi === "function") {
        const txn = (redis as any).multi();
        txn.lrem(historyKey, 0, listItem);
        txn.del(userScopedKey);
        if (typeof txn.exec === "function") {
          await txn.exec();
        } else {
          await txn;
        }
      } else if (typeof (redis as any).pipeline === "function") {
        const p = (redis as any).pipeline();
        p.lrem(historyKey, 0, listItem);
        p.del(userScopedKey);
        await p.exec();
      } else {
        await (redis as any).lrem(historyKey, 0, listItem);
        await (redis as any).del(userScopedKey);
      }
    } catch (redisErr) {
      console.error("⚠️ Redis deletion failed (non-fatal):", redisErr);
    }

    return NextResponse.json(
      { success: true, message: "Generation deleted from Mongo & Redis (attempted)." },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error deleting generation:", err);
    return NextResponse.json({ error: "Failed to delete generation" }, { status: 500 });
  }
}