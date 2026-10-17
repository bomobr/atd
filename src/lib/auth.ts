import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { segredoSessao, senhaAdmin } from "./config";

export const COOKIE_SESSAO = "painel_sessao";
export const DURACAO_SESSAO_DIAS = 30;

function assinar(valor: string): string {
  return createHmac("sha256", segredoSessao()).update(valor).digest("base64url");
}

function iguais(a: string, b: string): boolean {
  // Compara os hashes para não vazar o tamanho e evitar ataques de tempo
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function gerarTokenSessao(): string {
  const expira = Date.now() + DURACAO_SESSAO_DIAS * 24 * 60 * 60 * 1000;
  return `${expira}.${assinar(String(expira))}`;
}

export function tokenValido(token: string | undefined): boolean {
  if (!token || !senhaAdmin()) return false;
  const [expira, assinatura] = token.split(".");
  if (!expira || !assinatura || !/^\d+$/.test(expira)) return false;
  if (Number(expira) < Date.now()) return false;
  return iguais(assinatura, assinar(expira));
}

export function senhaConfere(tentativa: string): boolean {
  const senha = senhaAdmin();
  if (!senha) return false;
  return iguais(tentativa, senha);
}

export async function estaLogado(): Promise<boolean> {
  await connection(); // a sessão é sempre conferida na hora do acesso, nunca pré-renderizada
  const loja = await cookies();
  return tokenValido(loja.get(COOKIE_SESSAO)?.value);
}

/** Para páginas do painel: manda para o login quem não estiver autenticado. */
export async function exigirAdminPagina(): Promise<void> {
  if (!(await estaLogado())) redirect("/admin/login");
}

/** Para rotas de API do painel: devolve uma resposta 401 se não estiver autenticado. */
export async function bloquearSeNaoAdmin(): Promise<Response | null> {
  if (await estaLogado()) return null;
  return Response.json({ erro: "nao_autenticado" }, { status: 401 });
}
