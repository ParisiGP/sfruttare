export async function requireAdmin() {
  // Auth is not wired yet. Keep every admin entrypoint going through this
  // helper so NextAuth role checks can be enabled in one place later.
  return {
    id: "temporary-admin",
    role: "ADMIN" as const,
  };
}
