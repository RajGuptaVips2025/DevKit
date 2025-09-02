import { NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import Generation from "@/models/Generation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import redis from "@/lib/redis";
import { Types } from "mongoose";

export async function DELETE() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const gens = await Generation.find({ user: new Types.ObjectId(userId) })
      .select("_id")
      .lean();
    const genIds = gens.map(g => String(g._id));

    await Generation.deleteMany({ user: new Types.ObjectId(userId) });

    const historyKey = `history:${userId}`;
    const scopedKeys = genIds.map(id => `generation:${userId}:${id}`);
    // const legacyKeys = genIds.map(id => `generation:${id}`);

    // const keysToDelete = [historyKey, ...scopedKeys, ...legacyKeys];
    const keysToDelete = [historyKey, ...scopedKeys];

    for (const k of keysToDelete) {
      await redis.del(k);
    }

    const stillExist: string[] = [];
    for (const k of keysToDelete) {
      const exists = await redis.exists(k);
      if (exists) stillExist.push(k);
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Cleared this user's history and generation caches",
        deletedKeys: keysToDelete,
        counts: {
          mongoDeletedIds: genIds.length,
          redisRequestedDelete: keysToDelete.length,
          redisStillExist: stillExist.length,
        },
        leftoverKeys: stillExist,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("❌ Failed to clear history:", err);
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
  }
}