import { AuthLayout } from "@/components/auth/AuthLayout/AuthLayout";
import { CadastroForm } from "@/components/auth/CadastroForm/CadastroForm";

type CadastroPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export default async function CadastroPage({
  searchParams,
}: CadastroPageProps) {
  const params = (await searchParams) ?? {};

  const callbackUrlParam = params.callbackUrl;

  const callbackUrl = Array.isArray(callbackUrlParam)
    ? callbackUrlParam[0]
    : callbackUrlParam;

  return (
    <AuthLayout>
      <CadastroForm callbackUrl={callbackUrl} />
    </AuthLayout>
  );
}
