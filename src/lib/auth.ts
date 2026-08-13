import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await getUserByEmail(credentials.email);
        if (!user || !verifyPassword(credentials.password, user.password_hash)) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          phone: user.phone,
          referral_code: user.referral_code,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "user";
        token.uid = user.id;
        token.company = (user as { company?: string | null }).company ?? null;
        token.phone = (user as { phone?: string | null }).phone ?? null;
        token.referral_code = (user as { referral_code?: string | null }).referral_code ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = (token.role as "user" | "admin" | "superadmin") ?? "user";
        session.user.company = (token.company as string | null) ?? null;
        session.user.phone = (token.phone as string | null) ?? null;
        session.user.referral_code = (token.referral_code as string | null) ?? null;
      }
      return session;
    },
  },
};
