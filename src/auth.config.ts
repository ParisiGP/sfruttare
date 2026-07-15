import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },

  session: {
    strategy: "jwt",
  },

  providers: [],

  callbacks: {},
} satisfies NextAuthConfig;