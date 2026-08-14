import { AuthLayout } from "@/components/auth/AuthLayout/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm/LoginForm";

type LoginPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = (await searchParams) ?? {};

  const callbackUrlParam = params.callbackUrl;

  const callbackUrl = Array.isArray(callbackUrlParam)
    ? callbackUrlParam[0]
    : callbackUrlParam;

  return (
    <AuthLayout>
      <LoginForm
        subtitle="Entrar na sua conta"
        exibirLinkCadastro
        callbackUrl={callbackUrl}
      />
    </AuthLayout>
  );
}
