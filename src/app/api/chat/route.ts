import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemPrompt } from "../prompts";

async function fileToGenerativePart(file: File) {
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return { inlineData: { data: base64, mimeType: file.type } };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string | null;
    const prompts = formData.get("prompts") as string | null;
    const uiprompt = formData.get("uiprompt") as string | null;
    const modelName = (formData.get("model") as string) || "gemini-1.5-flash";
    const imageFile = formData.get("image") as File | null;
    const email = formData.get("email") as string | null;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPromptParts: any[] = [];

    if (imageFile) {
      userPromptParts.push(await fileToGenerativePart(imageFile));
    }
    if (prompt) {
      userPromptParts.push({ text: prompts });
      userPromptParts.push({ text: uiprompt });
      userPromptParts.push({ text: prompt });
    }

    const messages = [
      { role: "user", parts: userPromptParts },
      { role: "user", parts: [{ text: getSystemPrompt() }] },
    ];

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({ contents: messages });

    return NextResponse.json({ response: result.response.text() });
  } catch (error: any) {
    console.error("AI API error:", error);
    return NextResponse.json({ error: error.message });
  }
}