import { Suspense } from "react";
import { exigirAdminPagina } from "@/lib/auth";
import { modoDemo } from "@/lib/config";
import { getStore } from "@/lib/store";
import { urlBase } from "@/lib/url";
import { MesasAdmin } from "./mesas-admin";

export const metadata = { title: "Mesas e QR Codes" };

export default function PaginaMesas() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-tinta" aria-busy="true" />}>
      <ConteudoMesas />
    </Suspense>
  );
}

async function ConteudoMesas() {
  await exigirAdminPagina();
  const [mesas, base] = await Promise.all([getStore().listarMesas(), urlBase()]);
  return <MesasAdmin mesasIniciais={mesas} urlBase={base} modoDemo={modoDemo()} />;
}
