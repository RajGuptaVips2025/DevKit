import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/dbConfig/dbConfig";

dbConnect();

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { name, email, password } = reqBody;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name: name,
      email,
      password: hashPassword,
    });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" } // Token valid for 1 day
    );

    // Create response with token and set the cookie
    const response = NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });

    // Set cookie with token
    response.cookies.set("token", token, {
      httpOnly: true, // Makes the cookie inaccessible to client-side JavaScript
      secure: process.env.NODE_ENV === "production", // Send cookie over HTTPS in production
      sameSite: "strict", // Prevents CSRF attacks
      maxAge: 24 * 60 * 60, // 1 day in seconds
      path: "/", // Cookie available on all routes
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
