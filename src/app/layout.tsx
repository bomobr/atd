import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import { LOGO } from "@/lib/marca";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: LOGO.nome, template: `%s | ${LOGO.nome}` },
  description: "Veja o cardápio, chame o garçom ou peça a conta direto do seu celular.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14232e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
