import Link from "next/link";
import { getUser } from "@/lib/auth";
import { lidosDo } from "@/lib/leitura";
import { dataCurta, leitura, resumo, type PostCard } from "@/lib/posts";
import { ROTULO } from "@/lib/visibilidade";

export function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="tags">
      {tags.map((t) => (
        <Link key={t} href={`/tag/${t}`}>
          #{t}
        </Link>
      ))}
    </div>
  );
}

export function Selo({ post }: { post: PostCard }) {
  if (post.visibility === "PUBLICO") return null;
  return (
    <>
      {" "}
      <span className={`selo ${post.visibility.toLowerCase()}`}>
        {ROTULO[post.visibility]}
      </span>
    </>
  );
}

/**
 * Marca "lido" nos cartões.
 *
 * Componente que busca o próprio dado, em vez de um prop descendo das páginas:
 * as cinco listagens (feed, arquivo, busca, tag e perfil) montam estes mesmos
 * cartões, e todas teriam de passar a lista adiante. `getUser()` e `lidosDo()`
 * são embrulhados no `cache()` do React, então uma página inteira de cartões
 * custa duas queries, não duas por cartão.
 */
export async function MarcaLida({ postId }: { postId: string }) {
  const user = await getUser();
  if (!user) return null;
  if (!(await lidosDo(user.id)).has(postId)) return null;
  return (
    <>
      {" "}
      <span className="selo lido">lido</span>
    </>
  );
}

function Contagem({ n }: { n: number }) {
  if (n === 0) return null;
  return <> · {n === 1 ? "1 comentário" : `${n} comentários`}</>;
}

export function Cartao({ post }: { post: PostCard }) {
  return (
    <article className="card">
      <div className="meta">
        {dataCurta(post.createdAt)}
        <Contagem n={post._count.comentarios} />
        <Selo post={post} />
        <MarcaLida postId={post.id} />
      </div>
      <h3>
        <Link href={`/post/${post.slug}`}>{post.title}</Link>
      </h3>
      <Tags tags={post.tags} />
      <p>{resumo(post.body)}</p>
    </article>
  );
}

export function Linha({
  post,
  autor = true,
}: {
  post: PostCard;
  autor?: boolean;
}) {
  return (
    <li>
      <div className="meta">
        {dataCurta(post.createdAt)} · {leitura(post.body)}
        {autor && (
          <>
            {" · "}
            <Link href={`/u/${post.author.username}`}>
              @{post.author.username}
            </Link>
          </>
        )}
        <Contagem n={post._count.comentarios} />
        <Selo post={post} />
        <MarcaLida postId={post.id} />
      </div>
      <h3>
        <Link href={`/post/${post.slug}`}>{post.title}</Link>
      </h3>
      <Tags tags={post.tags} />
      <p>{resumo(post.body, 230)}</p>
    </li>
  );
}

export function Compacta({ post }: { post: PostCard }) {
  return (
    <li>
      <span className="meta">{dataCurta(post.createdAt)}</span>
      <span>
        <Link href={`/post/${post.slug}`}>{post.title}</Link>
        <Selo post={post} />
        <MarcaLida postId={post.id} />
      </span>
    </li>
  );
}

export function Colecao({
  posts,
  vista,
  autor = true,
}: {
  posts: PostCard[];
  vista: "grade" | "lista";
  autor?: boolean;
}) {
  if (vista === "grade") {
    return (
      <div className="grid">
        {posts.map((p) => (
          <Cartao key={p.id} post={p} />
        ))}
      </div>
    );
  }
  return (
    <ul className="rows">
      {posts.map((p) => (
        <Linha key={p.id} post={p} autor={autor} />
      ))}
    </ul>
  );
}
