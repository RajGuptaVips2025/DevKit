export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemPrompt, getSystemPromptAngular } from "../prompts";
import dbConnect from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

async function fileToGenerativePart(file: File) {
  const base64EncodedData = Buffer.from(await file.arrayBuffer()).toString("base64");
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const prompt = formData.get("prompt") as string | null;
    const prompts = formData.get("prompts") as string | null;
    const uiprompt = formData.get("uiprompt") as string | null;
    const imageFile = formData.get("image") as File | null;
    const modelName = (formData.get("model") as string) || "gemini-1.5-flash";
    const framework = (formData.get("framework") as string);
    const systemPrompt =
      framework?.toLowerCase() === "angular" ? getSystemPromptAngular() : getSystemPrompt();

    const userPromptParts: any[] = [];
    if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      userPromptParts.push(imagePart);
    }
    if (prompt) {
      userPromptParts.push({ text: prompts });
      userPromptParts.push({ text: uiprompt });
      userPromptParts.push({ text: prompt });
    }

    const messages = [
      { role: "user", parts: userPromptParts },
      { role: "user", parts: [{ text: systemPrompt }] }
    ];

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({ contents: messages });
    return NextResponse.json({ response: result.response.text() });
  } catch (error: any) {
    console.error("❌ Error in AI API call:", error);

    let status =
      error?.status ||
      error?.response?.status ||
      null;

    if (!status && typeof error?.message === "string") {
      if (error.message.includes("NOT_FOUND")) status = 404;
      else if (error.message.includes("PERMISSION_DENIED")) status = 403;
      else if (error.message.includes("UNAUTHORIZED_USER")) status = 401;
      else if (error.message.includes("RESOURCE_EXHAUSTED")) status = 429;
      else if (error.message.includes("INVALID_ARGUMENT")) status = 400;
      else if (error.message.includes("UNAVAILABLE")) status = 503;
    }

    // Fallback
    if (!status) status = 500;

    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status }
    );
  }
}