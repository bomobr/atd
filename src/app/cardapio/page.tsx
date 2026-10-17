import { PaginaCardapio } from "@/components/cardapio/pagina-cardapio";

export const metadata = { title: "Cardápio" };

/** Cardápio aberto, sem mesa (para divulgar em redes sociais, por exemplo). */
export default function Cardapio() {
  return <PaginaCardapio />;
}
