import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import { auth } from "@/auth";
import {
  ClientHeader,
} from "@/components/layout/Header/ClientHeader/ClientHeader";
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
    "Brecho premium de pecas unicas, moda consciente e estilo vintage sofisticado.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <SessionProvider session={session}>
          <div className="app-shell">
            <ClientHeader />
            <div className="app-content">
              {children}
            </div>
            <footer className="site-footer">
              <div>
                <strong>sfruttare</strong>
                <span>
                  Pecas unicas, selecionadas com
                  carinho para contar novas historias.
                </span>
              </div>
              <small>
                © 2026 Sfruttare Brecho. Todos os
                direitos reservados.
              </small>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
