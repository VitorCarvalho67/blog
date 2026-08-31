import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getVista } from "@/lib/prefs";
import { POR_PAGINA, paginaAtual } from "@/lib/paginacao";
import { CAMPOS_CARD, dataCurta } from "@/lib/posts";
import { filtroPerfil } from "@/lib/visibilidade";
import { Shell } from "@/components/shell";
import { Colecao } from "@/components/post-views";
import ViewToggle from "@/components/view-toggle";
import Pager from "@/components/pager";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ p?: string }>;
};

export async function generateMetadata({ params }: Props) {
  return { title: `@${(await params).username}` };
}

export default async function Perfil({ params, searchParams }: Props) {
  const { username } = await params;
  const page = paginaAtual((await searchParams).p);

  const [perfil, viewer, vista, cabecalhos] = await Promise.all([
    prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true, username: true, bio: true, createdAt: true },
    }),
    getUser(),
    getVista(),
    headers(),
  ]);
  if (!perfil) notFound();

  const dono = viewer?.id === perfil.id;
  const where = await filtroPerfil(perfil.id, viewer);

  const [posts, total] = await Promise.all([
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
          <h1>@{perfil.username}</h1>
          <div className="row">
            {dono && (
              <Link href="/escrever" className="btn contorno">
                Escrever
              </Link>
            )}
            {posts.length > 0 && (
              <ViewToggle
                vista={vista}
                de={cabecalhos.get("x-url") ?? `/u/${perfil.username}`}
              />
            )}
          </div>
        </div>

        <p className="meta">
          {total} {total === 1 ? "post" : "posts"} · no ar desde{" "}
          {dataCurta(perfil.createdAt)}
          {dono && (
            <>
              {" · "}
              <Link href="/conta">editar perfil</Link>
            </>
          )}
        </p>

        {perfil.bio && <p>{perfil.bio}</p>}

        {posts.length === 0 ? (
          <p className="dim">Nenhum post por aqui ainda.</p>
        ) : (
          <Colecao
            posts={posts.slice(0, POR_PAGINA)}
            vista={vista}
            autor={false}
          />
        )}

        <Pager
          base={`/u/${perfil.username}`}
          page={page}
          temProxima={posts.length > POR_PAGINA}
        />
      </div>
    </Shell>
  );
}
