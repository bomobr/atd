"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ouvirChamados } from "./tempo-real";
import { gravarLocal, lerLocal } from "./tempo";
import {
  COOLDOWN_SEGUNDOS,
  type Chamado,
  type ConfigTempoReal,
  type StatusChamado,
  type TipoChamado,
} from "./tipos";

export type AvisoMesa = { tom: "ok" | "info" | "erro"; texto: string };

interface Salvo {
  ids: string[];
  bloqueadoAte: number;
}

/** Chamados atendidos continuam visíveis por este tempo. */
const MOSTRAR_ATENDIDOS_MIN = 15;

function mesclar(lista: Chamado[], chamado: Chamado): Chamado[] {
  const sem = lista.filter((c) => c.id !== chamado.id);
  return [chamado, ...sem].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function vibrar(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}

/**
 * Tudo o que o celular do cliente precisa para chamar o garçom ou pedir a conta:
 * envio, bloqueio de 45 s, status em tempo real e mensagens.
 *
 * Usado pela tela da mesa e pela barra do cardápio. Os dois leem e gravam o mesmo
 * registro no aparelho, então chamar pelo cardápio também bloqueia os botões da mesa.
 */
export function useChamadosMesa(numero: number, tempoReal: ConfigTempoReal) {
  const chave = `chamados:mesa:${numero}`;
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [bloqueadoAte, setBloqueadoAte] = useState(0);
  const [agora, setAgora] = useState(0);
  const [enviando, setEnviando] = useState<TipoChamado | null>(null);
  const [aviso, setAviso] = useState<AvisoMesa | null>(null);
  const idsRef = useRef<string[]>([]);
  const statusRef = useRef<Map<string, StatusChamado>>(new Map());

  const salvar = useCallback(
    (dados: Partial<Salvo>) => {
      const atual = lerLocal<Salvo>(chave, { ids: [], bloqueadoAte: 0 });
      gravarLocal(chave, { ...atual, ...dados });
    },
    [chave],
  );

  const aplicar = useCallback((chamado: Chamado) => {
    const anterior = statusRef.current.get(chamado.id);
    statusRef.current.set(chamado.id, chamado.status);
    if (anterior && anterior !== chamado.status && chamado.status !== "pendente") vibrar([40, 60, 40]);
    setChamados((lista) => mesclar(lista, chamado));
  }, []);

  /** Busca no servidor o status atualizado dos chamados deste celular. */
  const sincronizar = useCallback(async () => {
    const ids = idsRef.current;
    if (!ids.length) {
      setChamados([]);
      return;
    }
    try {
      const resposta = await fetch(`/api/chamados?mesa=${numero}&ids=${ids.join(",")}`, { cache: "no-store" });
      if (!resposta.ok) return;
      const { chamados: lista, agora: agoraServidor } = (await resposta.json()) as {
        chamados: Chamado[];
        agora: string;
      };
      const limite = Date.parse(agoraServidor) - MOSTRAR_ATENDIDOS_MIN * 60_000;
      const visiveis = lista.filter(
        (c) => c.status !== "atendido" || Date.parse(c.atendido_em ?? c.created_at) > limite,
      );
      visiveis.forEach((c) => statusRef.current.set(c.id, c.status));
      setChamados(visiveis.sort((a, b) => b.created_at.localeCompare(a.created_at)));
      idsRef.current = visiveis.map((c) => c.id);
      salvar({ ids: idsRef.current });
    } catch {
      // Sem internet no momento: tenta de novo na próxima reconexão
    }
  }, [numero, salvar]);

  // Recupera o que este celular já pediu. Também roda ao voltar de outra tela
  // (ex.: do cardápio para a mesa), para pegar um chamado feito por lá.
  useEffect(() => {
    const salvo = lerLocal<Salvo>(chave, { ids: [], bloqueadoAte: 0 });
    idsRef.current = Array.isArray(salvo.ids) ? salvo.ids.slice(0, 20) : [];
    setBloqueadoAte(Number(salvo.bloqueadoAte) || 0);
    sincronizar();
  }, [chave, sincronizar]);

  // Tempo real: atualiza o status assim que o painel mudar
  useEffect(
    () =>
      ouvirChamados(tempoReal, {
        mesa: numero,
        aoMudar: (c) => {
          if (idsRef.current.includes(c.id)) aplicar(c);
        },
        aoConectar: (conectado) => {
          if (conectado) sincronizar();
        },
      }),
    [tempoReal, numero, aplicar, sincronizar],
  );

  // Celulares pausam abas em segundo plano: ao voltar, sincroniza
  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === "visible") sincronizar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("online", aoVoltar);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("online", aoVoltar);
    };
  }, [sincronizar]);

  // Contagem regressiva do bloqueio anti-spam
  useEffect(() => {
    setAgora(Date.now());
    if (bloqueadoAte <= Date.now()) return;
    const timer = setInterval(() => {
      const n = Date.now();
      setAgora(n);
      if (n >= bloqueadoAte) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [bloqueadoAte]);

  // Mensagens de sucesso somem sozinhas
  useEffect(() => {
    if (!aviso || aviso.tom === "erro") return;
    const timer = setTimeout(() => setAviso(null), 10_000);
    return () => clearTimeout(timer);
  }, [aviso]);

  const restante = agora ? Math.max(0, Math.ceil((bloqueadoAte - agora) / 1000)) : 0;
  const bloqueado = restante > 0 || enviando !== null;

  function bloquear(segundos: number) {
    const ate = Date.now() + segundos * 1000;
    setBloqueadoAte(ate);
    salvar({ bloqueadoAte: ate });
  }

  async function chamar(tipo: TipoChamado) {
    if (bloqueado) return;
    setEnviando(tipo);
    setAviso(null);
    try {
      const resposta = await fetch("/api/chamados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesa: numero, tipo }),
      });
      const dados = await resposta.json().catch(() => ({}));

      if (resposta.ok && dados.chamado) {
        const chamado = dados.chamado as Chamado;
        idsRef.current = [chamado.id, ...idsRef.current.filter((id) => id !== chamado.id)].slice(0, 20);
        salvar({ ids: idsRef.current });
        aplicar(chamado);
        bloquear(COOLDOWN_SEGUNDOS);
        vibrar(30);
        setAviso(
          dados.jaExistia
            ? { tom: "info", texto: "Seu chamado já está na fila. Aguarde um instante." }
            : { tom: "ok", texto: "Chamado enviado! Aguarde um instante." },
        );
      } else if (resposta.status === 429) {
        bloquear(Number(dados.segundos) || COOLDOWN_SEGUNDOS);
        setAviso({ tom: "info", texto: "Esse pedido acabou de ser atendido. Aguarde alguns segundos para chamar de novo." });
      } else if (resposta.status === 404) {
        setAviso({ tom: "erro", texto: "Esta mesa não está recebendo chamados agora. Acene para um garçom." });
      } else {
        throw new Error(String(resposta.status));
      }
    } catch {
      setAviso({ tom: "erro", texto: "O chamado não foi enviado. Confira a internet do celular e toque de novo." });
    } finally {
      setEnviando(null);
    }
  }

  return { chamados, restante, bloqueado, enviando, aviso, chamar };
}
