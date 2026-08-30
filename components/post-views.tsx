import Link from "next/link";
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
