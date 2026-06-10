import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header/Header";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <div className="app-shell">
          <Header />
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
      </body>
    </html>
  );
}
