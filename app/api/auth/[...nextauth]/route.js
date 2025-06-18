import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      
      if (existingUser) {
        // Update last login time
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { updatedAt: new Date() },
        });
        
        return true;
      } else {
        // Create new user
        const newUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            image: user.image,
          },
        });
        
        return !!newUser;
      }
    },
    async session({ session, token }) {
      if (session?.user) {
        // Get user from database
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
        
        if (dbUser) {
          // Add user ID to session
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };