import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("É necessário estar logado.");
  }

  return session.user;
}
