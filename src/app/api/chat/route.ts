import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemPrompt } from "../prompts";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    let { messages } = reqBody;
    const { model } = reqBody;
    console.log(model)
    
    const responsee = getSystemPrompt();
    messages.push({ role: "user", parts: responsee })
    messages = JSON.stringify(messages)
    const modelName = model || "gemini-2.0-flash";
    console.log(modelName)
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    const modelResponse = genAI.getGenerativeModel({ model: modelName });

    const result = await modelResponse.generateContent(messages);
    return NextResponse.json({ response: result.response.text() })
  } catch (error: any) {
    console.error("Error in AI API call:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}