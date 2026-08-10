import { auth } from "@/auth";

export default auth((req) => {
  const isAdmin = req.auth?.user?.role === "ADMIN";
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = req.nextUrl.pathname === "/admin/login";

  // Permite acessar a tela de login sem estar autenticado
  if (isLoginRoute) {
    return;
  }

  // Bloqueia qualquer outra rota /admin para quem não for ADMIN
  if (isAdminRoute && !isAdmin) {
    return Response.redirect(new URL("/admin/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};