import { connection, type NextRequest } from "next/server";
import { modoDemo } from "@/lib/config";
import { eventosDemo } from "@/lib/store/memoria";
import type { Chamado } from "@/lib/tipos";

/**
 * GET /api/demo/eventos
 * Só existe no MODO DEMONSTRAÇÃO: envia as mudanças de chamados em tempo real
 * (Server-Sent Events). Com o Supabase configurado, quem faz isso é o Supabase Realtime.
 */
export async function GET(request: NextRequest) {
  await connection();
  if (!modoDemo()) return new Response("Indisponível fora do modo demonstração", { status: 404 });

  const mesa = Number(request.nextUrl.searchParams.get("mesa")) || null;
  const eventos = eventosDemo();
  const codificador = new TextEncoder();

  let encerrar = () => {};
  const fluxo = new ReadableStream<Uint8Array>({
    start(controle) {
      const enviar = (texto: string) => {
        try {
          controle.enqueue(codificador.encode(texto));
        } catch {
          encerrar();
        }
      };
      const aoMudar = (chamado: Chamado) => {
        if (mesa && chamado.mesa_numero !== mesa) return;
        enviar(`data: ${JSON.stringify(chamado)}\n\n`);
      };
      const pulso = setInterval(() => enviar(": pulso\n\n"), 20_000);

      encerrar = () => {
        clearInterval(pulso);
        eventos.off("chamado", aoMudar);
        try {
          controle.close();
        } catch {}
      };

      eventos.on("chamado", aoMudar);
      request.signal.addEventListener("abort", () => encerrar());
      enviar("retry: 3000\n: conectado\n\n");
    },
    cancel() {
      encerrar();
    },
  });

  return new Response(fluxo, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
