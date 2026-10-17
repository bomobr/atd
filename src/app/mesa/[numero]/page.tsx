import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { BookOpen } from "lucide-react";
import { Logo } from "@/components/logo";
import { configTempoReal, nomeRestaurante } from "@/lib/config";
import { getStore } from "@/lib/store";
import { numeroMesaValido } from "@/lib/tipos";
import { MesaCliente } from "./mesa-cliente";

export const metadata = { title: "Sua mesa" };

export default function PaginaMesa({ params }: PageProps<"/mesa/[numero]">) {
  return (
    <Suspense fallback={<Carregando />}>
      <ConteudoMesa params={params} />
    </Suspense>
  );
}

async function ConteudoMesa({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  await connection(); // dados sempre frescos, consultados a cada acesso
  const n = numeroMesaValido(numero);
  const mesa = n ? await getStore().buscarMesa(n) : null;

  if (!mesa || !mesa.ativa) return <MesaIndisponivel numero={numero} existe={!!mesa} />;

  return <MesaCliente numero={mesa.numero} tempoReal={configTempoReal()} restaurante={nomeRestaurante()} />;
}

function Carregando() {
  return (
    <main className="min-h-dvh bg-papel" aria-busy="true">
      <div className="h-80 bg-tinta px-6 pt-8">
        <div className="mx-auto max-w-md">
          <Logo fundo="escuro" altura={52} />
        </div>
      </div>
      <div className="mx-auto max-w-md space-y-4 px-5 pt-6">
        <div className="h-28 animate-pulse rounded-3xl bg-linha" />
        <div className="h-28 animate-pulse rounded-3xl bg-linha" />
      </div>
    </main>
  );
}

function MesaIndisponivel({ numero, existe }: { numero: string; existe: boolean }) {
  return (
    <main className="flex min-h-dvh flex-col justify-center bg-tinta px-6 text-white">
      <div className="mx-auto w-full max-w-md">
        <Logo fundo="escuro" altura={52} className="mb-10" />
        <p className="text-lg text-nevoa">Mesa {numero.slice(0, 6)}</p>
        <h1 className="largo mt-2 text-3xl leading-tight font-bold">
          {existe ? "Esta mesa não está recebendo chamados agora." : "Não encontramos esta mesa."}
        </h1>
        <p className="mt-4 text-lg text-nevoa">
          Acene para um garçom que ele vem até você. Se o código da plaquinha estiver danificado, avise a equipe.
        </p>
        <Link
          href="/cardapio"
          className="largo mt-8 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-lg font-bold text-tinta"
        >
          <BookOpen className="size-6" strokeWidth={2.2} aria-hidden />
          Ver cardápio
        </Link>
      </div>
    </main>
  );
}
