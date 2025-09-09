import { NextRequest, NextResponse } from "next/server";
import Generation from "@/models/Generation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import redis from "@/lib/redis";
import { Types } from "mongoose";
import dbConnect from "@/dbConfig/dbConfig";

interface HistoryEntry {
  _id: string;
  prompt: string;
  modelName: string;
  framework: string;
  user: string;
}

interface HistoryEntry {
  _id: string;
  prompt: string;
  modelName: string;
  framework: string;
  user: string;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const cacheKey = `history:${session.user.id}`;

    // 1️⃣ Try Redis first
    const cachedHistory = await redis.lrange(cacheKey, skip, skip + limit - 1);
    if (cachedHistory.length > 0) {
      const parsed: HistoryEntry[] = cachedHistory
        .map((item: any): HistoryEntry | null => {
          try {
            if (typeof item === "string") {
              return JSON.parse(item) as HistoryEntry;
            }
            if (typeof item === "object" && item !== null) {
              return item as HistoryEntry;
            }
            return null;
          } catch {
            console.warn("⚠️ Skipped invalid cache entry:", item);
            return null;
          }
        })
        .filter((x: HistoryEntry | null): x is HistoryEntry => x !== null); // ✅ this removes 'any'

      if (parsed.length > 0) {
        return NextResponse.json({ success: true, data: parsed, cached: true });
      }
    }

    // 2️⃣ Fallback to Mongo
    const generations = await Generation.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("_id prompt modelName framework user");

    // 3️⃣ Repopulate Redis
    if (generations.length > 0) {
      const pipeline = redis.multi();
      generations.forEach((gen) => {
        pipeline.rpush(
          cacheKey,
          JSON.stringify({
            _id: (gen._id as Types.ObjectId).toString(),
            prompt: gen.prompt,
            modelName: gen.modelName,
            framework: gen.framework,
            user: gen.user.toString(),
          })
        );
      });
      await pipeline.exec();
    }

    return NextResponse.json({ success: true, data: generations, cached: false });
  } catch (error) {
    console.error("❌ Error fetching history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}