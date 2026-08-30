# ~/blog

Blog em Markdown: Next.js 16 (App Router) + Prisma 7 + Postgres.

Tipografia de terminal levada a sério — slab serif nos títulos, monoespaçada no
corpo, texto justificado com hifenização. **Zero componentes client**: não existe
um único `"use client"` no projeto. O site funciona inteiro com JavaScript
desligado, incluindo login, publicação, troca de tema e alternância entre lista
e grade. O único script do lado do cliente é o atalho `Ctrl+K` da busca, seis
linhas carregadas por `next/script` — um `<script>` inline dentro de um
componente React não roda em navegação client-side, e o React 19 avisa.

## Rodando

```sh
cp .env.example .env      # e coloque sua DATABASE_URL
npm run db:push           # cria as tabelas
npm run dev               # http://localhost:3000
```

Sem um Postgres à mão, escolha um:

- **Prisma Postgres local:** `npx prisma dev` (exige Node >= 22.12)
- **Grátis na nuvem:** `npx create-db`
- **Neon / Supabase / Railway:** cole a connection string no `.env`

## Rotas

| Rota | O que é |
| --- | --- |
| `/` | feed paginado, agrupado por mês, com Destaques e índice lateral |
| `/arquivo` | tudo que já saiu, em lista compacta por mês |
| `/busca?q=` | título, corpo e tags; `#tag` restringe só à tag |
| `/tag/[tag]` | todos os posts de uma tag |
| `/post/[slug]` | post, com tempo de leitura, tags, comentários e anterior/próximo |
| `/u/[username]` | perfil com bio, contagem e posts paginados |
| `/escrever` | editor Markdown, visibilidade, destaque, comentários on/off |
| `/rss.xml` | feed RSS 2.0 dos 30 posts mais recentes |
| `/conta` | bio e liberação de acesso (quem lê seus posts de amigos) |
| `/entrar`, `/cadastro`, `/sobre` | sessão e política editorial |

## Política editorial

**Nada de texto de IA aqui dentro.** O aviso aparece em [/sobre](app/sobre/page.tsx)
e, principalmente, dentro do editor — no lugar exato onde alguém colaria:

> Aqui seu cérebro será o responsável por criar algo. Talvez ele nem lembre
> mais como se faz. Vai ter de ter paciência.

É uma regra da casa, escrita em [components/aviso-ia.tsx](components/aviso-ia.tsx),
não uma checagem automática. Detector de IA não funciona; o que funciona é
deixar claro qual é o trato.

## Visibilidade e liberação de acesso

Cada post tem uma de três visibilidades (`enum Visibilidade`):

| | quem lê | onde aparece |
| --- | --- | --- |
| `PUBLICO` | qualquer um | feed, arquivo, busca, tag, RSS |
| `AMIGOS` | quem o autor liberou | mesmas listas, só para quem tem acesso |
| `PRIVADO` | só o autor | apenas no perfil do autor — é onde o rascunho mora |

A liberação é **por pessoa, não por post**: você libera `@fulano` uma vez em
`/conta` e ele passa a ler todos os seus posts de amigos. Modelo `Acesso`
(`ownerId` → `friendId`), com `@@unique` no par.

Toda a regra vive em [lib/visibilidade.ts](lib/visibilidade.ts) e sai de lá como
um `where` do Prisma, aplicado igual em feed, busca, tag, arquivo e perfil:

```ts
{ OR: [
    { visibility: "PUBLICO" },
    { visibility: "AMIGOS", authorId: { in: autoresLiberados } },
] }
```

Duas decisões deliberadas:

- **`PRIVADO` nunca entra em listagem**, nem para o próprio dono — senão o feed
  vira gaveta de rascunho. Ele aparece no perfil do autor e no link direto.
- **Quem não tem acesso recebe 404**, não 403. Um 403 confirmaria que existe
  algo escondido naquela URL.

O RSS serve só `PUBLICO`: leitor de feed chega sem sessão, então não há para
quem personalizar.

## Markdown

O corpo do post é Markdown (GFM: tabelas, `~~riscado~~`, listas de tarefas),
convertido no servidor por `unified` em [lib/markdown.ts](lib/markdown.ts).
Duas barreiras contra XSS, nessa ordem:

1. `remark-rehype` roda com `allowDangerousHtml` desligado — HTML escrito
   dentro do post é descartado ainda no AST;
2. `rehype-sanitize` passa o resultado pelo schema do GitHub, que corta
   atributos de evento e esquemas de URL perigosos.

Na prática: `<script>`, `<iframe>` e `<img onerror=…>` desaparecem, e
`[x](javascript:alert(1))` vira um `<a>` sem `href`.

`remark-breaks` mantém o comportamento antigo do blog: uma quebra de linha
simples continua sendo uma quebra de linha, sem precisar de dois espaços no fim.

