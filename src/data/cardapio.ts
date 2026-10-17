/**
 * CARDÁPIO
 * ------------------------------------------------------------------
 * Este é um cardápio de EXEMPLO. Troque pelos pratos do seu restaurante.
 *
 * Como editar:
 *  - Cada categoria tem um `id` (sem espaços nem acentos), um `nome` e os `itens`.
 *  - Cada item precisa de `nome` e de `preco` (em reais, com ponto: 34.9)
 *    OU de `opcoes` (quando há tamanhos/sabores com preços diferentes).
 *  - Opcionais em cada item:
 *      descricao   texto curto abaixo do nome
 *      selos       ["vegetariano", "vegano", "sem-gluten", "picante"]
 *      destaque    true  → mostra "Mais pedido"
 *      serve       2     → mostra "Serve 2 pessoas"
 *      esgotado    true  → aparece apagado, com "Esgotado" no lugar do preço
 *      foto        "/cardapio/burger.webp" (coloque a imagem em public/cardapio/)
 *
 * Depois de salvar, publique de novo o site para o cardápio atualizar.
 */

export type Selo = "vegetariano" | "vegano" | "sem-gluten" | "picante";

export interface OpcaoItem {
  nome: string;
  preco: number;
}

interface ItemBase {
  nome: string;
  descricao?: string;
  selos?: Selo[];
  destaque?: boolean;
  serve?: number;
  esgotado?: boolean;
  foto?: string;
}

export type ItemCardapio = ItemBase & ({ preco: number; opcoes?: never } | { opcoes: OpcaoItem[]; preco?: never });

export interface CategoriaCardapio {
  id: string;
  nome: string;
  descricao?: string;
  itens: ItemCardapio[];
}

export interface Cardapio {
  categorias: CategoriaCardapio[];
  /** Aviso no fim do cardápio (taxa de serviço, alergias etc.). */
  observacao?: string;
}

