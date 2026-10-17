"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Chamado, ConfigTempoReal } from "./tipos";

let cliente: { chave: string; db: SupabaseClient } | null = null;

function supabase(url: string, chavePublica: string): SupabaseClient {
  const chave = `${url}|${chavePublica}`;
  if (cliente?.chave !== chave) {
    cliente = {
      chave,
      db: createClient(url, chavePublica, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    };
  }
  return cliente.db;
}

interface Opcoes {
  /** Ouvir só uma mesa (tela do cliente). Sem isso, ouve todas (painel). */
  mesa?: number;
  aoMudar: (chamado: Chamado) => void;
  /** true quando a conexão é (re)estabelecida — bom momento para sincronizar. */
  aoConectar: (conectado: boolean) => void;
}

/** Ouve as mudanças na tabela de chamados. Devolve a função que encerra a escuta. */
export function ouvirChamados(config: ConfigTempoReal, { mesa, aoMudar, aoConectar }: Opcoes): () => void {
  if (config.modo === "demo") {
    const fonte = new EventSource(`/api/demo/eventos${mesa ? `?mesa=${mesa}` : ""}`);
    fonte.onopen = () => aoConectar(true);
    fonte.onerror = () => aoConectar(false);
    fonte.onmessage = (e) => {
      try {
        aoMudar(JSON.parse(e.data) as Chamado);
      } catch {}
    };
    return () => fonte.close();
  }

  const db = supabase(config.url, config.chavePublica);
  const canal = db
    .channel(`chamados-${mesa ?? "todos"}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chamados",
        ...(mesa ? { filter: `mesa_numero=eq.${mesa}` } : {}),
      },
      (payload) => {
        const novo = payload.new as Partial<Chamado> | undefined;
        if (novo?.id) aoMudar(novo as Chamado);
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") aoConectar(true);
      else aoConectar(false);
    });

  return () => {
    db.removeChannel(canal);
  };
}
