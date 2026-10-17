"use client";

import { useEffect, useRef, useState } from "react";

interface Categoria {
  id: string;
  nome: string;
}

/**
 * Faixa fixa no topo com as categorias do cardápio. Toque para pular até a seção;
 * ao rolar a página, a categoria visível fica marcada.
 */
export function NavCategorias({ categorias }: { categorias: Categoria[] }) {
  const [ativa, setAtiva] = useState(categorias[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  // Marca a categoria cuja seção está logo abaixo da faixa
  useEffect(() => {
    let quadro = 0;
    const atualizar = () => {
      quadro = 0;
      const limite = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 24;
      const noFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let atual = categorias[0]?.id ?? "";
      for (const c of categorias) {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= limite) atual = c.id;
      }
      if (noFim && window.scrollY > 0) atual = categorias[categorias.length - 1]?.id ?? atual;
      setAtiva(atual);
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    };
    atualizar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, [categorias]);

  // Mantém a categoria marcada visível na faixa (que rola para os lados)
  useEffect(() => {
    const lista = listaRef.current;
    const item = lista?.querySelector<HTMLElement>(`[data-id="${ativa}"]`);
    if (!lista || !item) return;
    const posicao = item.getBoundingClientRect().left - lista.getBoundingClientRect().left + lista.scrollLeft;
    const alvo = posicao - lista.clientWidth / 2 + item.clientWidth / 2;
    lista.scrollTo({ left: Math.max(0, alvo), behavior: suave() });
  }, [ativa]);

  function irPara(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const secao = document.getElementById(id);
    if (!secao) return;
    e.preventDefault();
    setAtiva(id);
    secao.scrollIntoView({ behavior: suave(), block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <nav
      ref={navRef}
      aria-label="Categorias do cardápio"
      className="sticky top-0 z-10 border-b border-linha bg-papel"
    >
      {/* Largura e recuo calculados para o texto da 1ª categoria alinhar com o conteúdo */}
      <ul
        ref={listaRef}
        className="mx-auto flex max-w-[44.5rem] gap-1 overflow-x-auto px-1 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categorias.map((c) => {
          const marcada = c.id === ativa;
          return (
            <li key={c.id} data-id={c.id} className="shrink-0">
              <a
                href={`#${c.id}`}
                onClick={(e) => irPara(e, c.id)}
                aria-current={marcada ? "true" : undefined}
                className={`block rounded-full px-4 py-2 font-semibold whitespace-nowrap transition-colors ${
                  marcada ? "bg-tinta text-white" : "text-cinza hover:text-tinta"
                }`}
              >
                {c.nome}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function suave(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
