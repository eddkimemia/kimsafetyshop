import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin" | "superadmin";
    } & DefaultSession["user"];
  }
  interface User {
    role?: "user" | "admin" | "superadmin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: string;
  }
}
