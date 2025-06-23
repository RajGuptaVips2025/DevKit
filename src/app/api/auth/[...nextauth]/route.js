import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/dbConfig/dbConfig"; // Adjust path if necessary
import User from "@/models/userModel";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      await dbConnect();
      const existingUser = await User.findOne({ email: user.email });
      if (!existingUser) {
        await User.create({ name: user.name, email: user.email });
      }
      return true;
    },
    async session({ session }) {
      await dbConnect();
      const dbUser = await User.findOne({ email: session.user?.email });
      if (dbUser) session.user.id = dbUser._id.toString();
      return session;
    },
    async redirect({ baseUrl }) {
      return baseUrl; // ✅ Always redirect to http://localhost:3000
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };