import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { POR_PAGINA, paginaAtual } from "@/lib/paginacao";
import { getVista } from "@/lib/prefs";
import { CAMPOS_CARD } from "@/lib/posts";
import { getUser } from "@/lib/auth";
import { filtroVisivel } from "@/lib/visibilidade";
import { Shell } from "@/components/shell";
import { Colecao } from "@/components/post-views";
import ViewToggle from "@/components/view-toggle";
import Pager from "@/components/pager";

type Props = {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ p?: string }>;
};

export async function generateMetadata({ params }: Props) {
  return { title: `#${decodeURIComponent((await params).tag)}` };
}

export default async function TagPage({ params, searchParams }: Props) {
  const tag = decodeURIComponent((await params).tag).toLowerCase();
  if (!/^[a-z0-9-]{1,60}$/.test(tag)) notFound();

  const page = paginaAtual((await searchParams).p);
  const visivel = await filtroVisivel(await getUser());
  const where = { AND: [visivel, { tags: { has: tag } }] };

  const [vista, cabecalhos, posts, total] = await Promise.all([
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
  ]);

  return (
    <Shell>
      <div className="stack">
        <div className="spread">
          <h1>#{tag}</h1>
          <ViewToggle vista={vista} de={cabecalhos.get("x-url") ?? "/"} />
        </div>
        <p className="meta">
          {total} {total === 1 ? "post" : "posts"} com essa tag
        </p>

        {posts.length === 0 ? (
          <p className="dim">Nada com essa tag.</p>
        ) : (
          <Colecao posts={posts.slice(0, POR_PAGINA)} vista={vista} />
        )}

        <Pager
          base={`/tag/${tag}`}
          page={page}
          temProxima={posts.length > POR_PAGINA}
        />
      </div>
    </Shell>
  );
}
