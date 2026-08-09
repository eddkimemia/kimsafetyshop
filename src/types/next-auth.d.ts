import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin" | "superadmin";
      company?: string | null;
      phone?: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role?: "user" | "admin" | "superadmin";
    company?: string | null;
    phone?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: string;
    company?: string | null;
    phone?: string | null;
  }
}
