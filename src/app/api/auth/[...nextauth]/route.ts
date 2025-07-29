import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/dbConfig/dbConfig";
import UserModel, { IUser } from "@/models/userModel";
import type { HydratedDocument } from "mongoose";
import { Types } from "mongoose";
import type { Session, User } from "next-auth";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  callbacks: {
    async signIn({ user }: { user: User }) {
      await dbConnect();

      try {
        const existingUser = await UserModel.findOne({ email: user.email });
        if (!existingUser) {
          await UserModel.create({
            name: user.name,
            email: user.email,
          });
        }
        return true;
      } catch (err) {
        console.error("Error in signIn callback:", err);
        return false; // Prevent login if error occurs
      }
    },

    async session({ session }: { session: Session }) {
      await dbConnect();
      const dbUser = (await UserModel.findOne({
        email: session.user?.email,
      })) as HydratedDocument<IUser>;

      if (dbUser && session.user) {
        session.user.id = (dbUser._id as Types.ObjectId).toString();
      }
      return session;
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };