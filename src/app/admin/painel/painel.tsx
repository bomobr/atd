"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, CheckCheck, Clock, ConciergeBell, Receipt, Volume2, VolumeX } from "lucide-react";
import { BarraAdmin } from "@/components/barra-admin";
import { audioLiberado, liberarAudio, tocarCampainha } from "@/lib/som";
import { ouvirChamados } from "@/lib/tempo-real";
import { gravarLocal, horaCurta, lerLocal, minutosDesde, tempoDecorrido, useAgora } from "@/lib/tempo";
import {
  ALERTA_MINUTOS,
  NOME_TIPO,
  porDigitos,
  type Chamado,
  type ConfigTempoReal,
  type StatusChamado,
} from "@/lib/tipos";

interface Props {
  tempoReal: ConfigTempoReal;
  modoDemo: boolean;
}

type Aviso = { id: number; texto: string; erro?: boolean; desfazer?: () => void };

const VOLUME_PADRAO = 30;
const SINCRONIZAR_A_CADA_MS = 30_000;

type WakeLock = { release: () => Promise<void> };

export function Painel({ tempoReal, modoDemo }: Props) {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [turnoIniciado, setTurnoIniciado] = useState(false);
  const [somBloqueado, setSomBloqueado] = useState(false);
  const [volume, setVolume] = useState(VOLUME_PADRAO);
  const [mudo, setMudo] = useState(false);
  const [ajusteRelogio, setAjusteRelogio] = useState(0);
  const [destacados, setDestacados] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const agora = useAgora(10_000, ajusteRelogio);

  // Refs para os callbacks de tempo real enxergarem o valor atual
  const conhecidos = useRef(new Set<string>());
  const primeiraCarga = useRef(true);
  const somRef = useRef({ volume: VOLUME_PADRAO, mudo: false, turno: false });
  const concluidosAqui = useRef(new Map<string, number>());
  const wakeLock = useRef<WakeLock | null>(null);

  somRef.current = { volume, mudo, turno: turnoIniciado };

  // Preferências de som salvas neste computador
  useEffect(() => {
    setVolume(lerLocal("painel:volume", VOLUME_PADRAO));
    setMudo(lerLocal("painel:mudo", false));
  }, []);

  const avisar = useCallback((a: Omit<Aviso, "id">) => setAviso({ ...a, id: Date.now() }), []);

  const tocar = useCallback((novos: Chamado[]) => {
    const { volume, mudo, turno } = somRef.current;
    if (!turno || mudo || !novos.length) return;
    if (!audioLiberado()) {
      setSomBloqueado(true);
      return;
    }
    // Se chegaram vários de uma vez, toca uma vez por tipo, com um intervalo
    const tipos = [...new Set(novos.map((c) => c.tipo))];
    tipos.forEach((tipo, i) => setTimeout(() => tocarCampainha(tipo, volume), i * 1400));
  }, []);

  const destacar = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setDestacados((atual) => new Set([...atual, ...ids]));
    setTimeout(() => {
      setDestacados((atual) => {
        const proximo = new Set(atual);
        ids.forEach((id) => proximo.delete(id));
        return proximo;
      });
    }, 6000);
  }, []);

  /** Aplica um chamado vindo do tempo real ou de uma ação local. */
  const aplicar = useCallback(
    (chamado: Chamado) => {
      setChamados((lista) => {
        const sem = lista.filter((c) => c.id !== chamado.id);
        return chamado.status === "atendido" ? sem : [...sem, chamado];
      });
      if (!conhecidos.current.has(chamado.id)) {
        conhecidos.current.add(chamado.id);
        if (chamado.status === "pendente") {
          tocar([chamado]);
          destacar([chamado.id]);
        }
      }
    },
    [tocar, destacar],
  );

  /** Busca a lista completa no servidor (ao abrir, ao reconectar e a cada 30 s). */
  const sincronizar = useCallback(async () => {
    try {
      const resposta = await fetch("/api/admin/chamados", { cache: "no-store" });
      if (resposta.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!resposta.ok) return;
      const dados = (await resposta.json()) as { chamados: Chamado[]; agora: string };
      setAjusteRelogio(Date.parse(dados.agora) - Date.now());

      const limite = Date.now();
      const lista = dados.chamados.filter((c) => !((concluidosAqui.current.get(c.id) ?? 0) > limite));
      const novos = lista.filter((c) => !conhecidos.current.has(c.id) && c.status === "pendente");
      lista.forEach((c) => conhecidos.current.add(c.id));

      if (!primeiraCarga.current) {
        tocar(novos);
        destacar(novos.map((c) => c.id));
      }
      primeiraCarga.current = false;
      setChamados(lista);
      setCarregado(true);
    } catch {
      // Falha de rede: a próxima tentativa acontece sozinha
    }
  }, [tocar, destacar]);

  // Tempo real + sincronização periódica de segurança
  useEffect(() => {
    sincronizar();
    const parar = ouvirChamados(tempoReal, {
      aoMudar: aplicar,
      aoConectar: (ok) => {
        setConectado(ok);
        if (ok) sincronizar();
      },
    });
    const timer = setInterval(sincronizar, SINCRONIZAR_A_CADA_MS);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") sincronizar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("online", aoVoltar);
    return () => {
      parar();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("online", aoVoltar);
    };
  }, [tempoReal, aplicar, sincronizar]);

  // Mantém a tela ligada durante o turno (quando o navegador permite)
  useEffect(() => {
    if (!turnoIniciado) return;
    const pedir = async () => {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLock> } };
        if (document.visibilityState === "visible" && nav.wakeLock) {
          wakeLock.current = await nav.wakeLock.request("screen");
        }
      } catch {}
    };
    pedir();
    document.addEventListener("visibilitychange", pedir);
    return () => {
      document.removeEventListener("visibilitychange", pedir);
      wakeLock.current?.release().catch(() => {});
    };
  }, [turnoIniciado]);

  // Contador de pendentes no título da aba
  const pendentes = chamados.filter((c) => c.status === "pendente").length;
  useEffect(() => {
    document.title = pendentes ? `(${pendentes}) Chamados` : "Chamados";
  }, [pendentes]);

  // Avisos somem sozinhos
  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(null), aviso.desfazer ? 7000 : 5000);
    return () => clearTimeout(timer);
  }, [aviso]);

  async function iniciarTurno() {
    const ok = await liberarAudio();
    setTurnoIniciado(true);
    setSomBloqueado(!ok);
    if (ok && !mudo) tocarCampainha("garcom", volume);
  }

  async function reativarSom() {
    const ok = await liberarAudio();
    setSomBloqueado(!ok);
    if (ok) tocarCampainha("garcom", volume);
  }

  function mudarVolume(valor: number) {
    setVolume(valor);
    gravarLocal("painel:volume", valor);
    if (valor > 0 && mudo) {
      setMudo(false);
      gravarLocal("painel:mudo", false);
    }
  }

  function alternarMudo() {
    setMudo(!mudo);
    gravarLocal("painel:mudo", !mudo);
  }

  /** Atualiza na tela na hora e confirma no servidor; se falhar, volta para `comoEstava`. */
  async function mudarStatus(
    chamado: Chamado,
    status: StatusChamado,
    comoEstava: Chamado = chamado,
  ): Promise<"ok" | "conflito" | "erro"> {
    const ocultar = (c: Chamado) => {
      if (c.status === "atendido") concluidosAqui.current.set(c.id, Date.now() + 15_000);
      else concluidosAqui.current.delete(c.id);
    };
    const novo = { ...chamado, status, atendido_em: status === "atendido" ? new Date().toISOString() : null };
    ocultar(novo);
    aplicar(novo);

    try {
      const resposta = await fetch(`/api/admin/chamados/${chamado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (resposta.status === 401) {
        window.location.href = "/admin/login";
        return "erro";
      }
      if (resposta.status === 404) {
        concluidosAqui.current.delete(chamado.id);
        sincronizar();
        return "erro";
      }
      if (resposta.status === 409) {
        ocultar(comoEstava);
        aplicar(comoEstava);
        return "conflito";
      }
      if (!resposta.ok) throw new Error(String(resposta.status));
      aplicar((await resposta.json()).chamado as Chamado);
      return "ok";
    } catch {
      ocultar(comoEstava);
      aplicar(comoEstava); // volta como estava
      return "erro";
    }
  }

  async function concluir(chamado: Chamado) {
    const r = await mudarStatus(chamado, "atendido");
    if (r === "ok") {
      avisar({
        texto: `Mesa ${chamado.mesa_numero} atendida.`,
        desfazer: () => desfazer(chamado),
      });
    } else {
      avisar({ texto: `Não foi possível concluir a mesa ${chamado.mesa_numero}. Tente de novo.`, erro: true });
    }
  }

  async function desfazer(chamado: Chamado) {
    setAviso(null);
    const r = await mudarStatus(chamado, chamado.status, { ...chamado, status: "atendido" });
    if (r === "conflito") {
      avisar({
        texto: `A mesa ${chamado.mesa_numero} já fez um novo pedido desse tipo. Ele está na tela.`,
        erro: true,
      });
      sincronizar();
    } else if (r === "erro") {
      avisar({ texto: "Não foi possível desfazer. Tente de novo.", erro: true });
    }
  }

  async function atender(chamado: Chamado) {
    const r = await mudarStatus(chamado, "em_atendimento");
    if (r !== "ok") avisar({ texto: `Não foi possível atualizar a mesa ${chamado.mesa_numero}.`, erro: true });
  }

  const ordenados = [...chamados].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const emAtendimento = chamados.length - pendentes;

  return (
    <div className="min-h-dvh bg-tinta text-white">
      <BarraAdmin modoDemo={modoDemo}>
        <StatusConexao conectado={conectado} />
        {somBloqueado && turnoIniciado && (
          <button
            type="button"
            onClick={reativarSom}
            className="rounded-lg bg-alerta px-3 py-2 text-sm font-bold text-white"
          >
            Som desativado. Clique para ativar
          </button>
        )}
        <ControleVolume
          volume={volume}
          mudo={mudo}
          aoMudarVolume={mudarVolume}
          aoAlternarMudo={alternarMudo}
          aoTestar={() => (audioLiberado() ? tocarCampainha("garcom", volume) : reativarSom())}
        />
      </BarraAdmin>

      <main className="mx-auto max-w-[1600px] px-4 pt-6 pb-24 sm:px-6">
        <div className="mb-6 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <h1 className="largo text-3xl font-bold">Chamados em aberto</h1>
          {carregado && (
            <p className="text-lg text-nevoa">
              {pendentes} aguardando{emAtendimento > 0 && `, ${emAtendimento} em atendimento`}
            </p>
          )}
        </div>

        {carregado && ordenados.length === 0 && <Vazio />}

        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
          {ordenados.map((c) => (
            <CardChamado
              key={c.id}
              chamado={c}
              agora={agora}
              novo={destacados.has(c.id)}
              aoAtender={() => atender(c)}
              aoConcluir={() => concluir(c)}
            />
          ))}
        </ul>
      </main>

      {aviso && (
        <div
          key={aviso.id}
          role="status"
          className={`fixed inset-x-4 bottom-5 z-30 mx-auto flex max-w-lg items-center justify-between gap-4 rounded-2xl px-5 py-4 shadow-2xl ${
            aviso.erro ? "bg-alerta text-white" : "bg-white text-tinta"
          }`}
        >
          <span className="font-semibold">{aviso.texto}</span>
          {aviso.desfazer && (
            <button
              type="button"
              onClick={aviso.desfazer}
              className="shrink-0 rounded-lg bg-tinta px-3 py-1.5 text-sm font-bold text-white"
            >
              Desfazer
            </button>
          )}
        </div>
      )}

      {!turnoIniciado && <TelaInicioTurno aoIniciar={iniciarTurno} pendentes={pendentes} />}
    </div>
  );
}

function CardChamado(props: {
  chamado: Chamado;
  agora: number | null;
  novo: boolean;
  aoAtender: () => void;
  aoConcluir: () => void;
}) {
  const { chamado, agora, novo, aoAtender, aoConcluir } = props;
  const garcom = chamado.tipo === "garcom";
  const pendente = chamado.status === "pendente";
  const atrasado = pendente && agora !== null && minutosDesde(chamado.created_at, agora) >= ALERTA_MINUTOS;
  const Icone = garcom ? ConciergeBell : Receipt;

  // Pendente: card cheio de cor, para ser visto de longe.
  // Em atendimento: card apagado, com a cor só na borda.
  const estilo = pendente
    ? garcom
      ? "bg-garcom text-white"
      : "bg-conta text-tinta"
    : `bg-tinta-2 text-white border-4 ${garcom ? "border-garcom" : "border-conta"}`;

  const botaoSecundario = pendente
    ? garcom
      ? "bg-white/15 hover:bg-white/25"
      : "bg-tinta/10 hover:bg-tinta/20"
    : "";
  const botaoPrincipal = pendente
    ? garcom
      ? "bg-white text-garcom-escuro hover:bg-garcom-claro"
      : "bg-tinta text-white hover:bg-tinta-2"
    : "bg-white text-tinta hover:bg-linha";

  return (
    <li
      className={`flex flex-col rounded-3xl p-5 ${estilo} ${novo ? "animate-chegada" : ""} ${
        atrasado ? "animate-pulso-alerta outline-4 outline-offset-2 outline-alerta" : ""
      }`}
      aria-label={`Mesa ${chamado.mesa_numero}: ${NOME_TIPO[chamado.tipo]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-lg font-bold">
          <Icone className="size-6" strokeWidth={2.4} aria-hidden />
          {garcom ? "Chamar garçom" : "Pedir a conta"}
        </span>
        {novo && (
          <span className="rounded-full bg-white px-2.5 py-0.5 text-sm font-bold text-tinta">Novo</span>
        )}
      </div>

      <div className="my-5 flex items-end gap-3">
        <span className="largo pb-1.5 text-xl font-bold opacity-80">Mesa</span>
        <span
          className={`numeral ${porDigitos(chamado.mesa_numero, ["text-[6.5rem]", "text-[4.75rem]", "text-[3.6rem]"])}`}
        >
          {chamado.mesa_numero}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
        <span
          className={`flex items-center gap-1.5 font-semibold ${
            atrasado ? "rounded-full bg-alerta px-2.5 py-0.5 text-white" : ""
          }`}
        >
          <Clock className="size-4" strokeWidth={2.5} aria-hidden />
          {tempoDecorrido(chamado.created_at, agora) || horaCurta(chamado.created_at)}
        </span>
        {!pendente && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
              garcom ? "bg-garcom text-white" : "bg-conta text-tinta"
            }`}
          >
            Em atendimento
          </span>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        {pendente && (
          <button
            type="button"
            onClick={aoAtender}
            className={`flex-1 rounded-xl px-3 py-3 font-bold ${botaoSecundario}`}
          >
            Atender
          </button>
        )}
        <button
          type="button"
          onClick={aoConcluir}
          title="Marcar como atendido"
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 font-bold ${botaoPrincipal}`}
        >
          <CheckCheck className="size-5" strokeWidth={2.5} aria-hidden />
          Concluir
        </button>
      </div>
    </li>
  );
}

function StatusConexao({ conectado }: { conectado: boolean }) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-nevoa" role="status">
      <span className={`size-2.5 rounded-full ${conectado ? "bg-[#3ddc97]" : "animate-pulse bg-alerta"}`} />
      {conectado ? "Ao vivo" : "Reconectando…"}
    </span>
  );
}

