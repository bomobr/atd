# Chamados por QR Code e NFC

Sistema para o cliente **ver o cardápio**, **chamar o garçom** ou **pedir a conta** pelo celular, lendo o QR Code ou aproximando o celular da tag NFC da mesa. No computador do restaurante, um painel mostra os chamados em tempo real com uma campainha suave.

| Tela | Endereço | Quem usa |
| --- | --- | --- |
| Mesa do cliente | `/mesa/7` | Cliente, pelo QR Code ou NFC |
| Cardápio da mesa | `/mesa/7/cardapio` | Cliente (botão **Ver cardápio**) |
| Cardápio aberto | `/cardapio` | Qualquer pessoa (para divulgar em redes sociais) |
| Painel de chamados | `/admin/painel` | Recepção / caixa |
| Mesas e QR Codes | `/admin/mesas` | Gerente |
| Plaquinhas para imprimir | `/admin/mesas/imprimir` | Gerente |

Feito com Next.js 16, Tailwind CSS 4 e Supabase (banco PostgreSQL + Realtime).

---

## 1. Testar agora no seu computador (5 minutos)

Precisa do [Node.js](https://nodejs.org) 20.9 ou mais novo.

```bash
npm install
npm run dev
```

Abra:

- **Painel:** http://localhost:3000/admin (senha: `admin`). Clique em **Ativar som e iniciar turno**.
- **Cliente:** http://localhost:3000/mesa/1 em outra janela, ou no celular (veja abaixo).

Sem o Supabase configurado, o sistema roda em **modo demonstração**: já vem com as mesas 1 a 6, tudo fica na memória e some quando o servidor reinicia. Uma faixa amarela no painel avisa disso.

**Testar no celular, no mesmo Wi-Fi:** o modo de desenvolvimento bloqueia acessos que não vêm do próprio computador, então rode a versão de produção:

```bash
npm run build
npm start
```

Descubra o IP do computador (Windows: `ipconfig`; Mac: Ajustes > Wi-Fi > Detalhes) e abra no celular `http://SEU-IP:3000/mesa/1`. Para gerar QR Codes que funcionem assim, abra o painel também por esse endereço (`http://SEU-IP:3000/admin`).

---

## 2. Colocar no ar para o restaurante

São três etapas: criar o banco no Supabase, publicar o site na Vercel e cadastrar as mesas. Os planos gratuitos dos dois atendem bem um restaurante.

### 2.1 Banco de dados (Supabase)

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com). Escolha a região **South America (São Paulo)**.
2. No menu do projeto, abra **SQL Editor**, clique em **New query**, cole todo o conteúdo do arquivo [`sql/schema.sql`](sql/schema.sql) e clique em **Run**. Isso cria as tabelas, as regras de segurança e liga o tempo real.
3. Em **Project Settings > API Keys**, anote:
   - o endereço do projeto (`https://xxxx.supabase.co`);
   - a chave pública (**Publishable key**, ou a antiga **anon**);
   - a chave secreta (**Secret key**, ou a antiga **service_role**). Ela dá acesso total ao banco: nunca coloque em lugar público.

### 2.2 Site (Vercel)

1. Suba esta pasta para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), clique em **Add New > Project** e importe o repositório.
3. Antes de publicar, em **Environment Variables**, cadastre:

| Variável | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Endereço do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta |
| `ADMIN_PASSWORD` | A senha do painel (escolha uma forte) |
| `SITE_URL` | Opcional, recomendado: o endereço final, ex. `https://chamados-cantina.vercel.app` |
| `NOME_RESTAURANTE` | Opcional: usado como texto alternativo da logo (leitores de tela) |

4. Clique em **Deploy**. Se mudar alguma variável depois, faça um novo deploy (**Deployments > Redeploy**).

> Para rodar no seu computador já ligado ao Supabase, copie `.env.example` para `.env.local` e preencha as mesmas variáveis.

### 2.3 Mesas, plaquinhas e tags NFC

