import "server-only";
import { configSupabase } from "../config";
import { criarStoreMemoria } from "./memoria";
import { criarStoreSupabase } from "./supabase";
import type { Store } from "./tipos";

export { ErroConflito } from "./tipos";

let cache: { chave: string; store: Store } | null = null;

/** Devolve o banco em uso: Supabase, se configurado; senão, o modo demonstração. */
export function getStore(): Store {
  const cfg = configSupabase();
  const chave = cfg ? `${cfg.url}|${cfg.chaveSecreta}` : "demo";
  if (cache?.chave !== chave) {
    cache = { chave, store: cfg ? criarStoreSupabase(cfg.url, cfg.chaveSecreta) : criarStoreMemoria() };
  }
  return cache.store;
}
