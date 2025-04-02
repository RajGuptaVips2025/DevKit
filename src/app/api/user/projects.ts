import dbConnect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { method, body } = req;

  switch (method) {
    case "POST":
      try {
        const { userId, projectId } = body;

        if (!userId || !projectId) {
          return res.status(400).json({ error: "User ID and Project ID are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (!user.projects.includes(projectId)) {
          user.projects.push(projectId);
          await user.save();
        }

        res.status(200).json({ message: "Project added to user", user });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
      break;

    case "DELETE":
      try {
        const { userId, projectId } = body;

        if (!userId || !projectId) {
          return res.status(400).json({ error: "User ID and Project ID are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        user.projects = user.projects.filter(
          (id) => id.toString() !== projectId.toString()
        );
        await user.save();

        res.status(200).json({ message: "Project removed from user", user });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
      break;

    default:
      res.setHeader("Allow", ["POST", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
