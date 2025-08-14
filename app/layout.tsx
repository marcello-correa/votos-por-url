import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Votos por URL — Câmara dos Deputados",
  description: "Cole a URL da votação da Câmara e baixe a planilha com os votos nominais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}