1. Abra `https://SEU-SITE/admin`, entre com a senha e vá em **Mesas e QR Codes**.
2. Crie as mesas (ex.: de 1 até 15) ou adicione números avulsos (101, 102…).
3. Confira o endereço mostrado no quadro do topo: é ele que vai dentro dos QR Codes. Se aparecer um aviso vermelho de `localhost`, os códigos não vão funcionar no celular dos clientes.
4. Clique em **Imprimir plaquinhas**. Escolha 4, 2 ou 1 por folha A4, e na janela de impressão use margens **Nenhuma** e escala **100%**. Também dá para imprimir uma mesa só ou baixar o QR Code em PNG para mandar a uma gráfica.
5. **Tags NFC** (opcional): compre tags NTAG213 ou NTAG215 (adesivo ou cartão). Instale um app gravador, como o **NFC Tools** (Android e iPhone), escolha *Escrever > Adicionar registro > URL*, cole o link da mesa (botão **Copiar** no card da mesa) e aproxime a tag. Cole a tag atrás da plaquinha.

Antes de abrir o salão, teste cada plaquinha com o seu celular.

---

## 3. Usando no dia a dia

**Painel (`/admin/painel`)**

- Toda vez que abrir o painel, clique em **Ativar som e iniciar turno**. Os navegadores só deixam tocar som depois de um clique; esse botão também pede para a tela não apagar.
- Cada chamado vira um card com a mesa em destaque, em verde (garçom) ou amarelo (conta), mais recentes primeiro.
- **Atender**: avisa o cliente que alguém está indo (o celular dele mostra *Em atendimento*). O card fica escuro, com a borda colorida.
- **Concluir**: tira o card do painel e mostra *Atendido* para o cliente. Clicou sem querer? Use **Desfazer** no aviso que aparece embaixo.
- Um chamado esperando há **3 minutos ou mais** ganha contorno vermelho piscando.
- O volume da campainha começa em 30% e fica salvo no computador. **Testar** toca a campainha. Garçom toca duas notas descendo; conta, duas subindo.
- A bolinha verde **Ao vivo** indica a conexão em tempo real. Se a internet cair, ela fica vermelha, o sistema reconecta sozinho e busca o que chegou nesse intervalo. Por segurança, a lista também é conferida a cada 30 segundos.
- A campainha só toca com a tela **Chamados** aberta. Se for mexer nas mesas durante o expediente, abra **Mesas e QR Codes** em outra aba.

**Celular do cliente (`/mesa/7`)**

- Sem login nem cadastro. Dois botões grandes: **Chamar garçom** e **Pedir a conta**.
- Depois de tocar, aparece *"Chamado enviado! Aguarde um instante."* e os dois botões ficam bloqueados por 45 segundos (o bloqueio continua mesmo se a página for recarregada).
- Abaixo dos botões o cliente acompanha o status: *Aguardando atendimento*, *Em atendimento* e *Atendido*.

**Cardápio**

- O botão **Ver cardápio** abre a lista de pratos e bebidas, com uma faixa de categorias no topo (toque para pular até a seção).
- Na parte de baixo fica sempre o botão **Chamar garçom**, para o cliente pedir sem voltar para a tela da mesa. O bloqueio de 45 segundos vale para as duas telas.
- Mesa desativada ou inexistente: o cardápio aparece, mas sem o botão de chamar.

**Proteções contra chamado duplicado**

- Cada mesa tem no máximo **um chamado em aberto por tipo**. Se o cliente tocar de novo antes de ser atendido, o sistema reaproveita o chamado que já está no painel (regra garantida pelo próprio banco).
- O servidor recusa um novo chamado igual da mesma mesa em menos de 45 segundos, mesmo vindo de outro celular.
- Mesas desativadas ou inexistentes mostram um aviso e não geram chamados.

---

## 4. Segurança

- O navegador recebe só a chave **pública** do Supabase, que serve apenas para ouvir as mudanças em tempo real. Ela não grava nada e não lê a tabela de mesas.
- Toda gravação passa pelo servidor do site, que valida o pedido e usa a chave secreta.
- A chave pública consegue ler os chamados das últimas 12 horas (mesa, tipo, status e horário), o que é necessário para o tempo real. Não há dados pessoais nessa tabela.
- O painel usa uma sessão assinada em cookie que vale 30 dias. Trocar `ADMIN_PASSWORD` desconecta todo mundo.

