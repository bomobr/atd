import type { NextRequest } from "next/server";
import { bloquearSeNaoAdmin } from "@/lib/auth";
import { ErroConflito, getStore } from "@/lib/store";
import { numeroMesaValido, uuidValido } from "@/lib/tipos";

/** PATCH /api/admin/mesas/:id  { numero?: 8, ativa?: false } */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/mesas/[id]">) {
  const bloqueio = await bloquearSeNaoAdmin();
  if (bloqueio) return bloqueio;

  const { id } = await ctx.params;
  if (!uuidValido(id)) return Response.json({ erro: "pedido_invalido" }, { status: 400 });

  const corpo = await request.json().catch(() => null);
  const dados: { numero?: number; ativa?: boolean } = {};

  if (corpo?.numero !== undefined) {
    const n = numeroMesaValido(corpo.numero);
    if (!n) return Response.json({ erro: "numero_invalido" }, { status: 400 });
    dados.numero = n;
  }
  if (typeof corpo?.ativa === "boolean") dados.ativa = corpo.ativa;
  if (!Object.keys(dados).length) return Response.json({ erro: "pedido_invalido" }, { status: 400 });

  try {
    const mesa = await getStore().atualizarMesa(id, dados);
    if (!mesa) return Response.json({ erro: "nao_encontrada" }, { status: 404 });
    return Response.json({ mesa });
  } catch (erro) {
    if (erro instanceof ErroConflito) return Response.json({ erro: "numero_em_uso" }, { status: 409 });
    throw erro;
  }
}

/** DELETE /api/admin/mesas/:id */
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/mesas/[id]">) {
  const bloqueio = await bloquearSeNaoAdmin();
  if (bloqueio) return bloqueio;

  const { id } = await ctx.params;
  if (!uuidValido(id)) return Response.json({ erro: "pedido_invalido" }, { status: 400 });

  const removida = await getStore().removerMesa(id);
  return removida ? Response.json({ ok: true }) : Response.json({ erro: "nao_encontrada" }, { status: 404 });
}
