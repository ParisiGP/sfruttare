import type { ReactNode } from "react";

import styles from "./AuthLayout.module.css";

export function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className={styles.container}>
      {children}
    </main>
  );
}
