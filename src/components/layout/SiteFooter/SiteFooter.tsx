"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div>
        <strong>sfruttare</strong>
        <span>
          Peças únicas, selecionadas com
          carinho para contar novas histórias.
        </span>
      </div>
      <small>
        © 2026 Sfruttare Brecho. Todos os
        direitos reservados.
      </small>
    </footer>
  );
}
