import { Nfc, QrCode } from "lucide-react";
import { Logo } from "@/components/logo";
import { LOGO } from "@/lib/marca";
import { porDigitos } from "@/lib/tipos";

export interface DadosPlaquinha {
  numero: number;
  url: string;
  svg: string;
}

/**
 * Uma plaquinha de mesa. Todas as medidas usam unidades do próprio cartão
 * (cqw), então o mesmo desenho serve para 1, 2 ou 4 plaquinhas por folha.
 */
export function Plaquinha({
  dados,
  restaurante,
  guias,
}: {
  dados: DadosPlaquinha;
  restaurante: string;
  guias: boolean;
}) {
  return (
    <article
      className={`relative overflow-hidden [container-type:size] ${guias ? "outline-[0.3mm] outline-[#c3ccd1] outline-dashed" : ""}`}
    >
      <div className="flex h-full flex-col px-[9cqw] pt-[8cqw] pb-[7cqw]">
        <div className="flex items-start justify-between gap-[3cqw]">
          <span className="largo pt-[1cqw] text-[6cqw] leading-none font-bold">Mesa</span>
          <Logo fundo="claro" altura="12cqw" alt={restaurante || LOGO.nome} className="-mt-[1cqw]" />
        </div>
        <p
          className={`numeral -ml-[0.8cqw] ${porDigitos(dados.numero, ["text-[33cqw]", "text-[25cqw]", "text-[19cqw]"])}`}
        >
          {dados.numero}
        </p>

        <div
          className="mt-auto aspect-square w-[56cqw] [&>svg]:block [&>svg]:size-full"
          role="img"
          aria-label={`QR Code da Mesa ${dados.numero}`}
          dangerouslySetInnerHTML={{ __html: dados.svg }}
        />

        <div className="mt-[6cqw] flex items-start gap-[3cqw]">
          <span className="flex shrink-0 gap-[1cqw] rounded-[2cqw] bg-conta px-[1.8cqw] py-[1.4cqw] [print-color-adjust:exact]">
            <Nfc className="size-[5.2cqw]" strokeWidth={2.4} aria-hidden />
            <QrCode className="size-[5.2cqw]" strokeWidth={2.4} aria-hidden />
          </span>
          <div>
            <p className="text-[4.9cqw] leading-[1.15] font-bold">Aproxime o celular ou escaneie o código</p>
            <p className="mt-[1.4cqw] text-[3.5cqw] leading-snug text-cinza">
              Para ver o cardápio, chamar o garçom ou pedir a conta.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
