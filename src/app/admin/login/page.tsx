import { LoginForm } from "@/components/admin/LoginForm/LoginForm";

import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.container}>
      <LoginForm />
    </main>
  );
}