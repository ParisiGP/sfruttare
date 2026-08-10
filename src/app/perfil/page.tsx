import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UsuarioService } from "@/modules/usuario/usuario.service";
import { PerfilForm } from "@/components/auth/PerfilForm/PerfilForm";

export default async function PerfilPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuarioService =
    new UsuarioService();

  const usuario =
    await usuarioService.buscarPorId(
      session.user.id
    );

  if (!usuario) {
    redirect("/login");
  }

  return (
    <main>
      <PerfilForm
        usuario={{
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
        }}
      />
    </main>
  );
}
