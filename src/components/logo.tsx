import { LOGO } from "@/lib/marca";

/** Logo do restaurante. `fundo` diz onde ela aparece, para escolher a versão que contrasta. */
export function Logo({
  fundo,
  altura,
  className = "",
  alt = LOGO.nome,
}: {
  fundo: "claro" | "escuro";
  altura: number | string;
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fundo === "escuro" ? LOGO.clara : LOGO.escura}
      alt={alt}
      width={LOGO.largura}
      height={LOGO.altura}
      decoding="async"
      className={`block w-auto max-w-full select-none ${className}`}
      style={{ height: altura }}
      draggable={false}
    />
  );
}
