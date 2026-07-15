import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { authConfig } from "./auth.config";
import { UsuarioService } from "@/modules/usuario/usuario.service";

const usuarioService = new UsuarioService();

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      name: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        senha: {
          label: "Senha",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.senha
        ) {
          return null;
        }

        const usuario =
          await usuarioService.buscarPorEmail(
            String(credentials.email)
          );

        if (!usuario) {
          return null;
        }

        const senhaCorreta =
          await bcrypt.compare(
            String(credentials.senha),
            usuario.senha
          );

        if (!senhaCorreta) {
          return null;
        }

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          role: usuario.role,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          token.id as string;

        session.user.role =
          token.role as
            | "ADMIN"
            | "CLIENTE";
      }

      return session;
    },
  },
});