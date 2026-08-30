import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { apagar } from "@/lib/actions";
import { dataLonga, leitura, resumo } from "@/lib/posts";
import { renderizarMarkdown } from "@/lib/markdown";
import { jaLeu } from "@/lib/leitura";
import { ROTULO, filtroVisivel, podeLer } from "@/lib/visibilidade";
import { Shell } from "@/components/shell";
import { Tags } from "@/components/post-views";
import Comentarios from "@/components/comentarios";
import LidoToggle from "@/components/lido-toggle";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ responder?: string; e?: string }>;
};

const buscar = (slug: string) =>
  prisma.post.findUnique({
    where: { slug },
    include: { author: { select: { username: true, bio: true } } },
  });

export async function generateMetadata({ params }: Props) {
  const post = await buscar((await params).slug);
  if (!post) return { title: "Não encontrado" };
  return {
    title: post.title,
    description: resumo(post.body, 160),
    openGraph: {
      title: post.title,
      description: resumo(post.body, 160),
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: [post.author.username],
    },
  };
}

export default async function PostPage({ params, searchParams }: Props) {
  const [{ slug }, { responder, e }] = await Promise.all([params, searchParams]);
  const [post, user] = await Promise.all([buscar(slug), getUser()]);

  const dono = !!user && post?.authorId === user.id;
  if (!post || !(await podeLer(post, user))) notFound();

  const visivel = await filtroVisivel(user);
  const [html, lido, anterior, proximo] = await Promise.all([
    renderizarMarkdown(post.body),
    jaLeu(user?.id ?? null, post.id),
    prisma.post.findFirst({
      where: { AND: [visivel, { createdAt: { lt: post.createdAt } }] },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true },
    }),
    prisma.post.findFirst({
      where: { AND: [visivel, { createdAt: { gt: post.createdAt } }] },
      orderBy: { createdAt: "asc" },
      select: { slug: true, title: true },
    }),
  ]);

  return (
    <Shell prose>
      <div className="lede">
        <h1>{post.title}</h1>
        <p className="meta" style={{ margin: 0 }}>
          {dataLonga(post.createdAt)} · {leitura(post.body)} · por{" "}
          <Link href={`/u/${post.author.username}`}>
            @{post.author.username}
          </Link>
          {post.visibility !== "PUBLICO" && (
            <>
              {" "}
              <span className={`selo ${post.visibility.toLowerCase()}`}>
                {ROTULO[post.visibility]}
              </span>
            </>
          )}
        </p>
        <Tags tags={post.tags} />
      </div>

      <article className="md" dangerouslySetInnerHTML={{ __html: html }} />

      {user && (
        <div className="row" style={{ marginTop: "2.5rem" }}>
          <LidoToggle postId={post.id} lido={lido} de={`/post/${post.slug}`} />
          {dono && (
            <>
              <Link className="btn" href={`/escrever?id=${post.id}`}>
                Editar
              </Link>
              <form action={apagar}>
                <input type="hidden" name="id" value={post.id} />
                <button className="secundario">Apagar</button>
              </form>
            </>
          )}
        </div>
      )}

      <Comentarios
        post={post}
        user={user}
        responder={responder}
        erro={e === "comentario"}
      />

      <nav className="vizinhos">
        <div>
          {anterior && (
            <>
              <span className="meta">&larr; Anterior</span>
              <Link href={`/post/${anterior.slug}`}>{anterior.title}</Link>
            </>
          )}
        </div>
        <div className="next">
          {proximo && (
            <>
              <span className="meta">Próximo &rarr;</span>
              <Link href={`/post/${proximo.slug}`}>{proximo.title}</Link>
            </>
          )}
        </div>
      </nav>
    </Shell>
  );
}
