import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { POR_PAGINA, paginaAtual } from "@/lib/paginacao";
import { getVista } from "@/lib/prefs";
import { CAMPOS_CARD, agruparPorMes, totaisPorMes } from "@/lib/posts";
import { getUser } from "@/lib/auth";
import { autoresLiberados, filtroVisivel } from "@/lib/visibilidade";
import { Shell, TocMeses } from "@/components/shell";
import { Cartao, Colecao } from "@/components/post-views";
import ViewToggle from "@/components/view-toggle";
import Pager from "@/components/pager";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const page = paginaAtual((await searchParams).p);
  const user = await getUser();
  const [visivel, liberados] = await Promise.all([
    filtroVisivel(user),
    autoresLiberados(user),
  ]);

  const [vista, cabecalhos, posts, destaques, totais] = await Promise.all([
    getVista(),
    headers(),
    prisma.post.findMany({
      where: visivel,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * POR_PAGINA,
      take: POR_PAGINA + 1,
      select: CAMPOS_CARD,
    }),
    page === 1
      ? prisma.post.findMany({
          where: { AND: [visivel, { featured: true }] },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: CAMPOS_CARD,
        })
      : [],
    totaisPorMes(liberados),
  ]);

  const temProxima = posts.length > POR_PAGINA;
  const meses = agruparPorMes(posts.slice(0, POR_PAGINA));

  return (
    <Shell toc={meses.length > 0 && <TocMeses meses={meses} />}>
      <div className="stack">
        <p className="meta">
          Procurando posts mais antigos?{" "}
          <Link href="/arquivo">Veja o arquivo completo &rarr;</Link>
        </p>

        <div className="spread">
          <h1>Últimos posts</h1>
          <ViewToggle vista={vista} de={cabecalhos.get("x-url") ?? "/"} />
        </div>

        {destaques.length > 0 && (
          <details className="destaques">
            <summary>
              <h2>Destaques</h2>
            </summary>
            <div className="grid">
              {destaques.map((p) => (
                <Cartao key={p.id} post={p} />
              ))}
            </div>
          </details>
        )}

        {meses.length === 0 ? (
          <p className="dim">
            {page > 1 ? "Nada por aqui." : "Nenhum post publicado ainda."}
          </p>
        ) : (
          meses.map((mes) => (
            <section key={mes.id} id={mes.id}>
              <div className="month spread">
                <h2>{mes.rotulo}</h2>
                <span className="meta">
                  {totais.get(mes.id) ?? mes.posts.length} posts
                </span>
              </div>
              <Colecao posts={mes.posts} vista={vista} />
            </section>
          ))
        )}

        <Pager base="/" page={page} temProxima={temProxima} />
      </div>
    </Shell>
  );
}
