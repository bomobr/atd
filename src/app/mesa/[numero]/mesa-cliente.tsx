"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, Check, ConciergeBell, Footprints, Receipt } from "lucide-react";
import { Logo } from "@/components/logo";
import { LOGO } from "@/lib/marca";
import { horaCurta } from "@/lib/tempo";
import { useChamadosMesa } from "@/lib/use-chamados-mesa";
import {
  COOLDOWN_SEGUNDOS,
  NOME_STATUS,
  porDigitos,
  type Chamado,
  type ConfigTempoReal,
  type StatusChamado,
  type TipoChamado,
} from "@/lib/tipos";

interface Props {
  numero: number;
  tempoReal: ConfigTempoReal;
  restaurante: string;
}

const ROTULO_TIPO: Record<TipoChamado, string> = { garcom: "Garçom", conta: "Conta" };

export function MesaCliente({ numero, tempoReal, restaurante }: Props) {
  const { chamados, restante, bloqueado, enviando, aviso, chamar } = useChamadosMesa(numero, tempoReal);

  useEffect(() => {
    document.title = `Mesa ${numero}`;
  }, [numero]);

  return (
    <main className="min-h-dvh bg-papel text-tinta">
      <header className="bg-tinta px-6 pt-8 pb-9 text-white">
        <div className="mx-auto max-w-md">
          <Logo fundo="escuro" altura={52} alt={restaurante || LOGO.nome} className="mb-7" />
          <h1>
            <span className="block text-lg text-nevoa">Você está na</span>
            <span className="mt-1 flex items-end gap-4">
              <span className="largo pb-2 text-3xl font-bold">Mesa</span>
              <span
                className={`numeral text-white ${porDigitos(numero, [
                  "text-[clamp(6rem,34vw,9.5rem)]",
                  "text-[clamp(4.5rem,24vw,7rem)]",
                  "text-[clamp(3.5rem,17vw,5.25rem)]",
                ])}`}
              >
                {numero}
              </span>
            </span>
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-md px-5 pt-6 pb-10">
        <div className="grid gap-4">
          <BotaoChamado
            tipo="garcom"
            titulo="Chamar garçom"
            detalhe="Alguém da equipe vem até a sua mesa"
            icone={<ConciergeBell className="size-9" strokeWidth={2.2} aria-hidden />}
            onClick={() => chamar("garcom")}
            desabilitado={bloqueado}
            enviando={enviando === "garcom"}
            restante={restante}
          />
          <BotaoChamado
            tipo="conta"
            titulo="Pedir a conta"
            detalhe="Levamos a conta até a sua mesa"
            icone={<Receipt className="size-9" strokeWidth={2.2} aria-hidden />}
            onClick={() => chamar("conta")}
            desabilitado={bloqueado}
            enviando={enviando === "conta"}
            restante={restante}
          />
          <Link
            href={`/mesa/${numero}/cardapio`}
            className="flex min-h-24 w-full items-center gap-5 rounded-3xl bg-white px-6 py-5 text-tinta shadow-[0_6px_0_var(--color-linha)] ring-2 ring-linha transition-[transform,box-shadow] duration-100 active:translate-y-1 active:shadow-[0_2px_0_var(--color-linha)]"
          >
            <BookOpen className="size-9 shrink-0" strokeWidth={2.2} aria-hidden />
            <span className="min-w-0">
              <span className="largo block text-2xl leading-tight font-bold">Ver cardápio</span>
              <span className="mt-1 block text-base leading-snug text-cinza">Pratos, bebidas e preços</span>
            </span>
          </Link>
        </div>

        {restante > 0 && (
          <div className="mt-4" aria-hidden>
            <div className="h-1.5 overflow-hidden rounded-full bg-linha">
              <div
                className="h-full rounded-full bg-tinta/40 transition-[width] duration-300 ease-linear"
                style={{ width: `${Math.min(100, (restante / COOLDOWN_SEGUNDOS) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div aria-live="polite" className="mt-5 empty:hidden">
          {aviso && (
            <p
              className={
                aviso.tom === "erro"
                  ? "rounded-2xl bg-alerta/10 px-4 py-3 font-semibold text-alerta"
                  : "flex items-start gap-3 rounded-2xl bg-garcom-claro px-4 py-3 font-semibold text-garcom-escuro"
              }
            >
              {aviso.tom !== "erro" && <Check className="mt-0.5 size-5 shrink-0" strokeWidth={3} aria-hidden />}
              {aviso.texto}
            </p>
          )}
        </div>

        {chamados.length > 0 && (
          <section className="mt-8" aria-labelledby="seus-chamados">
            <h2 id="seus-chamados" className="largo text-lg font-bold">
              Seus chamados
            </h2>
            <ul className="mt-3 divide-y divide-linha border-y border-linha">
              {chamados.map((c) => (
                <LinhaChamado key={c.id} chamado={c} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function BotaoChamado(props: {
  tipo: TipoChamado;
  titulo: string;
  detalhe: string;
  icone: React.ReactNode;
  onClick: () => void;
  desabilitado: boolean;
  enviando: boolean;
  restante: number;
}) {
  const { tipo, titulo, detalhe, icone, onClick, desabilitado, enviando, restante } = props;
  const cores =
    tipo === "garcom"
      ? "bg-garcom text-white shadow-[0_6px_0_var(--color-garcom-escuro)] active:shadow-[0_2px_0_var(--color-garcom-escuro)]"
      : "bg-conta text-tinta shadow-[0_6px_0_var(--color-conta-escuro)] active:shadow-[0_2px_0_var(--color-conta-escuro)]";

  let legenda = detalhe;
  if (enviando) legenda = "Enviando…";
  else if (restante > 0) legenda = `Você pode chamar de novo em ${restante} s`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className={`flex min-h-28 w-full items-center gap-5 rounded-3xl px-6 py-5 text-left transition-[transform,box-shadow,opacity] duration-100 active:translate-y-1 disabled:translate-y-1 disabled:opacity-55 disabled:shadow-none ${cores}`}
    >
      <span className="shrink-0">{icone}</span>
      <span className="min-w-0">
        <span className="largo block text-2xl leading-tight font-bold">{titulo}</span>
        <span className="mt-1 block text-base leading-snug opacity-85">{legenda}</span>
      </span>
    </button>
  );
}

function LinhaChamado({ chamado }: { chamado: Chamado }) {
  const { status, tipo } = chamado;
  const selo: Record<StatusChamado, string> = {
    pendente: "bg-conta-claro text-tinta",
    em_atendimento: "bg-garcom text-white",
    atendido: "bg-linha text-cinza",
  };
  const Icone = status === "atendido" ? Check : status === "em_atendimento" ? Footprints : null;

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3">
      <span className="flex items-center gap-3">
        <span
          className={`size-3 rounded-full ${tipo === "garcom" ? "bg-garcom" : "bg-conta"}`}
          aria-hidden
        />
        <span>
          <span className="block font-semibold">{ROTULO_TIPO[tipo]}</span>
          <span className="block text-sm text-cinza">pedido às {horaCurta(chamado.created_at)}</span>
        </span>
      </span>
      <span
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${selo[status]}`}
      >
        {Icone && <Icone className="size-4" strokeWidth={2.5} aria-hidden />}
        {NOME_STATUS[status]}
      </span>
    </li>
  );
}
