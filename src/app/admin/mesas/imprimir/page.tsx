import { Suspense } from "react";
import QRCode from "qrcode";
import { exigirAdminPagina } from "@/lib/auth";
import { nomeRestaurante } from "@/lib/config";
import { getStore } from "@/lib/store";
import { urlBase, urlMesa } from "@/lib/url";
import { BarraImpressao } from "./barra-impressao";
import { Plaquinha, type DadosPlaquinha } from "./plaquinha";

export const metadata = { title: "Imprimir plaquinhas" };

type PorFolha = 1 | 2 | 4;

export default function PaginaImprimir({ searchParams }: PageProps<"/admin/mesas/imprimir">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#dfe5e8]" aria-busy="true" />}>
      <ConteudoImpressao searchParams={searchParams} />
    </Suspense>
  );
}

async function ConteudoImpressao({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await exigirAdminPagina();
  const sp = await searchParams;
  const valor = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? "";

  const porFolha: PorFolha = valor("por") === "1" ? 1 : valor("por") === "2" ? 2 : 4;
  const filtro = valor("mesas")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  const [todas, base] = await Promise.all([getStore().listarMesas(), urlBase()]);
  const mesas = filtro.length ? todas.filter((m) => filtro.includes(m.numero)) : todas.filter((m) => m.ativa);

  const placas: DadosPlaquinha[] = await Promise.all(
    mesas.map(async (m) => {
      const url = urlMesa(base, m.numero);
      const svg = await QRCode.toString(url, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
        color: { dark: "#14232e", light: "#ffffff" },
      });
      return { numero: m.numero, url, svg };
    }),
  );

  const folhas: DadosPlaquinha[][] = [];
  for (let i = 0; i < placas.length; i += porFolha) folhas.push(placas.slice(i, i + porFolha));

  const paisagem = porFolha === 2;
  const restaurante = nomeRestaurante();

  return (
    <div className="min-h-dvh bg-[#dfe5e8] text-tinta print:bg-white">
      <style>{`
        @page { size: A4 ${paisagem ? "landscape" : "portrait"}; margin: 0; }
        @media print { html, body { background: #fff !important; } }
      `}</style>

      <BarraImpressao porFolha={porFolha} filtro={filtro.join(",")} total={placas.length} />

      {placas.length === 0 ? (
        <p className="mx-auto max-w-md px-6 py-24 text-center text-lg">
          Nenhuma mesa ativa para imprimir. Cadastre ou ative mesas na tela Mesas e QR Codes.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-8 py-8 print:block print:gap-0 print:py-0">
          {folhas.map((folha, i) => (
            <section
              key={i}
              className="grid shrink-0 bg-white shadow-xl print:shadow-none [break-after:page] last:[break-after:auto]"
              style={{
                width: paisagem ? "297mm" : "210mm",
                height: paisagem ? "210mm" : "297mm",
                gridTemplateColumns: porFolha === 1 ? "1fr" : "1fr 1fr",
                gridTemplateRows: porFolha === 4 ? "1fr 1fr" : "1fr",
              }}
            >
              {folha.map((p) => (
                <Plaquinha key={p.numero} dados={p} restaurante={restaurante} guias={porFolha > 1} />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