`textoSimples()` faz o caminho inverso — Markdown para texto corrido — e
alimenta os resumos dos cartões, o tempo de leitura e as descrições do RSS,
para que a sintaxe nunca vaze pra fora do post.

## Comentários

Exigem conta — sem comentário anônimo, que é ímã de spam e a autenticação já
existe. O corpo é o mesmo Markdown do post, pelo mesmo pipeline sanitizado.

**Dois níveis, e só.** Um comentário raiz aceita respostas; uma resposta não.
`comentar()` rejeita `parentId` que já tenha pai, então a árvore não cresce
sozinha e a renderização não precisa de recursão.

**Responder sem JavaScript:** o link `?responder=<id>` recarrega a página com o
formulário aberto sob aquele comentário, e o formulário de topo some enquanto
isso — não existem duas caixas abertas ao mesmo tempo.

**Quem apaga:** o autor do comentário e o dono do post (moderação da própria
casa). A checagem é refeita no servidor em `apagarComentario()`, não só na
renderização do botão.

**Herdam a visibilidade do post:** `comentar()` chama o mesmo `podeLer()` da
página. Quem não enxerga um post de amigos também não comenta nele — e o
redirect é para `/`, sem confirmar que o post existe.

O autor pode **fechar a conversa** (`commentsOpen`) sem apagar nada: o
formulário some, os comentários continuam lá, e um POST forjado é recusado.

## Mídia no post

Um link **sozinho no parágrafo** (linha em branco antes e depois) vira mídia;
link no meio de uma frase continua link:

| o que você escreve | o que sai |
| --- | --- |
| `https://youtu.be/ID` ou `youtube.com/watch?v=ID` | player, via `youtube-nocookie.com` |
| `https://vimeo.com/ID` | player do Vimeo |
| URL `.jpg .png .gif .webp .avif .svg` | `<figure><img loading="lazy">` |
| URL `.mp4 .webm .ogv .mov` | `<figure><video controls>` |
| `[legenda](url)` | a mesma mídia, com `<figcaption>` |

Tudo é HTML nativo — nenhum JavaScript entra por causa disso.

A transformação vive em [lib/midia.ts](lib/midia.ts) e acontece **no AST**
(`data.hName` do mdast, que o remark-rehype converte em elemento), nunca
injetando HTML cru: o `allowDangerousHtml` continua desligado.

Duas barreiras para o `<iframe>`, que é a tag perigosa da lista:

1. `remarkMidia` só cria iframe para YouTube e Vimeo, e reescreve a URL para a
   forma de embed — o host nunca vem do que a pessoa digitou;
2. `rehypeApenasEmbedsConhecidos` roda **depois** do sanitizador e remove
   qualquer iframe cujo host não esteja em `HOSTS_EMBED`.

A segunda é redundante hoje, de propósito: se alguém afrouxar o schema amanhã,
o buraco não abre sozinho.

Vale para comentários também, já que usam o mesmo pipeline. Se isso incomodar,
o caminho é passar uma opção ao `renderizarMarkdown` desligando `remarkMidia`.

## Datas e fuso

Todas as colunas `DateTime` são `@db.Timestamptz(3)`. Com `timestamp` sem fuso,
o driver `pg` serializa e relê os valores no fuso local do processo Node, e toda
data volta deslocada — 3h, no caso de um servidor em `America/Sao_Paulo`. Em
data de post isso só aparece perto da meia-noite; em hora de comentário, sempre.

A exibição usa `Intl.DateTimeFormat` com um fuso **fixo** (`TZ_EXIBICAO`, padrão
`America/Sao_Paulo`), não o fuso do servidor: o texto renderizado tem de ser o
mesmo em qualquer máquina. O agrupamento por mês faz `date_trunc` no mesmo fuso,
senão um post do dia 1º às 00:30 cairia no mês anterior.

## Teclado e leitor de tela

O site é HTML semântico do começo ao fim, então Tab e Enter já funcionavam.
O que faltava:

- **Anel de foco visível.** `:focus-visible` com 2px na cor de acento — só
  aparece pra quem navega por teclado, não no clique do mouse. E removi o
  `outline: none` que eu tinha posto nos campos: trocar o anel por mudança de
  cor de borda é o anti-padrão clássico de acessibilidade.
- **Skip link.** Primeiro elemento focável da página, escondido até receber
  foco. Sem ele são 8 paradas de Tab (marca, 3 links, busca, rss, tema, entrar)
  antes do conteúdo, em toda página. O `<main>` tem `tabindex="-1"` para o foco
  ir mesmo pra lá, e não só rolar a tela.
- **Marcos rotulados.** `<nav aria-label="Principal">` e `"Rodapé"`, um só
  `<main>`, e `aria-current="page"` no link da página atual.
- **Âncoras com `scroll-margin-top`**, senão o alvo aterrissa debaixo do
  cabeçalho fixo — 5,5rem no desktop, 7,5rem no mobile, onde ele tem duas linhas.
