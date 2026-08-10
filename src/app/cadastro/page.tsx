import { AuthLayout } from "@/components/auth/AuthLayout/AuthLayout";
import { CadastroForm } from "@/components/auth/CadastroForm/CadastroForm";

export default function CadastroPage() {
  return (
    <AuthLayout>
      <CadastroForm />
    </AuthLayout>
  );
}
