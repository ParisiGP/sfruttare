import { requireAdmin } from "@/lib/auth/requireAdmin";
import { UsuarioService } from "@/modules/usuario/usuario.service";
import { UsuariosAdmin } from "@/components/admin/UsuariosAdmin/UsuariosAdmin";

type UsuariosPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export default async function UsuariosPage({
  searchParams,
}: UsuariosPageProps) {
  const admin = await requireAdmin();

  const params =
    (await searchParams) ?? {};

  const buscaParam = params.busca;

  const busca =
    typeof buscaParam === "string"
      ? buscaParam
      : Array.isArray(buscaParam)
        ? (buscaParam[0] ?? "")
        : "";

  const usuarioService =
    new UsuarioService();

  const usuarios =
    await usuarioService.listarUsuarios(
      busca || undefined
    );

  return (
    <main>
      <UsuariosAdmin
        usuarios={usuarios}
        busca={busca}
        adminId={admin.id}
      />
    </main>
  );
}
