import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { basePrompt as nodeBasePrompt } from "../defaults/node";
import { basePrompt as reactBasePrompt } from "../defaults/react";
import { basePrompt as angularBasePrompt } from "../defaults/angular";
import { BASE_PROMPT, BASE_PROMPT_ANGULAR } from "../prompts";
import cloudinary from "@/lib/cloudinary";
import streamifier from "streamifier";

async function uploadToCloudinary(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "your-folder-name",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || "");
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string | null;
    const imageFile = formData.get("image") as File | null;
    const framework = (formData.get("framework") as string);

    let imageUrl = null;
    console.log(prompt, imageFile)

    if (imageFile) {
      imageUrl = await uploadToCloudinary(imageFile);
      console.log("Uploaded to Cloudinary:", imageUrl);
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const system = "Return either node, react, or angular based on what you think this project should be. Only return a single word: either 'node', 'react', or 'angular'. Do not return anything extra.";

    const req = {
      contents: [
        { role: "user", parts: [{ text: prompt }] },
        { role: "user", parts: [{ text: system }] },
      ],
    };

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(req);

    const answer = result.response.text().trim();

    if (framework.toLowerCase() === "react") {
      return NextResponse.json({
        prompts: [BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
        imageUrl,
      });

    } else if (framework.toLowerCase() === "angular") {
      return NextResponse.json({
        prompts: [BASE_PROMPT_ANGULAR,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${angularBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [angularBasePrompt],
        imageUrl,
      })
    } else {
      return NextResponse.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });

    }

  } catch (error: any) {
    console.error("Error in AI API call:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
