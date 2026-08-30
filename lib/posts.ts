import { prisma } from "@/lib/db";
import { textoSimples } from "@/lib/markdown";
import type { Visibilidade } from "@/lib/visibilidade";

export const CAMPOS_CARD = {
  id: true,
  slug: true,
  title: true,
  body: true,
  tags: true,
  featured: true,
  visibility: true,
  createdAt: true,
  author: { select: { username: true } },
  _count: { select: { comentarios: true, leituras: true } },
} as const;

export type PostCard = {
  id: string;
  slug: string;
  title: string;
  body: string;
  tags: string[];
  featured: boolean;
  visibility: Visibilidade;
  createdAt: Date;
  author: { username: string };
  _count: { comentarios: number; leituras: number };
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/**
 * Fuso de exibição. Fixo, não o do servidor: o texto tem de ser o mesmo em
 * qualquer máquina que renderize a página (dev, produção, prerender), senão
 * a data muda conforme onde o processo roda.
 */
const FUSO = process.env.TZ_EXIBICAO ?? "America/Sao_Paulo";

const partes = (d: Date) => {
  const f = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => f.find((p) => p.type === t)!.value;
  return {
    dia: get("day"),
    mes: Number(get("month")),
    ano: get("year"),
    hora: get("hour"),
    minuto: get("minute"),
  };
};

export const dataCurta = (d: Date) => {
  const p = partes(d);
  return `${p.dia}/${String(p.mes).padStart(2, "0")}/${p.ano}`;
};

export const dataHora = (d: Date) => {
  const p = partes(d);
  return `${dataCurta(d)} ${p.hora}:${p.minuto}`;
};

export const dataLonga = (d: Date) => {
  const p = partes(d);
  return `${Number(p.dia)} de ${MESES[p.mes - 1].toLowerCase()} de ${p.ano}`;
};

export const mesRotulo = (d: Date) => {
  const p = partes(d);
  return `${p.ano} - ${MESES[p.mes - 1]}`;
};

export const mesId = (d: Date) => {
  const p = partes(d);
  return `m${p.ano}-${String(p.mes).padStart(2, "0")}`;
};

export const leitura = (body: string) =>
  `${Math.max(1, Math.round(textoSimples(body).split(/\s+/).length / 200))} min de leitura`;

/** Resumo em texto corrido: a sintaxe do markdown não aparece nos cartões. */
export const resumo = (body: string, max = 170) => {
  const flat = textoSimples(body);
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
};

export type Mes = { id: string; rotulo: string; posts: PostCard[] };

/** Agrupa uma lista já ordenada (mais recente primeiro) em blocos de mês. */
export function agruparPorMes(posts: PostCard[]): Mes[] {
  const meses: Mes[] = [];
  for (const post of posts) {
    const id = mesId(post.createdAt);
    let bloco = meses.at(-1);
    if (!bloco || bloco.id !== id) {
      bloco = { id, rotulo: mesRotulo(post.createdAt), posts: [] };
      meses.push(bloco);
    }
    bloco.posts.push(post);
  }
  return meses;
}

/**
 * Total visível por mês, para o contador ao lado de cada cabeçalho.
 * Um único agrupamento, com a mesma regra de visibilidade da listagem.
 */
export async function totaisPorMes(autoresLiberados: string[]) {
  const FUSO_SQL = FUSO;
  const linhas = await prisma.$queryRaw<{ mes: Date; total: bigint }[]>`
    SELECT date_trunc('month', "createdAt" AT TIME ZONE ${FUSO_SQL}) AT TIME ZONE ${FUSO_SQL} AS mes,
           count(*) AS total
    FROM "Post"
    WHERE visibility = 'PUBLICO'
       OR (visibility = 'AMIGOS' AND "authorId" = ANY(${autoresLiberados}::text[]))
    GROUP BY 1
    ORDER BY 1 DESC
  `;
  return new Map(linhas.map((l) => [mesId(l.mes), Number(l.total)]));
}
