import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import { auth } from "@/auth";
import { CarrinhoService } from "@/modules/carrinho/carrinho.service";
import {
  ClientHeader,
} from "@/components/layout/Header/ClientHeader/ClientHeader";
import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import "@/styles/globals.scss";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sfruttare Brecho",
  description:
    "Brecho premium de peças únicas, moda consciente e estilo vintage sofisticado.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  const quantidadeCarrinho = session?.user
    ? await new CarrinhoService().contarItens(
        session.user.id
      )
    : 0;

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <SessionProvider session={session}>
          <div className="app-shell">
            <ClientHeader
              quantidadeCarrinho={quantidadeCarrinho}
            />
            <div className="app-content">
              {children}
            </div>
            <SiteFooter />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
