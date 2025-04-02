import dbConnect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken";

dbConnect();

export async function POST(request:NextRequest) {
  try {
    // Parse request body
    const reqBody = await request.json();
    const { email, password } = reqBody;

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Create a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" } // Token valid for 1 day
    );

    // Return success response with the token
    const response= NextResponse.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.name,
        email: user.email,
      },
    });

    response.cookies.set("token",token,{httpOnly:true})
    return response;
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
