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
    const { params } = reqBody;

    console.log(params);
    // Validate input
    // return response;
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
