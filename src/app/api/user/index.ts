// import dbConnect from "@/dbConfig/dbConfig";
// import User from "@/models/userModel";
// import { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   await dbConnect();

//   const { method, query, body } = req;
//   console.log(method, query, body)

//   switch (method) {
//     case "GET":
//       try {
//         const { userId } = query as { userId: string };
//         if (!userId) {
//           return res.status(400).json({ error: "User ID is required" });
//         }

//         const user = await User.findById(userId).populate("projects groups");
//         if (!user) {
//           return res.status(404).json({ error: "User not found" });
//         }

//         res.status(200).json(user);
//       } catch (error: any) {
//         res.status(500).json({ error: error.message });
//       }
//       break;

//     case "PUT":
//       try {
//         const { userId } = query as { userId: string };
//         const { name, email, profilePic } = body;

//         if (!userId) {
//           return res.status(400).json({ error: "User ID is required" });
//         }

//         const updatedUser = await User.findByIdAndUpdate(
//           userId,
//           { name, email, profilePic },
//           { new: true }
//         );

//         if (!updatedUser) {
//           return res.status(404).json({ error: "User not found" });
//         }

//         res.status(200).json(updatedUser);
//       } catch (error: any) {
//         res.status(500).json({ error: error.message });
//       }
//       break;

//     default:
//       res.setHeader("Allow", ["GET", "PUT"]);
//       res.status(405).end(`Method ${method} Not Allowed`);
//   }
// }




















import dbConnect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

dbConnect();

// GET: Fetch user details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const user = await User.findById(userId).populate("projects groups");
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update user details
export async function PUT(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { userId, name, email, profilePic } = reqBody;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, profilePic },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "User updated successfully.", user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
