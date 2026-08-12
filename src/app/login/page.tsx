import { AuthLayout } from "@/components/auth/AuthLayout/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm subtitle="Entrar na sua conta" exibirLinkCadastro />
    </AuthLayout>
  );
}
