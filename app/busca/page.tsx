import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { POR_PAGINA, paginaAtual } from "@/lib/paginacao";
import { getVista } from "@/lib/prefs";
import { CAMPOS_CARD } from "@/lib/posts";
import { getUser } from "@/lib/auth";
import { filtroVisivel } from "@/lib/visibilidade";
import { slugify } from "@/lib/slug";
import { Shell } from "@/components/shell";
import { Colecao } from "@/components/post-views";
import SearchForm from "@/components/search-form";
import ViewToggle from "@/components/view-toggle";
import Pager from "@/components/pager";

export const metadata = { title: "Busca" };

export default async function Busca({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; p?: string }>;
}) {
  const { q: bruto, p } = await searchParams;
  const q = (bruto ?? "").trim();
  const page = paginaAtual(p);

  if (!q) {
    return (
      <Shell prose>
        <div className="stack">
          <h1>Busca</h1>
          <SearchForm grande />
          <p className="dim">
            Procura no título, no corpo e nas tags dos posts publicados. Comece
            com <code>#</code> para buscar só por tag.
          </p>
        </div>
      </Shell>
    );
  }

  const tag = slugify(q.replace(/^#/, ""));
  const soTag = q.startsWith("#");

  const visivel = await filtroVisivel(await getUser());
  const where = {
    AND: [
      visivel,
      soTag
        ? { tags: { has: tag } }
        : {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { body: { contains: q, mode: "insensitive" as const } },
              { tags: { has: tag } },
            ],
          },
    ],
  };

  const [vista, cabecalhos, posts, total, autores] = await Promise.all([
    getVista(),
    headers(),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * POR_PAGINA,
      take: POR_PAGINA + 1,
      select: CAMPOS_CARD,
    }),
    prisma.post.count({ where }),
    page === 1 && !soTag
      ? prisma.user.findMany({
          where: { username: { contains: q, mode: "insensitive" } },
          select: { id: true, username: true },
          take: 5,
        })
      : [],
  ]);

  return (
    <Shell>
      <div className="stack">
        <div className="spread">
          <h1>Busca</h1>
          <ViewToggle vista={vista} de={cabecalhos.get("x-url") ?? "/busca"} />
        </div>

        <SearchForm q={q} grande />

        <p className="meta">
          {total} {total === 1 ? "resultado" : "resultados"} para{" "}
          <strong>{q}</strong>
          {autores.length > 0 && (
            <>
              {" · perfis: "}
              {autores.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ", "}
                  <Link href={`/u/${a.username}`}>@{a.username}</Link>
                </span>
              ))}
            </>
          )}
        </p>

        {posts.length === 0 ? (
          <p className="dim">Nenhum post encontrado.</p>
        ) : (
          <Colecao posts={posts.slice(0, POR_PAGINA)} vista={vista} />
        )}

        <Pager
          base={`/busca?q=${encodeURIComponent(q)}`}
          page={page}
          temProxima={posts.length > POR_PAGINA}
        />
      </div>
    </Shell>
  );
}