---

## 5. Editar o cardápio

O sistema vem com um **cardápio de exemplo**. Para colocar o seu, edite o arquivo [`src/data/cardapio.ts`](src/data/cardapio.ts) e publique de novo (na Vercel, basta enviar a mudança para o GitHub).

Cada prato é um bloco assim:

```ts
{
  nome: "Moqueca de peixe",
  descricao: "Peixe do dia no leite de coco, com arroz e pirão.",
  preco: 89,                      // em reais; centavos com ponto: 89.9
  selos: ["sem-gluten"],          // "vegetariano", "vegano", "sem-gluten", "picante"
  destaque: true,                 // mostra "Mais pedido"
  serve: 2,                       // mostra "Serve 2 pessoas"
  esgotado: true,                 // aparece apagado, com "Esgotado"
  foto: "/cardapio/moqueca.webp", // imagem colocada em public/cardapio/
},
```

Só `nome` e `preco` são obrigatórios. Quando o item tem tamanhos ou versões com preços diferentes, troque `preco` por `opcoes`:

```ts
{
  nome: "Chope pilsen",
  opcoes: [
    { nome: "Tulipa de 300 ml", preco: 13 },
    { nome: "Caneca de 500 ml", preco: 19 },
  ],
},
```

Para criar uma categoria, copie um bloco de categoria inteiro e troque o `id` (sem espaços nem acentos, ex.: `porcoes`) e o `nome`. A ordem no arquivo é a ordem na tela. O texto do fim do cardápio (taxa de serviço, alergias) fica em `observacao`, no final do arquivo.

O `npm run build` confere o arquivo: se faltar um preço ou houver um erro de digitação na estrutura, ele aponta a linha.

---

## 6. Ajustes comuns

| O que mudar | Onde |
| --- | --- |
| Logo | `public/logo.webp` (escura, usada nas plaquinhas e no PNG) e `public/logo-clara.webp` (clara, usada nas telas de fundo escuro). Se a nova logo tiver outra proporção, ajuste `src/lib/marca.ts` |
| Tempo de bloqueio (45 s) e alerta de atraso (3 min) | `src/lib/tipos.ts` |
| Textos dos status | `src/lib/tipos.ts` |
| Cores | `src/app/globals.css` (bloco `@theme`) |
| Som da campainha | `src/lib/som.ts` |
| Layout da plaquinha | `src/app/admin/mesas/imprimir/plaquinha.tsx` |

**Apagar histórico antigo** (os chamados atendidos ficam guardados). No SQL Editor do Supabase:

```sql
delete from public.chamados
where status = 'atendido' and created_at < now() - interval '90 days';
```

---

## 7. Estrutura

```
sql/schema.sql                      Tabelas, índices, segurança e tempo real
src/data/cardapio.ts                Cardápio (pratos, preços, categorias)
src/app/mesa/[numero]/              Tela do cliente
src/app/mesa/[numero]/cardapio/     Cardápio aberto a partir da mesa
src/app/cardapio/                   Cardápio sem mesa
src/components/cardapio/            Partes do cardápio (lista, categorias, barra de chamar)
src/app/admin/painel/               Painel de chamados
src/app/admin/mesas/                Cadastro de mesas e QR Codes
src/app/admin/mesas/imprimir/       Folha de plaquinhas para impressão
src/app/admin/login/                Login do painel
src/app/api/chamados/               API pública (criar chamado, consultar status)
src/app/api/admin/                  API do painel (protegida por senha)
src/app/api/demo/eventos/           Tempo real do modo demonstração
src/lib/store/                      Acesso ao banco: Supabase ou memória (demonstração)
src/lib/tempo-real.ts               Escuta de mudanças (Supabase Realtime)
src/lib/som.ts                      Campainha (Web Audio API, sem arquivo de som)
```

Comandos: `npm run dev` (desenvolvimento), `npm run build` e `npm start` (produção), `npm run typecheck` (checagem de tipos).
