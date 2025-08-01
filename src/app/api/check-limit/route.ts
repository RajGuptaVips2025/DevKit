// src/app/api/check-limit/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Generation from "@/models/Generation";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const promptCount = await Generation.countDocuments({
            user: user._id,
            createdAt: { $gte: todayStart },
        });

        return NextResponse.json({ limitReached: promptCount >= 5

         });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
