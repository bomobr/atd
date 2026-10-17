"use client";

import { ConciergeBell } from "lucide-react";
import { useChamadosMesa } from "@/lib/use-chamados-mesa";
import type { ConfigTempoReal } from "@/lib/tipos";

/** Barra fixa no rodapé do cardápio para chamar o garçom sem sair da página. */
export function BarraChamar({ numero, tempoReal }: { numero: number; tempoReal: ConfigTempoReal }) {
  const { chamados, restante, bloqueado, enviando, aviso, chamar } = useChamadosMesa(numero, tempoReal);

  const aberto = chamados.find((c) => c.tipo === "garcom" && c.status !== "atendido");
  let texto = "Escolheu? Chame o garçom para fazer o pedido.";
  if (aviso) texto = aviso.texto;
  else if (aberto?.status === "em_atendimento") texto = "O garçom está vindo até a sua mesa.";
  else if (aberto) texto = "Chamado enviado. Aguarde um instante.";

  let rotulo = "Chamar garçom";
  if (enviando) rotulo = "Enviando…";
  else if (restante > 0) rotulo = `Aguarde ${restante} s`;

  return (
    <>
      <div className="h-28" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-linha bg-white/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <p
            aria-live="polite"
            className={`min-w-0 flex-1 text-sm leading-snug font-semibold ${
              aviso?.tom === "erro" ? "text-alerta" : "text-tinta"
            }`}
          >
            Mesa {numero}. {texto}
          </p>
          <button
            type="button"
            onClick={() => chamar("garcom")}
            disabled={bloqueado}
            className="flex min-w-40 shrink-0 items-center justify-center gap-2 rounded-2xl bg-garcom px-4 py-3.5 font-bold text-white shadow-[0_4px_0_var(--color-garcom-escuro)] transition-[transform,box-shadow,opacity] duration-100 active:translate-y-1 active:shadow-none disabled:translate-y-1 disabled:opacity-55 disabled:shadow-none"
          >
            <ConciergeBell className="size-5 shrink-0" strokeWidth={2.4} aria-hidden />
            {rotulo}
          </button>
        </div>
      </div>
    </>
  );
}
