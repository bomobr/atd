import "server-only";
import type { ConfigTempoReal } from "./tipos";

/**
 * Lê as variáveis de ambiente. Sem Supabase configurado, o sistema roda em
 * "modo demonstração": tudo fica na memória do servidor (some ao reiniciar)
 * e serve só para testar no próprio computador.
 */
function env(...nomes: string[]): string | undefined {
  for (const nome of nomes) {
    const valor = process.env[nome]?.trim();
    if (valor) return valor;
  }
  return undefined;
}

export function configSupabase() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const chavePublica = env("NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const chaveSecreta = env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");

  if (!url) return null;

  const faltando = [
    !chavePublica && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    !chaveSecreta && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);
  if (faltando.length) {
    throw new Error(
      `Supabase configurado pela metade: defina ${faltando.join(" e ")} no arquivo .env.local (ou nas variáveis da hospedagem).`,
    );
  }
  return { url, chavePublica: chavePublica!, chaveSecreta: chaveSecreta! };
}

export function modoDemo(): boolean {
  return configSupabase() === null;
}

export function configTempoReal(): ConfigTempoReal {
  const cfg = configSupabase();
  return cfg ? { modo: "supabase", url: cfg.url, chavePublica: cfg.chavePublica } : { modo: "demo" };
}

export function nomeRestaurante(): string {
  return env("NOME_RESTAURANTE") ?? "";
}

/** true quando o painel está usando a senha "admin" do modo demonstração. */
export function usandoSenhaDemo(): boolean {
  return !env("ADMIN_PASSWORD") && modoDemo();
}

/** Senha do painel. No modo demonstração, se nada for definido, a senha é "admin". */
export function senhaAdmin(): string | null {
  return env("ADMIN_PASSWORD") ?? (modoDemo() ? "admin" : null);
}

export function segredoSessao(): string {
  const senha = senhaAdmin() ?? "";
  // Trocar a senha invalida todas as sessões abertas.
  return `${senha}|${env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY") ?? "demo"}|chamados-v1`;
}

/** Endereço público fixo, se definido (ex.: https://chamados.meurestaurante.com.br). */
export function siteUrlFixa(): string | null {
  const url = env("SITE_URL", "NEXT_PUBLIC_SITE_URL");
  if (!url) return null;
  const comProtocolo = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return comProtocolo.replace(/\/+$/, "");
}
