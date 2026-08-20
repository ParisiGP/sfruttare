"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Camera } from "lucide-react";

import { Ornamento } from "@/components/store/Ornamento/Ornamento";

import styles from "./SiteFooter.module.css";

const navegacao = [
  { href: "/", label: "Início" },
  { href: "/pecas", label: "Peças" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

const ajuda = [
  {
    href: "/ajuda/perguntas-frequentes",
    label: "Perguntas frequentes",
  },
  {
    href: "/ajuda/trocas-e-devolucoes",
    label: "Trocas e devoluções",
  },
  {
    href: "/ajuda/politica-de-privacidade",
    label: "Política de privacidade",
  },
];

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const anoAtual = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Image
            src="/logo-sfruttare-completo.png"
            alt="Sfruttare"
            width={1619}
            height={971}
            className={styles.logo}
          />

          <span className={styles.tagline}>
            Peças únicas, selecionadas com carinho
            para contar novas histórias.
          </span>
        </div>

        <nav
          className={styles.column}
          aria-label="Navegação"
        >
          <p className={styles.columnTitle}>
            Navegação
          </p>

          {navegacao.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <nav
          className={styles.column}
          aria-label="Ajuda"
        >
          <p className={styles.columnTitle}>
            Ajuda
          </p>

          {ajuda.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.column}>
          <p className={styles.columnTitle}>
            Contato
          </p>

          <a href="tel:+5511999999999">
            <Phone size={15} strokeWidth={1.6} />
            (11) 99999-9999
          </a>

          <a href="mailto:contato@sfruttare.com.br">
            <Mail size={15} strokeWidth={1.6} />
            contato@sfruttare.com.br
          </a>

          <a
            href="https://www.instagram.com/sfruttare/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Camera size={15} strokeWidth={1.6} />
            @sfruttare
          </a>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <Ornamento
          className={styles.bottomOrnament}
          width={56}
          height={14}
        />

        <small>
          © {anoAtual} Sfruttare Brechó. Todos os
          direitos reservados.
        </small>
      </div>
    </footer>
  );
}
