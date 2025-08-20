export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemPrompt, getSystemPromptAngular } from "../prompts";

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
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string | null;
    const prompts = formData.get("prompts") as string | null;
    const uiprompt = formData.get("uiprompt") as string | null;
    const imageFile = formData.get("image") as File | null;
    const modelName = (formData.get("model") as string) || "gemini-1.5-flash"; 
    const framework = (formData.get("framework") as string);
    const systemPrompt =
      framework?.toLowerCase() === "angular" ? getSystemPromptAngular() : getSystemPrompt();

    // Construct the multimodal message parts
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
    console.error("Error in AI API call:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


















// import { NextRequest, NextResponse } from "next/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { getSystemPrompt } from "../prompts";

// async function fileToGenerativePart(file: File) {
//   const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
//   return { inlineData: { data: base64, mimeType: file.type } };
// }

// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData();
//     const prompt = formData.get("prompt") as string | null;
//     const prompts = formData.get("prompts") as string | null;
//     const uiprompt = formData.get("uiprompt") as string | null;
//     const modelName = (formData.get("model") as string) || "gemini-1.5-flash";
//     const imageFile = formData.get("image") as File | null;
//     const email = formData.get("email") as string | null;

//     if (!email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const userPromptParts: any[] = [];

//     if (imageFile) {
//       userPromptParts.push(await fileToGenerativePart(imageFile));
//     }
//     if (prompt) {
//       userPromptParts.push({ text: prompts });
//       userPromptParts.push({ text: uiprompt });
//       userPromptParts.push({ text: prompt });
//     }

//     const messages = [
//       { role: "user", parts: userPromptParts },
//       { role: "user", parts: [{ text: getSystemPrompt() }] },
//     ];

//     const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
//     const model = genAI.getGenerativeModel({ model: modelName });
//     const result = await model.generateContent({ contents: messages });
//     return NextResponse.json({ response: result.response.text() });
//   } catch (error: any) {
//     console.error("AI API error:", error);
//     return NextResponse.json({ error: error });
//   }
// }