export const CARDAPIO: Cardapio = {
  categorias: [
    {
      id: "entradas",
      nome: "Para começar",
      descricao: "Porções para dividir com a mesa.",
      itens: [
        {
          nome: "Pastéis de feira",
          descricao: "6 unidades. Escolha entre carne, queijo ou palmito. Com molho de pimenta da casa.",
          preco: 34,
          destaque: true,
        },
        {
          nome: "Dadinhos de tapioca",
          descricao: "Tapioca com queijo coalho, crocante por fora, com geleia de pimenta.",
          preco: 31,
          selos: ["vegetariano", "sem-gluten", "picante"],
        },
        {
          nome: "Bolinhos de arroz",
          descricao: "8 unidades, com aioli de limão-siciliano.",
          preco: 29,
          selos: ["vegetariano"],
        },
        {
          nome: "Mandioca frita",
          descricao: "Com maionese de alho e alecrim.",
          preco: 26,
          selos: ["vegetariano", "sem-gluten"],
        },
        {
          nome: "Carpaccio de abobrinha",
          descricao: "Lâminas de abobrinha, rúcula, lascas de parmesão e azeite de ervas.",
          preco: 32,
          selos: ["vegetariano", "sem-gluten"],
        },
      ],
    },
    {
      id: "pratos",
      nome: "Pratos principais",
      itens: [
        {
          nome: "Picanha na chapa",
          descricao: "600 g de picanha com arroz, farofa de bacon, vinagrete e mandioca cozida.",
          preco: 128,
          serve: 2,
          destaque: true,
        },
        {
          nome: "Moqueca de peixe",
          descricao: "Peixe do dia no leite de coco e azeite de dendê, com arroz branco e pirão.",
          preco: 89,
          selos: ["sem-gluten"],
        },
        {
          nome: "Risoto de cogumelos",
          descricao: "Arroz arbóreo com shiitake, cogumelo-de-paris, parmesão e manteiga de sálvia.",
          preco: 62,
          selos: ["vegetariano", "sem-gluten"],
        },
        {
          nome: "Escondidinho de carne seca",
          descricao: "Purê de mandioca gratinado com carne seca desfiada e queijo coalho.",
          preco: 54,
          selos: ["sem-gluten"],
        },
        {
          nome: "Parmegiana de berinjela",
          descricao: "Berinjela empanada com molho de tomate e muçarela, com espaguete ao sugo.",
          preco: 52,
          selos: ["vegetariano"],
        },
        {
          nome: "Frango grelhado",
          descricao: "Sobrecoxa marinada em ervas, purê de batata-doce e legumes na manteiga.",
          preco: 48,
          selos: ["sem-gluten"],
        },
        {
          nome: "Bowl de grãos com tofu",
          descricao: "Arroz integral, grão-de-bico, legumes assados, tofu grelhado e molho tahine.",
          preco: 46,
          selos: ["vegano"],
        },
      ],
    },
    {
      id: "sanduiches",
      nome: "Sanduíches",
      descricao: "Todos acompanham batata frita.",
      itens: [
        {
          nome: "Burger da casa",
          descricao: "Blend de 180 g, queijo prato, cebola caramelizada e maionese defumada no pão brioche.",
          preco: 44,
          destaque: true,
        },
        {
          nome: "Smash duplo",
          descricao: "Dois smash de 90 g, cheddar, picles e molho especial.",
          preco: 39,
        },
        {
          nome: "Sanduíche de cogumelos",
          descricao: "Portobello grelhado, queijo minas, rúcula e pesto de manjericão no pão de fermentação natural.",
          preco: 38,
          selos: ["vegetariano"],
        },
        {
          nome: "Bauru",
          descricao: "Rosbife, muçarela derretida, tomate e picles no pão francês.",
          preco: 36,
        },
      ],
    },
    {
      id: "sobremesas",
      nome: "Sobremesas",
      itens: [
        {
          nome: "Pudim de leite",
          descricao: "Receita da família, com calda de caramelo.",
          preco: 18,
          selos: ["vegetariano", "sem-gluten"],
          destaque: true,
        },
        {
          nome: "Petit gâteau",
          descricao: "Bolinho de chocolate com recheio cremoso e sorvete de creme.",
          preco: 28,
          selos: ["vegetariano"],
        },
        {
          nome: "Brownie com doce de leite",
          descricao: "Servido morno, com calda de doce de leite e castanha-do-pará.",
          preco: 24,
          selos: ["vegetariano"],
        },
        {
          nome: "Romeu e Julieta",
          descricao: "Queijo minas frescal com goiabada cascão.",
          preco: 19,
          selos: ["vegetariano", "sem-gluten"],
        },
        {
          nome: "Salada de frutas",
          descricao: "Frutas da estação com hortelã.",
          preco: 16,
          selos: ["vegano", "sem-gluten"],
        },
      ],
    },
    {
      id: "bebidas",
      nome: "Bebidas",
      itens: [
        {
          nome: "Suco natural",
          descricao: "Laranja, abacaxi com hortelã ou maracujá.",
          opcoes: [
            { nome: "Copo de 300 ml", preco: 12 },
            { nome: "Jarra de 1 litro", preco: 28 },
          ],
          selos: ["vegano"],
        },
        {
          nome: "Limonada suíça",
          descricao: "Limão batido com casca e leite condensado.",
          preco: 14,
          selos: ["vegetariano"],
        },
        {
          nome: "Chá gelado de hibisco",
          descricao: "Feito na casa, com laranja e canela.",
          preco: 11,
          selos: ["vegano"],
          esgotado: true,
        },
        {
          nome: "Refrigerante",
          descricao: "Lata de 350 ml.",
          preco: 8,
        },
        {
          nome: "Água mineral",
          descricao: "Com ou sem gás, 500 ml.",
          preco: 6,
        },
      ],
    },
    {
      id: "cervejas-drinks",
      nome: "Cervejas e drinks",
      descricao: "Venda proibida para menores de 18 anos.",
      itens: [
        {
          nome: "Chope pilsen",
          opcoes: [
            { nome: "Tulipa de 300 ml", preco: 13 },
            { nome: "Caneca de 500 ml", preco: 19 },
          ],
        },
        {
          nome: "Cerveja artesanal",
          descricao: "Pergunte ao garçom os rótulos do dia. Garrafa de 500 ml.",
          preco: 32,
        },
        {
          nome: "Caipirinha",
          descricao: "Cachaça, limão, maracujá ou morango.",
          preco: 26,
          destaque: true,
        },
        {
          nome: "Gin tônica",
          descricao: "Com zimbro, pimenta-rosa e casca de limão-siciliano.",
          preco: 32,
        },
        {
          nome: "Vinho da casa",
          descricao: "Tinto ou branco.",
          opcoes: [
            { nome: "Taça", preco: 29 },
            { nome: "Garrafa", preco: 119 },
          ],
        },
      ],
    },
    {
      id: "cafes",
      nome: "Cafés",
      itens: [
        { nome: "Espresso", preco: 7 },
        { nome: "Cappuccino", descricao: "Espresso, leite vaporizado e canela.", preco: 13 },
        { nome: "Café coado", descricao: "Grãos especiais coados na hora, 200 ml.", preco: 11 },
        { nome: "Café com leite vegetal", descricao: "Com bebida de aveia.", preco: 14, selos: ["vegano"] },
      ],
    },
  ],
  observacao:
    "Preços em reais. A taxa de serviço de 10% é opcional e não está incluída. Tem alergia ou restrição alimentar? Avise o garçom antes de pedir.",
};
