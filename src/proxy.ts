import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = req.nextUrl.pathname === "/admin/login";
  const isPerfilRoute = req.nextUrl.pathname === "/perfil";

  // Permite acessar a tela de login sem estar autenticado
  if (isLoginRoute) {
    return;
  }

  // Bloqueia qualquer outra rota /admin para quem não for ADMIN
  if (isAdminRoute && !isAdmin) {
    return Response.redirect(new URL("/admin/login", req.nextUrl));
  }

  // Perfil exige apenas sessão ativa, qualquer role
  if (isPerfilRoute && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/perfil"],
};