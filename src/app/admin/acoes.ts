"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSAO, DURACAO_SESSAO_DIAS, gerarTokenSessao, senhaConfere } from "@/lib/auth";
import { senhaAdmin } from "@/lib/config";

export type EstadoLogin = { erro?: string };

export async function entrar(_anterior: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  if (!senhaAdmin()) {
    return { erro: "Defina a variável ADMIN_PASSWORD na hospedagem para liberar o painel." };
  }

  const senha = String(form.get("senha") ?? "");
  if (!senhaConfere(senha)) {
    await new Promise((r) => setTimeout(r, 700)); // freia tentativas em sequência
    return { erro: "Senha incorreta. Confira e tente de novo." };
  }

  const cabecalhos = await headers();
  const https = (cabecalhos.get("x-forwarded-proto") ?? "").split(",")[0].trim() === "https";

  (await cookies()).set(COOKIE_SESSAO, gerarTokenSessao(), {
    httpOnly: true,
    sameSite: "lax",
    secure: https,
    path: "/",
    maxAge: DURACAO_SESSAO_DIAS * 24 * 60 * 60,
  });

  redirect("/admin/painel");
}

export async function sair() {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect("/admin/login");
}
