import { prisma } from "@/lib/db";
import { CAMPOS_CARD, agruparPorMes } from "@/lib/posts";
import { getUser } from "@/lib/auth";
import { filtroVisivel } from "@/lib/visibilidade";
import { Shell, TocMeses } from "@/components/shell";
import { Compacta } from "@/components/post-views";

export const metadata = { title: "Arquivo" };

export default async function Arquivo() {
  const posts = await prisma.post.findMany({
    where: await filtroVisivel(await getUser()),
    orderBy: { createdAt: "desc" },
    select: CAMPOS_CARD,
  });
  const meses = agruparPorMes(posts);

  return (
    <Shell toc={meses.length > 0 && <TocMeses meses={meses} />}>
      <div className="stack">
        <div className="spread">
          <h1>Arquivo</h1>
          <span className="meta">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {meses.length === 0 ? (
          <p className="dim">Nenhum post publicado ainda.</p>
        ) : (
          meses.map((mes) => (
            <section key={mes.id} id={mes.id}>
              <div className="month spread">
                <h2>{mes.rotulo}</h2>
                <span className="meta">{mes.posts.length} posts</span>
              </div>
              <ul className="compact">
                {mes.posts.map((p) => (
                  <Compacta key={p.id} post={p} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </Shell>
  );
}
