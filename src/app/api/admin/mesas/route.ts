import { connection, type NextRequest } from "next/server";
import { bloquearSeNaoAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { numeroMesaValido } from "@/lib/tipos";

const MAX_POR_VEZ = 200;

/** GET /api/admin/mesas — todas as mesas, em ordem de número. */
export async function GET() {
  await connection();
  const bloqueio = await bloquearSeNaoAdmin();
  if (bloqueio) return bloqueio;
  return Response.json({ mesas: await getStore().listarMesas() }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/admin/mesas
 *   { numero: 12 }        cria uma mesa
 *   { de: 1, ate: 10 }    cria as mesas de 1 a 10 (ignora as que já existem)
 */
export async function POST(request: NextRequest) {
  const bloqueio = await bloquearSeNaoAdmin();
  if (bloqueio) return bloqueio;

  const corpo = await request.json().catch(() => null);
  let numeros: number[] = [];

  if (corpo?.numero !== undefined) {
    const n = numeroMesaValido(corpo.numero);
    if (!n) return Response.json({ erro: "numero_invalido" }, { status: 400 });
    numeros = [n];
  } else {
    const de = numeroMesaValido(corpo?.de);
    const ate = numeroMesaValido(corpo?.ate);
    if (!de || !ate || ate < de) return Response.json({ erro: "intervalo_invalido" }, { status: 400 });
    if (ate - de + 1 > MAX_POR_VEZ) {
      return Response.json({ erro: "intervalo_grande", maximo: MAX_POR_VEZ }, { status: 400 });
    }
    numeros = Array.from({ length: ate - de + 1 }, (_, i) => de + i);
  }

  const store = getStore();
  const criadas = await store.criarMesas(numeros);
  return Response.json({ criadas, mesas: await store.listarMesas() }, { status: 201 });
}