function ControleVolume(props: {
  volume: number;
  mudo: boolean;
  aoMudarVolume: (v: number) => void;
  aoAlternarMudo: () => void;
  aoTestar: () => void;
}) {
  const { volume, mudo, aoMudarVolume, aoAlternarMudo, aoTestar } = props;
  const Icone = mudo || volume === 0 ? VolumeX : Volume2;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-tinta-2 py-1 pr-1 pl-2">
      <button
        type="button"
        onClick={aoAlternarMudo}
        aria-label={mudo ? "Ligar o som" : "Silenciar"}
        aria-pressed={mudo}
        className="rounded-lg p-1.5 text-nevoa hover:text-white"
      >
        <Icone className="size-5" aria-hidden />
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={mudo ? 0 : volume}
        onChange={(e) => aoMudarVolume(Number(e.target.value))}
        aria-label="Volume da campainha"
        className="w-28 accent-conta"
      />
      <span className="w-10 text-right text-sm text-nevoa tabular-nums">{mudo ? 0 : volume}%</span>
      <button
        type="button"
        onClick={aoTestar}
        className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-tinta-3"
      >
        Testar
      </button>
    </div>
  );
}

function Vazio() {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-tinta-3 px-6 py-20 text-center">
      <CheckCheck className="size-12 text-[#3ddc97]" aria-hidden />
      <p className="largo mt-4 text-2xl font-bold">Nenhuma mesa esperando</p>
      <p className="mt-2 max-w-sm text-nevoa">
        Quando um cliente chamar, o card da mesa aparece aqui com a campainha.
      </p>
    </div>
  );
}

function TelaInicioTurno({ aoIniciar, pendentes }: { aoIniciar: () => void; pendentes: number }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-tinta/95 px-6 backdrop-blur-sm">
      <div className="max-w-md text-center">
        <BellRing className="mx-auto size-14 text-conta" aria-hidden />
        <h2 className="largo mt-6 text-3xl font-bold">Iniciar turno</h2>
        <p className="mt-3 text-lg text-nevoa">
          O navegador só deixa tocar a campainha depois de um clique. Clique no botão para ativar o som e começar a
          receber os chamados.
        </p>
        {pendentes > 0 && (
          <p className="mt-3 font-semibold text-conta">
            {pendentes === 1 ? "1 mesa já está esperando." : `${pendentes} mesas já estão esperando.`}
          </p>
        )}
        <button
          type="button"
          onClick={aoIniciar}
          autoFocus
          className="largo mt-8 w-full rounded-2xl bg-conta px-6 py-5 text-xl font-bold text-tinta shadow-[0_6px_0_var(--color-conta-escuro)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-conta-escuro)]"
        >
          Ativar som e iniciar turno
        </button>
      </div>
    </div>
  );
}
