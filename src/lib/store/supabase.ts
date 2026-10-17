import "server-only";
import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import type { Chamado, Mesa, StatusChamado, TipoChamado } from "../tipos";
import { ErroConflito, type Store } from "./tipos";

function verificar(error: PostgrestError | null) {
  if (!error) return;
  if (error.code === "23505") throw new ErroConflito(error.message);
  throw new Error(`Erro no banco de dados: ${error.message}`);
}

export function criarStoreSupabase(url: string, chaveSecreta: string): Store {
  const db: SupabaseClient = createClient(url, chaveSecreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async listarMesas() {
      const { data, error } = await db.from("mesas").select("*").order("numero");
      verificar(error);
      return (data ?? []) as Mesa[];
    },

    async buscarMesa(numero) {
      const { data, error } = await db.from("mesas").select("*").eq("numero", numero).maybeSingle();
      verificar(error);
      return data as Mesa | null;
    },

    async criarMesas(numeros) {
      if (!numeros.length) return 0;
      const { data, error } = await db
        .from("mesas")
        .upsert(
          numeros.map((numero) => ({ numero })),
          { onConflict: "numero", ignoreDuplicates: true },
        )
        .select("id");
      verificar(error);
      return data?.length ?? 0;
    },

    async atualizarMesa(id, dados) {
      const { data, error } = await db.from("mesas").update(dados).eq("id", id).select().maybeSingle();
      verificar(error);
      return data as Mesa | null;
    },

    async removerMesa(id) {
      const { data, error } = await db.from("mesas").delete().eq("id", id).select("id");
      verificar(error);
      return (data?.length ?? 0) > 0;
    },

    async listarChamadosAbertos() {
      const { data, error } = await db
        .from("chamados")
        .select("*")
        .neq("status", "atendido")
        .order("created_at", { ascending: false })
        .limit(300);
      verificar(error);
      return (data ?? []) as Chamado[];
    },

    async buscarChamados(mesa, ids) {
      if (!ids.length) return [];
      const { data, error } = await db.from("chamados").select("*").eq("mesa_numero", mesa).in("id", ids);
      verificar(error);
      return (data ?? []) as Chamado[];
    },

    async chamadoAberto(mesa: number, tipo: TipoChamado) {
      const { data, error } = await db
        .from("chamados")
        .select("*")
        .eq("mesa_numero", mesa)
        .eq("tipo", tipo)
        .neq("status", "atendido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      verificar(error);
      return data as Chamado | null;
    },

    async ultimoChamado(mesa: number, tipo: TipoChamado) {
      const { data, error } = await db
        .from("chamados")
        .select("*")
        .eq("mesa_numero", mesa)
        .eq("tipo", tipo)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      verificar(error);
      return data as Chamado | null;
    },

    async criarChamado(mesa, tipo) {
      const { data, error } = await db
        .from("chamados")
        .insert({ mesa_numero: mesa, tipo })
        .select()
        .single();
      verificar(error);
      return data as Chamado;
    },

    async atualizarStatus(id: string, status: StatusChamado) {
      const { data, error } = await db
        .from("chamados")
        .update({ status, atendido_em: status === "atendido" ? new Date().toISOString() : null })
        .eq("id", id)
        .select()
        .maybeSingle();
      verificar(error);
      return data as Chamado | null;
    },
  };
}
