import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Acesso restrito a administradores.");
  }

  return session.user;
}
