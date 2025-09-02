import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/dbConfig/dbConfig";
import UserModel, { IUser } from "@/models/userModel";
import type { AuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import redis from "@/lib/redis";
import { expireKey, getJson, setJson } from "@/lib/redisHelpers";

export const authOptions: AuthOptions = {
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

      let existingUser = await UserModel.findOne({ email: user.email });
      if (!existingUser) {
        existingUser = await UserModel.create({
          name: user.name,
          email: user.email,
        });
      }

      try {
        await redis.set(
          `user:${existingUser._id}`,
          JSON.stringify({
            id: existingUser._id.toString(),
            name: existingUser.name,
            email: existingUser.email,
          }),
          { ex: 60 * 5 }
        );
      } catch (e) {
        console.error("Redis error (signIn):", e);
      }

      return true;
    },

    async jwt({ token }) {
      await dbConnect();

      try {
        const cachedUser = await getJson<{ id: string; name?: string; email?: string }>(`user:${token.id || ""}`);

        if (cachedUser) {
          const parsed = typeof cachedUser === "string"
            ? (cachedUser as unknown as { id?: string })
            : cachedUser;

          if (parsed && (parsed as any).id) {
            token.id = (parsed as any).id;
          }

          try {
            await expireKey(`user:${token.id}`, { ex: 60 * 5 });
          } catch (e) {
            console.error(e);
            await setJson(`user:${token.id}`, parsed, { ex: 60 * 5 });
          }
        } else if (token.email) {
          const userInDb = await UserModel.findOne<IUser>({ email: token.email });
          if (userInDb) {
            token.id = userInDb._id.toString();
            await setJson(
              `user:${userInDb._id}`,
              { id: userInDb._id.toString(), name: userInDb.name, email: userInDb.email },
              { ex: 60 * 5 }
            );
          } else {
            delete token.id;
          }
        }
      } catch (e) {
        console.error("Redis error (jwt):", e);
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
};