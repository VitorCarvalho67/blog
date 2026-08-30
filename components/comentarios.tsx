import Link from "next/link";
import { prisma } from "@/lib/db";
import { dataHora } from "@/lib/posts";
import { renderizarMarkdown } from "@/lib/markdown";
import { apagarComentario, comentar } from "@/lib/actions";
import { AvisoColar } from "@/components/aviso-ia";

type Post = {
  id: string;
  slug: string;
  authorId: string;
  commentsOpen: boolean;
};

type Viewer = { id: string } | null;

type Item = {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: Date;
  authorId: string;
  author: { username: string };
};

function Formulario({
  post,
  parentId,
  erro,
}: {
  post: Post;
  parentId?: string;
  erro?: boolean;
}) {
  const campo = parentId ? `corpo-${parentId}` : "corpo-novo";

  return (
    <form action={comentar} className="form-comentario">
      <input type="hidden" name="postId" value={post.id} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

      <label htmlFor={campo} className="sr-only">
        {parentId ? "Sua resposta" : "Seu comentário"}
      </label>
      <textarea
        id={campo}
        name="corpo"
        required
        minLength={2}
        maxLength={4000}
        /* responder recarrega a página; sem isto o foco voltava pro topo */
        autoFocus={!!parentId}
        placeholder={
          parentId ? "Responder…" : "Markdown funciona aqui também."
        }
        data-sem-colar={`colar-${campo}`}
      />
      <AvisoColar id={`colar-${campo}`} />

      {erro && (
        <p className="err">
          O comentário precisa ter de 2 a 4000 caracteres.
        </p>
      )}

      <div className="row">
        <button>{parentId ? "Responder" : "Comentar"}</button>
        {parentId && (
          <Link className="meta" href={`/post/${post.slug}#c${parentId}`}>
            cancelar
          </Link>
        )}
        <span className="meta">
          Escrito por você, não por uma máquina —{" "}
          <Link href="/sobre">o trato da casa</Link>.
        </span>
      </div>
    </form>
  );
}

function Comentario({
  c,
  html,
  post,
  user,
  responder,
}: {
  c: Item;
  html: string;
  post: Post;
  user: Viewer;
  responder: boolean;
}) {
  const podeApagar =
    !!user && (c.authorId === user.id || post.authorId === user.id);

  return (
    <article className="comentario" id={`c${c.id}`}>
      <div className="comentario-cab">
        <Link href={`/u/${c.author.username}`}>@{c.author.username}</Link>
        {c.authorId === post.authorId && (
          <span className="selo">autor do post</span>
        )}
        <span className="meta">{dataHora(c.createdAt)}</span>
        <span className="acoes">
          {responder && post.commentsOpen && user && (
            <Link
              className="meta"
              href={`/post/${post.slug}?responder=${c.id}#c${c.id}`}
            >
              responder
            </Link>
          )}
          {podeApagar && (
            <form action={apagarComentario}>
              <input type="hidden" name="id" value={c.id} />
              <button className="link dim">apagar</button>
            </form>
          )}
        </span>
      </div>
      <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}

export default async function Comentarios({
  post,
  user,
  responder,
  erro,
}: {
  post: Post;
  user: Viewer;
  responder?: string;
  erro?: boolean;
}) {
  const comentarios: Item[] = await prisma.comentario.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: "asc" },
    take: 500,
    select: {
      id: true,
      body: true,
      parentId: true,
      createdAt: true,
      authorId: true,
      author: { select: { username: true } },
    },
  });

  // um passe de markdown por comentário, todos em paralelo
  const htmls = new Map(
    await Promise.all(
      comentarios.map(
        async (c) => [c.id, await renderizarMarkdown(c.body)] as const,
      ),
    ),
  );

  const raizes = comentarios.filter((c) => !c.parentId);
  const total = comentarios.length;

  return (
    <section className="comentarios" id="comentarios">
      <div className="spread">
        <h2>
          {total === 0
            ? "Nenhum comentário"
            : `${total} ${total === 1 ? "comentário" : "comentários"}`}
        </h2>
        {!post.commentsOpen && (
          <span className="meta">conversa fechada pelo autor</span>
        )}
      </div>

      {post.commentsOpen &&
        (user ? (
          !responder && <Formulario post={post} erro={erro} />
        ) : (
          <p className="meta">
            <Link href="/entrar">Entre</Link> ou{" "}
            <Link href="/cadastro">crie uma conta</Link> para comentar.
          </p>
        ))}

      {raizes.length > 0 && (
        <ol className="fio">
          {raizes.map((c) => {
            const respostas = comentarios.filter((r) => r.parentId === c.id);
            return (
              <li key={c.id}>
                <Comentario
                  c={c}
                  html={htmls.get(c.id) ?? ""}
                  post={post}
                  user={user}
                  responder={responder !== c.id}
                />

                {(respostas.length > 0 || responder === c.id) && (
                  <ol className="respostas">
                    {respostas.map((r) => (
                      <li key={r.id}>
                        <Comentario
                          c={r}
                          html={htmls.get(r.id) ?? ""}
                          post={post}
                          user={user}
                          responder={false}
                        />
                      </li>
                    ))}
                    {responder === c.id && post.commentsOpen && user && (
                      <li>
                        <Formulario post={post} parentId={c.id} erro={erro} />
                      </li>
                    )}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
