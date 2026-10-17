import { Suspense, cache } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { BarraChamar } from "@/components/cardapio/barra-chamar";
import { PaginaCardapio } from "@/components/cardapio/pagina-cardapio";
import { configTempoReal } from "@/lib/config";
import { getStore } from "@/lib/store";
import { numeroMesaValido } from "@/lib/tipos";

export const metadata = { title: "Cardápio" };

/** Busca a mesa uma vez por acesso, mesmo sendo usada em dois lugares da página. */
const mesaDaRota = cache(async (numero: string) => {
  await connection();
  const n = numeroMesaValido(numero);
  return n ? getStore().buscarMesa(n) : null;
});

/**
 * O cardápio em si é fixo e já vem pronto do servidor. Só o link de volta para a
 * mesa e a barra de chamar o garçom dependem da mesa, e chegam logo em seguida.
 */
export default function CardapioDaMesa({ params }: PageProps<"/mesa/[numero]/cardapio">) {
  return (
    <PaginaCardapio
      voltar={
        <Suspense fallback={null}>
          <VoltarParaMesa params={params} />
        </Suspense>
      }
      barra={
        <Suspense fallback={null}>
          <BarraDaMesa params={params} />
        </Suspense>
      }
    />
  );
}

async function VoltarParaMesa({ params }: { params: Promise<{ numero: string }> }) {
  const mesa = await mesaDaRota((await params).numero);
  if (!mesa) return null;
  return (
    <Link
      href={`/mesa/${mesa.numero}`}
      className="flex shrink-0 items-center gap-2 rounded-full bg-tinta-2 px-4 py-2.5 font-semibold text-white ring-1 ring-tinta-3 hover:bg-tinta-3"
    >
      <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
      Mesa {mesa.numero}
    </Link>
  );
}

async function BarraDaMesa({ params }: { params: Promise<{ numero: string }> }) {
  const mesa = await mesaDaRota((await params).numero);
  if (!mesa?.ativa) return null;
  return <BarraChamar numero={mesa.numero} tempoReal={configTempoReal()} />;
}
