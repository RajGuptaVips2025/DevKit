// import { NextRequest, NextResponse } from "next/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { getSystemPrompt } from "../prompts";

// export async function POST(request: NextRequest) {
//   try {
//     const reqBody = await request.json();
//     const { messages } = reqBody;
//     const responsee=getSystemPrompt();
//     console.log(messages)
//     const req = {
//         contents:messages,
//     };
  
//       const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
//       const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
//       const result = await model.generateContent(req);
//   console.log(result.response.text())
//   return NextResponse.json({response:result.response.text()})
//   } catch (error: any) {
//     console.error("Error in AI API call:", error.message);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }



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