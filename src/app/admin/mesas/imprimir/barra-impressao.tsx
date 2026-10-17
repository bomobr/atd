"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

const OPCOES = [
  { por: 4, rotulo: "4 por folha", detalhe: "tamanho A6" },
  { por: 2, rotulo: "2 por folha", detalhe: "tamanho A5" },
  { por: 1, rotulo: "1 por folha", detalhe: "tamanho A4" },
] as const;

export function BarraImpressao({ porFolha, filtro, total }: { porFolha: number; filtro: string; total: number }) {
  const href = (por: number) => {
    const p = new URLSearchParams({ por: String(por) });
    if (filtro) p.set("mesas", filtro);
    return `/admin/mesas/imprimir?${p}`;
  };

  return (
    <div className="sticky top-0 z-10 border-b border-tinta-3 bg-tinta text-white print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/admin/mesas" className="font-semibold text-nevoa hover:text-white">
          Voltar para as mesas
        </Link>
        <div className="flex gap-1 rounded-xl bg-tinta-2 p-1" role="group" aria-label="Tamanho das plaquinhas">
          {OPCOES.map((o) => (
            <Link
              key={o.por}
              href={href(o.por)}
              replace
              aria-current={porFolha === o.por ? "true" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                porFolha === o.por ? "bg-white text-tinta" : "text-nevoa hover:text-white"
              }`}
            >
              {o.rotulo} <span className="opacity-70">({o.detalhe})</span>
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={total === 0}
          className="largo ml-auto flex items-center gap-2 rounded-xl bg-conta px-5 py-2.5 font-bold text-tinta disabled:opacity-50"
        >
          <Printer className="size-5" aria-hidden />
          Imprimir {total === 1 ? "1 plaquinha" : `${total} plaquinhas`}
        </button>
      </div>
      <p className="mx-auto max-w-5xl px-4 pb-3 text-sm text-nevoa">
        Na janela de impressão, escolha papel A4, margens &quot;Nenhuma&quot; e escala 100%. As linhas tracejadas
        marcam onde cortar.
      </p>
    </div>
  );
}
