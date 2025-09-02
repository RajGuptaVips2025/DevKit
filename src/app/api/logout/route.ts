import { getServerSession } from "next-auth";
import redis from "@/lib/redis";
import { authOptions } from "../auth/[...nextauth]/authOptions";
import dbConnect from "@/dbConfig/dbConfig";

export async function POST() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    try {
      await redis.del(`user:${session.user.id}`);
    } catch (e) {
      console.error("Redis error (logout):", e);
    }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
