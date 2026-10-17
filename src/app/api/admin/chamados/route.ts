import { connection } from "next/server";
import { bloquearSeNaoAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";

/** GET /api/admin/chamados — chamados em aberto, mais recentes primeiro. */
export async function GET() {
  await connection();
  const bloqueio = await bloquearSeNaoAdmin();
  if (bloqueio) return bloqueio;

  const chamados = await getStore().listarChamadosAbertos();
  return Response.json(
    { chamados, agora: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
