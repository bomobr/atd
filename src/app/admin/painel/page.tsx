import { Suspense } from "react";
import { exigirAdminPagina } from "@/lib/auth";
import { configTempoReal, modoDemo } from "@/lib/config";
import { Painel } from "./painel";

export const metadata = { title: "Painel" };

export default function PaginaPainel() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-tinta" aria-busy="true" />}>
      <ConteudoPainel />
    </Suspense>
  );
}

async function ConteudoPainel() {
  await exigirAdminPagina();
  return <Painel tempoReal={configTempoReal()} modoDemo={modoDemo()} />;
}
