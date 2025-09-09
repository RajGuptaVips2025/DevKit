import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis as UpstashRedis } from "@upstash/redis";
import redis from "@/lib/redis";

const redisUpstash = UpstashRedis.fromEnv();
const ratelimit = new Ratelimit({
  redis: redisUpstash,
  limiter: Ratelimit.tokenBucket(10, "24 h", 10),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const identifier = `user:${session.user.id}`;
  const { remaining, reset } = await ratelimit.getRemaining(identifier);

  const cooldownKey = `cooldown:${session.user.id}`;
  let cooldownRemaining = 0;
  try {
    const ttlSeconds = await redis.ttl(cooldownKey);
    cooldownRemaining = ttlSeconds > 0 ? ttlSeconds : 0;
  } catch (err) {
    console.error("Failed to read cooldown TTL:", err);
    cooldownRemaining = 0;
  }

  return NextResponse.json({
    allowed: remaining > 0,
    remaining,
    reset,
    cooldownRemaining,
  });
}

