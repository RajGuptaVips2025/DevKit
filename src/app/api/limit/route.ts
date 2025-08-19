import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import User from "@/models/userModel";
import dbConnect from "@/dbConfig/dbConfig";
import { authOptions } from "../auth/[...nextauth]/authOptions";

export async function POST() {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();
  const lastTime = user.lastPromptTime || new Date(0);
  const count = user.dailyPromptCount ?? 0;

  const isReset = now.getTime() - lastTime.getTime() > 24 * 60 * 60 * 1000;

  if (isReset) {
    user.dailyPromptCount = 1;
    user.lastPromptTime = now;
    await user.save();
    return NextResponse.json({ allowed: true, remaining: 4 });
  }

  if (count >= 100) {
    const timeLeft = 24 * 60 * 60 * 1000 - (now.getTime() - lastTime.getTime());
    return NextResponse.json({ allowed: false, timeLeft });
  }

  user.dailyPromptCount = count + 1;
  await user.save();
  return NextResponse.json({ allowed: true, remaining: 5 - user.dailyPromptCount });
}
