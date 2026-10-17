"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { sair } from "@/app/admin/acoes";
import { Logo } from "./logo";

const LINKS = [
  { href: "/admin/painel", rotulo: "Chamados" },
  { href: "/admin/mesas", rotulo: "Mesas e QR Codes" },
];

export function BarraAdmin({ children, modoDemo }: { children?: React.ReactNode; modoDemo: boolean }) {
  const caminho = usePathname();

  return (
    <>
      {modoDemo && (
        <p className="bg-conta px-4 py-2 text-center text-sm font-semibold text-tinta print:hidden">
          Modo demonstração: os dados ficam só na memória e somem ao reiniciar. Configure o Supabase para usar no
          restaurante.
        </p>
      )}
      <header className="border-b border-tinta-3 bg-tinta print:hidden">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/admin/painel" aria-label="Início do painel" className="shrink-0">
            <Logo fundo="escuro" altura={34} />
          </Link>
          <nav className="flex gap-1" aria-label="Seções do painel">
            {LINKS.map((l) => {
              const ativo = caminho === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 font-semibold ${
                    ativo ? "bg-tinta-2 text-white" : "text-nevoa hover:text-white"
                  }`}
                >
                  {l.rotulo}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {children}
            <form action={sair}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-nevoa hover:text-white"
              >
                <LogOut className="size-4" aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
    </>
  );
}
