import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { apagar, publicar } from "@/lib/actions";
import { EXPLICACAO, ROTULO, type Visibilidade } from "@/lib/visibilidade";
import { Shell } from "@/components/shell";
import AvisoIA from "@/components/aviso-ia";

export const metadata = { title: "Escrever" };

const ERROS: Record<string, string> = {
  titulo: "O título precisa ter de 3 a 140 caracteres.",
  corpo: "O corpo não pode ficar vazio.",
};

const OPCOES: Visibilidade[] = ["PUBLICO", "AMIGOS", "PRIVADO"];

export default async function Escrever({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; e?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/entrar");

  const { id, e } = await searchParams;
  const post = id ? await prisma.post.findUnique({ where: { id } }) : null;
  if (id && (!post || post.authorId !== user.id)) redirect("/escrever");

  const atual: Visibilidade = post?.visibility ?? "PUBLICO";
  const amigos = await prisma.acesso.count({ where: { ownerId: user.id } });

  return (
    <Shell>
      <div className="stack">
        <div className="spread">
          <h1>{post ? "Editar post" : "Novo post"}</h1>
          {post && (
            <Link className="meta" href={`/post/${post.slug}`}>
              ver publicado &rarr;
            </Link>
          )}
        </div>

        <AvisoIA />

        {e && <p className="err">{ERROS[e] ?? "Não deu certo."}</p>}

        <form action={publicar} className="stack">
          {post && <input type="hidden" name="id" value={post.id} />}

          <div>
            <label htmlFor="titulo">Título</label>
            <input
              id="titulo"
              name="titulo"
              defaultValue={post?.title ?? ""}
              required
              maxLength={140}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="tags">
              Tags — separadas por vírgula, até 6 (ex: llms, segurança, redes)
            </label>
            <input
              id="tags"
              name="tags"
              defaultValue={post?.tags.join(", ") ?? ""}
              autoComplete="off"
              placeholder="llms, seguranca"
            />
          </div>

          <div>
            <label htmlFor="corpo">
              Corpo — Markdown: <code>## título</code>, <code>**negrito**</code>,{" "}
              <code>[link](url)</code>, <code>- lista</code>,{" "}
              <code>&gt; citação</code>, <code>```bloco de código```</code>,
              tabela. Quebra de linha simples vira quebra de linha. Link de
              YouTube, Vimeo, imagem ou vídeo <strong>sozinho numa linha</strong>{" "}
              (com linha em branco antes e depois) vira player ou figura — o
              texto do link vira a legenda.
            </label>
            <textarea
              id="corpo"
              name="corpo"
              defaultValue={post?.body ?? ""}
              required
            />
          </div>

          <fieldset className="escolhas">
            <legend>Quem pode ler</legend>
            {OPCOES.map((v) => (
              <label key={v} className="escolha">
                <input
                  type="radio"
                  name="visibilidade"
                  value={v}
                  defaultChecked={atual === v}
                />
                <span>
                  <strong>{ROTULO[v]}</strong>
                  <span className="dim"> — {EXPLICACAO[v]}</span>
                </span>
              </label>
            ))}
            <p className="meta">
              {amigos === 0 ? (
                <>
                  Você ainda não liberou ninguém.{" "}
                  <Link href="/conta">Liberar acesso a alguém</Link> para usar a
                  opção “amigos”.
                </>
              ) : (
                <>
                  {amigos} {amigos === 1 ? "pessoa liberada" : "pessoas liberadas"} ·{" "}
                  <Link href="/conta">gerenciar</Link>
                </>
              )}
            </p>
          </fieldset>

          <label className="check">
            <input
              type="checkbox"
              name="destaque"
              defaultChecked={post?.featured ?? false}
            />
            Fixar em Destaques na página inicial
          </label>

          <label className="check">
            <input
              type="checkbox"
              name="comentarios"
              defaultChecked={post?.commentsOpen ?? true}
            />
            Aceitar comentários — desmarcar fecha a conversa sem apagar o que já
            foi dito
          </label>

          <div className="row">
            <button>Salvar e ver</button>
          </div>
        </form>

        {post && (
          <form action={apagar}>
            <input type="hidden" name="id" value={post.id} />
            <button className="link dim">apagar este post</button>
          </form>
        )}
      </div>
    </Shell>
  );
}
