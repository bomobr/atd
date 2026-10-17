import "server-only";
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type { Chamado, Mesa } from "../tipos";
import { ErroConflito, type Store } from "./tipos";

/**
 * Banco em memória para o MODO DEMONSTRAÇÃO.
 * Os dados somem quando o servidor reinicia. Use o Supabase em produção.
 */
interface Estado {
  mesas: Mesa[];
  chamados: Chamado[];
  eventos: EventEmitter;
}

const global_ = globalThis as typeof globalThis & { __chamadosDemo?: Estado };

function estado(): Estado {
  if (!global_.__chamadosDemo) {
    const agora = new Date().toISOString();
    const eventos = new EventEmitter();
    eventos.setMaxListeners(0);
    global_.__chamadosDemo = {
      mesas: Array.from({ length: 6 }, (_, i) => ({
        id: randomUUID(),
        numero: i + 1,
        ativa: true,
        created_at: agora,
      })),
      chamados: [],
      eventos,
    };
  }
  return global_.__chamadosDemo;
}

export function eventosDemo(): EventEmitter {
  return estado().eventos;
}

const copia = <T,>(v: T): T => structuredClone(v);
const recentes = (a: { created_at: string }, b: { created_at: string }) =>
  b.created_at.localeCompare(a.created_at);

export function criarStoreMemoria(): Store {
  const s = estado();

  function emitir(chamado: Chamado) {
    s.eventos.emit("chamado", copia(chamado));
  }

  return {
    async listarMesas() {
      return copia([...s.mesas].sort((a, b) => a.numero - b.numero));
    },
    async buscarMesa(numero) {
      return copia(s.mesas.find((m) => m.numero === numero) ?? null);
    },
    async criarMesas(numeros) {
      let criadas = 0;
      for (const numero of new Set(numeros)) {
        if (s.mesas.some((m) => m.numero === numero)) continue;
        s.mesas.push({ id: randomUUID(), numero, ativa: true, created_at: new Date().toISOString() });
        criadas++;
      }
      return criadas;
    },
    async atualizarMesa(id, dados) {
      const mesa = s.mesas.find((m) => m.id === id);
      if (!mesa) return null;
      if (dados.numero !== undefined && s.mesas.some((m) => m.numero === dados.numero && m.id !== id)) {
        throw new ErroConflito();
      }
      Object.assign(mesa, dados);
      return copia(mesa);
    },
    async removerMesa(id) {
      const antes = s.mesas.length;
      s.mesas = s.mesas.filter((m) => m.id !== id);
      return s.mesas.length < antes;
    },

    async listarChamadosAbertos() {
      return copia(s.chamados.filter((c) => c.status !== "atendido").sort(recentes));
    },
    async buscarChamados(mesa, ids) {
      return copia(s.chamados.filter((c) => c.mesa_numero === mesa && ids.includes(c.id)));
    },
    async chamadoAberto(mesa, tipo) {
      const lista = s.chamados
        .filter((c) => c.mesa_numero === mesa && c.tipo === tipo && c.status !== "atendido")
        .sort(recentes);
      return copia(lista[0] ?? null);
    },
    async ultimoChamado(mesa, tipo) {
      const lista = s.chamados.filter((c) => c.mesa_numero === mesa && c.tipo === tipo).sort(recentes);
      return copia(lista[0] ?? null);
    },
    async criarChamado(mesa, tipo) {
      if (s.chamados.some((c) => c.mesa_numero === mesa && c.tipo === tipo && c.status !== "atendido")) {
        throw new ErroConflito();
      }
      const chamado: Chamado = {
        id: randomUUID(),
        mesa_numero: mesa,
        tipo,
        status: "pendente",
        created_at: new Date().toISOString(),
        atendido_em: null,
      };
      s.chamados.push(chamado);
      // Mantém só os últimos 500 para não crescer sem limite
      if (s.chamados.length > 500) s.chamados.splice(0, s.chamados.length - 500);
      emitir(chamado);
      return copia(chamado);
    },
    async atualizarStatus(id, status) {
      const chamado = s.chamados.find((c) => c.id === id);
      if (!chamado) return null;
      if (
        status !== "atendido" &&
        s.chamados.some(
          (c) =>
            c.id !== id &&
            c.mesa_numero === chamado.mesa_numero &&
            c.tipo === chamado.tipo &&
            c.status !== "atendido",
        )
      ) {
        throw new ErroConflito();
      }
      chamado.status = status;
      chamado.atendido_em = status === "atendido" ? new Date().toISOString() : null;
      emitir(chamado);
      return copia(chamado);
    },
  };
}
