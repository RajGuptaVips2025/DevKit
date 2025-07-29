import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { basePrompt as nodeBasePrompt } from "../defaults/node";
import { basePrompt as reactBasePrompt } from "../defaults/react";
import { BASE_PROMPT } from "../prompts";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { prompt } = reqBody;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const system =
      "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra";

    const req = {
      contents: [
        { role: "user", parts: [{ text: prompt }] },
        { role: "user", parts: [{ text: system }] },
      ],
    };

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(req);

    // Await the result.text() method to get the actual answer
    const answer = result.response.text().trim(); // react or node

    if (answer.toLowerCase().includes("react")) {
      return NextResponse.json({
        prompts: [BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
     
    }else {
      return NextResponse.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
      
    }

    // return NextResponse.json({ message: "You can't access this" }, { status: 403 });
  } catch (error: any) {
    console.error("Error in AI API call:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
