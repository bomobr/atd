import type { NextRequest } from "next/server";
import { bloquearSeNaoAdmin } from "@/lib/auth";
import { ErroConflito, getStore } from "@/lib/store";
import { STATUS, uuidValido, type StatusChamado } from "@/lib/tipos";

/** PATCH /api/admin/chamados/:id  { status: "em_atendimento" | "atendido" | "pendente" } */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/chamados/[id]">) {
  const bloqueio = await bloquearSeNaoAdmin();
  if (bloqueio) return bloqueio;

  const { id } = await ctx.params;
  const corpo = await request.json().catch(() => null);
  const status = corpo?.status as StatusChamado;

  if (!uuidValido(id) || !STATUS.includes(status)) {
    return Response.json({ erro: "pedido_invalido" }, { status: 400 });
  }

  try {
    const chamado = await getStore().atualizarStatus(id, status);
    if (!chamado) return Response.json({ erro: "nao_encontrado" }, { status: 404 });
    return Response.json({ chamado });
  } catch (erro) {
    // Ao desfazer: a mesa já abriu outro chamado do mesmo tipo
    if (erro instanceof ErroConflito) {
      return Response.json({ erro: "ja_existe_chamado_aberto" }, { status: 409 });
    }
    throw erro;
  }
}