- **Responder comentário** dá `autoFocus` no campo: como a ação recarrega a
  página, sem isso o foco voltava pro topo.
- **Atalhos da busca:** `Ctrl/Cmd+K` e `/`, esta última ignorada enquanto você
  digita em algum campo.

## Design

- **Fontes:** Bitter (slab serif) e JetBrains Mono, via `next/font/google` — são
  baixadas no build e auto-hospedadas, com métricas de fallback pra não haver
  salto de layout. Nenhuma requisição a servidor de terceiros em runtime.
- **Paleta:** neutros no matiz 240, derivados de `#1e1e2e`; acento `#e7332a`.
  São **dois** tokens de acento, de propósito: `--accent` é a cor exata, usada
  onde 3:1 basta (anel de foco, bordas, barra de citação); `--accent-txt` é a
  mesma cor ajustada em luminosidade até passar 4,5:1 em texto — `#e7332a`
  puro dá 3,83:1 sobre o fundo e 3,45:1 sobre os cartões.
- **Erro em âmbar, não vermelho.** Com acento vermelho, mensagem de erro em
  vermelho vira link. `--bad` está no matiz 38, a 35 graus do acento.
- **Tema:** claro/escuro/automático em ~40 linhas de tokens CSS. O padrão segue
  `prefers-color-scheme`; o botão do cabeçalho cicla `auto → claro → escuro` e
  grava a escolha num cookie, então o servidor já entrega o HTML no tema certo —
  sem flash de tema errado e sem script.
- **Lista/Grade:** mesma ideia, cookie + Server Action. Vale pra feed, busca,
  tag e perfil.
- **Texto:** `text-align: justify` + `hyphens: auto` com `lang="pt-BR"` no
  `<html>`, que é o que faz o navegador usar o dicionário de hifenização
  português. Abaixo de 620px o justificado é desligado — em coluna estreita ele
  abre rios de espaço em vez de alinhar.
- **Mobile:** o cabeçalho quebra em duas linhas (marca + links + ícones na
  primeira, busca ocupando a segunda) em vez de esconder a navegação. O `CTRL K`
  some, os alvos de toque sobem para ~40px e as caixas de texto encolhem.
  Os blocos `@media` ficam **no fim** de [app/globals.css](app/globals.css):
  media query não soma especificidade, então uma regra mobile escrita antes da
  regra que ela sobrescreve simplesmente não vale.

## Autenticação

Própria, ~90 linhas em [lib/auth.ts](lib/auth.ts):

- senha com `scrypt` (`node:crypto`), salt de 16 bytes por usuário
- sessão = token aleatório de 32 bytes no cookie `sid` (`httpOnly`, `sameSite=lax`,
  `secure` em produção); no banco fica só o **SHA-256** do token
- comparação com `timingSafeEqual`; expira em 30 dias
- `getUser()` é embrulhado em `cache()` do React: uma query por request

Server Actions são protegidas pelo Origin check do próprio Next; validação e
autorização (dono do post) são refeitas no servidor em [lib/actions.ts](lib/actions.ts).
Os formulários de preferência mandam a rota de retorno num campo `de`, que é
validado pra ser um caminho interno — `https://…` e `//host` caem pra `/`.

## Estrutura

```
app/          rotas (todas Server Components)
components/   shell/TOC, cartões, comentários, toggles, aviso-ia, ícones
lib/          db, auth, actions, posts, visibilidade, prefs, markdown, slug
proxy.ts      expõe a URL atual como header x-url
prisma/       schema.prisma
```

## Notas

- A paginação busca `POR_PAGINA + 1` linhas para saber se há próxima página
  sem precisar de um `count()` extra.
- O contador de posts por mês vem de um único `date_trunc` agrupado
  ([lib/posts.ts](lib/posts.ts)), não de uma query por mês.
- Tags são um `String[]` nativo do Postgres com índice GIN — `tags: { has: x }`
  vira um `@>` indexado. Sem tabela de junção.
- A busca roda sobre o Markdown de origem, não sobre o HTML — procurar por
  `aninhado` acha o item de lista, procurar por `<h2>` não acha nada.
- Blocos de código são estilizados, mas sem realce de sintaxe. Se quiser,
  `rehype-highlight` entra como um `.use()` a mais no pipeline.
- A busca usa `contains` + `mode: "insensitive"` (`ILIKE`). Passando de alguns
  milhares de posts, troque por full-text: `tsvector` + índice GIN.
- Comentários não são paginados (teto de 500 por post). Passando disso, o
  caminho é paginar as raízes e carregar as respostas por bloco.
- Não há edição de comentário, de propósito: apagar e reescrever deixa o
  histórico honesto, sem "editado" implícito.
- `npm audit` acusa `deepmerge-ts` via `@prisma/config`. É dependência só da
  CLI do Prisma (build/dev), não vai para o runtime.
