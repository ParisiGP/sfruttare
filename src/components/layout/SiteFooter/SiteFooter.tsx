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
          Peças unicas, selecionadas com
          carinho para contar novas historias.
        </span>
      </div>
      <small>
        © 2026 Sfruttare Brecho. Todos os
        direitos reservados.
      </small>
    </footer>
  );
}
