import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/dbConfig/dbConfig";
import UserModel, { IUser } from "@/models/userModel";
import type { AuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  callbacks: {
    // ✅ Create user in DB if not exists
    async signIn({ user }: { user: User }) {
      await dbConnect();

      const existingUser = await UserModel.findOne({ email: user.email });
      if (!existingUser) {
        await UserModel.create({
          name: user.name,
          email: user.email,
        });
      }

      return true;
    },

    // ✅ Add user ID to JWT (and handle deleted user case)
    async jwt({ token }) {
      await dbConnect();

      const userInDb = await UserModel.findOne<IUser>({ email: token.email });

      if (!userInDb) {
        // 🔴 Token will still be returned, but without id
        delete token.id;
      } else {
        token.id = userInDb._id.toString(); // ✅ No TS error now
      }

      return token;
    },

    // ✅ Safely expose user ID in session
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.id) {
        session.user.id = token.id as string;
      } else {
        // Don't return null — this breaks NextAuth's expected types
        // Instead, just don't set session.user.id
      }

      return session;
    },

    // ✅ Safe redirect
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
};