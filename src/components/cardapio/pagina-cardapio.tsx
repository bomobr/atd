import { Flame, Leaf, Users, Vegan, WheatOff, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { CARDAPIO, type CategoriaCardapio, type ItemCardapio, type Selo } from "@/data/cardapio";
import { NavCategorias } from "./nav-categorias";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const SELOS: Record<Selo, { rotulo: string; Icone: LucideIcon; cor: string }> = {
  vegetariano: { rotulo: "Vegetariano", Icone: Leaf, cor: "text-garcom-escuro" },
  vegano: { rotulo: "Vegano", Icone: Vegan, cor: "text-garcom-escuro" },
  "sem-gluten": { rotulo: "Sem glúten", Icone: WheatOff, cor: "text-tinta-3" },
  picante: { rotulo: "Picante", Icone: Flame, cor: "text-[#b8321c]" },
};

/**
 * Cardápio completo. `voltar` e `barra` só existem quando o cliente veio de uma mesa:
 * o link de volta para a mesa e a barra fixa para chamar o garçom.
 */
export function PaginaCardapio({ voltar, barra }: { voltar?: React.ReactNode; barra?: React.ReactNode }) {
  const { categorias, observacao } = CARDAPIO;

  return (
    <main className="min-h-dvh bg-papel text-tinta">
      <header className="bg-tinta px-5 pt-6 pb-8 text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <Logo fundo="escuro" altura={40} />
          {voltar}
        </div>
        <h1 className="largo mx-auto mt-10 max-w-2xl text-5xl font-bold">Cardápio</h1>
      </header>

      <NavCategorias categorias={categorias.map(({ id, nome }) => ({ id, nome }))} />

      <div className="px-5 pb-12">
        <div className="mx-auto max-w-2xl">
          {categorias.map((c) => (
            <Secao key={c.id} categoria={c} />
          ))}

          {observacao && (
            <p className="mt-10 border-t border-linha pt-6 leading-relaxed text-cinza">{observacao}</p>
          )}
        </div>
      </div>

      {barra}
    </main>
  );
}

function Secao({ categoria }: { categoria: CategoriaCardapio }) {
  const titulo = `${categoria.id}-titulo`;
  return (
    <section id={categoria.id} aria-labelledby={titulo} className="scroll-mt-16 pt-9">
      <h2 id={titulo} className="largo text-3xl font-bold">
        {categoria.nome}
      </h2>
      {categoria.descricao && <p className="mt-1 text-cinza">{categoria.descricao}</p>}
      <ul className="mt-2 divide-y divide-linha">
        {categoria.itens.map((item) => (
          <Item key={item.nome} item={item} />
        ))}
      </ul>
    </section>
  );
}

function Item({ item }: { item: ItemCardapio }) {
  const esgotado = !!item.esgotado;
  const temDetalhes = item.destaque || item.serve || item.selos?.length;

  return (
    <li className="flex gap-4 py-5">
      {item.foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.foto}
          alt=""
          loading="lazy"
          decoding="async"
          className={`size-24 shrink-0 rounded-2xl object-cover ${esgotado ? "grayscale" : ""}`}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className={`text-lg leading-snug font-bold ${esgotado ? "text-cinza" : ""}`}>{item.nome}</h3>
          {esgotado ? (
            <span className="shrink-0 rounded-full bg-linha px-2.5 py-0.5 text-sm font-bold">Esgotado</span>
          ) : (
            item.preco !== undefined && (
              <span className="shrink-0 text-lg font-bold whitespace-nowrap tabular-nums">{moeda.format(item.preco)}</span>
            )
          )}
        </div>

        {item.descricao && <p className="mt-1 leading-snug text-cinza">{item.descricao}</p>}

        {item.opcoes && (
          <ul className={`mt-2.5 space-y-1.5 ${esgotado ? "text-cinza" : ""}`}>
            {item.opcoes.map((o) => (
              <li key={o.nome} className="flex items-baseline gap-2">
                <span>{o.nome}</span>
                <span className="flex-1 border-b-2 border-dotted border-linha" aria-hidden />
                <span className="font-bold whitespace-nowrap tabular-nums">{moeda.format(o.preco)}</span>
              </li>
            ))}
          </ul>
        )}

        {temDetalhes ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold">
            {item.destaque && (
              <span className="rounded-full bg-conta px-2.5 py-0.5 font-bold text-tinta">Mais pedido</span>
            )}
            {item.serve && (
              <span className="flex items-center gap-1.5 text-tinta-3">
                <Users className="size-4" aria-hidden />
                Serve {item.serve} {item.serve === 1 ? "pessoa" : "pessoas"}
              </span>
            )}
            {item.selos?.map((s) => {
              const { rotulo, Icone, cor } = SELOS[s];
              return (
                <span key={s} className={`flex items-center gap-1.5 ${cor}`}>
                  <Icone className="size-4" aria-hidden />
                  {rotulo}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </li>
  );
}
