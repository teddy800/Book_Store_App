import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Add others (e.g., Credentials for email/password)
  ],
  session: {
    strategy: 'jwt', // Use JWT for client-side
  },
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page if needed
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // For Vercel/Netlify
};

export default NextAuth(authOptions);