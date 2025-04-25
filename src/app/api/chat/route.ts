// api/gemini/route.ts

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemPrompt } from "../prompts";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    let { messages } = reqBody;
    const responsee=getSystemPrompt();
    messages.push({ role: "user", parts:responsee})
    messages=JSON.stringify(messages)
    console.log("messages --->  ",messages,'\n\n')

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
        const result = await model.generateContent(messages);
        console.log("response --->  ",result.response.text(),'\n\n')
        return NextResponse.json({response:result.response.text()})
    } catch (error: any) {
    console.error("Error in AI API call:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// export async function POST(request: NextRequest) {
//   try {
//     const reqBody = await request.json();
//     let { messages } = reqBody;
//     const systemPrompt = getSystemPrompt();
    
//     messages.push({ role: "user", parts: systemPrompt });

//     console.log("messages --->", messages);

//     const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//     const result = await model.generateContent(messages);
//     const text = result.response.text();

//     console.log("response --->", text);
//     return NextResponse.json({ response: text });

//   } catch (error: any) {
//     console.error("Error in AI API call:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }
