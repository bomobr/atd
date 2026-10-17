import type { NextRequest } from "next/server";
import { ErroConflito, getStore } from "@/lib/store";
import { COOLDOWN_SEGUNDOS, TIPOS, numeroMesaValido, uuidValido, type TipoChamado } from "@/lib/tipos";

/**
 * POST /api/chamados  { mesa: 5, tipo: "garcom" | "conta" }
 * Cria um chamado. Rota pública (é usada pelo celular do cliente).
 */
export async function POST(request: NextRequest) {
  const corpo = await request.json().catch(() => null);
  const mesa = numeroMesaValido(corpo?.mesa);
  const tipo = corpo?.tipo as TipoChamado;

  if (!mesa || !TIPOS.includes(tipo)) {
    return Response.json({ erro: "pedido_invalido" }, { status: 400 });
  }

  const store = getStore();
  const registro = await store.buscarMesa(mesa);
  if (!registro || !registro.ativa) {
    return Response.json({ erro: "mesa_indisponivel" }, { status: 404 });
  }

  // Já existe um chamado igual em aberto? Reaproveita em vez de duplicar.
  const aberto = await store.chamadoAberto(mesa, tipo);
  if (aberto) return Response.json({ chamado: aberto, jaExistia: true });

  // Anti-spam: o mesmo pedido acabou de ser atendido há menos de 45 s
  const ultimo = await store.ultimoChamado(mesa, tipo);
  if (ultimo) {
    const passados = (Date.now() - Date.parse(ultimo.created_at)) / 1000;
    if (passados < COOLDOWN_SEGUNDOS) {
      const segundos = Math.ceil(COOLDOWN_SEGUNDOS - passados);
      return Response.json(
        { erro: "aguarde", segundos },
        { status: 429, headers: { "Retry-After": String(segundos) } },
      );
    }
  }

  try {
    const chamado = await store.criarChamado(mesa, tipo);
    return Response.json({ chamado, jaExistia: false }, { status: 201 });
  } catch (erro) {
    // Dois toques ao mesmo tempo: o banco barrou o duplicado
    if (erro instanceof ErroConflito) {
      const existente = await store.chamadoAberto(mesa, tipo);
      if (existente) return Response.json({ chamado: existente, jaExistia: true });
    }
    throw erro;
  }
}

/**
 * GET /api/chamados?mesa=5&ids=uuid1,uuid2
 * Devolve o status dos chamados que o próprio celular criou.
 */
export async function GET(request: NextRequest) {
  const mesa = numeroMesaValido(request.nextUrl.searchParams.get("mesa"));
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(uuidValido).slice(0, 20);

  if (!mesa) return Response.json({ erro: "pedido_invalido" }, { status: 400 });

  const chamados = await getStore().buscarChamados(mesa, ids);
  return Response.json(
    { chamados, agora: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
