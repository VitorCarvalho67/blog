import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { liberarAmigo, revogarAmigo, salvarPerfil } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { dataCurta } from "@/lib/posts";

export const metadata = { title: "Conta" };

const ERROS: Record<string, string> = {
  usuario: "Nome de usuário inválido.",
  inexistente: "Não existe ninguém com esse usuário.",
  voce: "Você já lê os próprios posts.",
  jatem: "Essa pessoa já está liberada.",
};

export default async function Conta({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; ok?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/entrar");

  const { e, ok } = await searchParams;

  const [liberados, recebidos, pendentes] = await Promise.all([
    prisma.acesso.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        friendId: true,
        createdAt: true,
        friend: { select: { username: true } },
      },
    }),
    prisma.acesso.findMany({
      where: { friendId: user.id },
      orderBy: { createdAt: "desc" },
      select: { owner: { select: { username: true } } },
    }),
    user.writer
      ? prisma.pedidoWriter.count({ where: { status: "PENDENTE" } })
      : 0,
  ]);

  return (
    <Shell prose>
      <div className="stack">
        <h1>Conta</h1>
        <p className="meta">
          @{user.username} · {user.email}
        </p>

        <form action={salvarPerfil} className="stack">
          <div>
            <label htmlFor="bio">Bio — até 280 caracteres</label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={user.bio ?? ""}
              maxLength={280}
              style={{ minHeight: "7rem" }}
            />
          </div>
          <button>Salvar bio</button>
        </form>

        <section className="stack" style={{ marginTop: "3rem" }}>
          <h2>Liberação de acesso</h2>
          <p className="meta">
            Quem estiver nesta lista lê os seus posts marcados como{" "}
            <span className="selo amigos">amigos</span>. Posts{" "}
            <span className="selo privado">privados</span> continuam só seus.
          </p>

          {e && <p className="err">{ERROS[e] ?? "Não deu certo."}</p>}
          {ok && <p className="meta">Acesso liberado.</p>}

          <form action={liberarAmigo} className="inline-form">
            <label htmlFor="amigo" className="sr-only">
              Usuário para liberar
            </label>
            <input
              id="amigo"
              name="amigo"
              placeholder="usuario"
              autoComplete="off"
              required
              pattern="@?[a-zA-Z0-9_]{3,20}"
            />
            <button>Liberar</button>
          </form>

          {liberados.length === 0 ? (
            <p className="dim">Ninguém liberado ainda.</p>
          ) : (
            <ul className="pessoas">
              {liberados.map((a) => (
                <li key={a.friendId}>
                  <Link href={`/u/${a.friend.username}`}>
                    @{a.friend.username}
                  </Link>
                  <span className="meta">
                    desde {dataCurta(a.createdAt)}
                  </span>
                  <form action={revogarAmigo}>
                    <input type="hidden" name="id" value={a.friendId} />
                    <button className="link dim">revogar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {recebidos.length > 0 && (
            <p className="meta">
              Você tem acesso aos posts de amigos de:{" "}
              {recebidos.map((a, i) => (
                <span key={a.owner.username}>
                  {i > 0 && ", "}
                  <Link href={`/u/${a.owner.username}`}>
                    @{a.owner.username}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </section>

        <section className="stack" style={{ marginTop: "2.5rem" }}>
          <h2>Acesso de escrita</h2>
          {user.writer ? (
            <p className="meta">
              Você é <span className="selo">writer</span> — publica posts e
              decide quem mais pode.{" "}
              <Link href="/pedidos">
                {pendentes === 0
                  ? "Ver os pedidos"
                  : `${pendentes} ${pendentes === 1 ? "pedido esperando" : "pedidos esperando"}`}
              </Link>
              .
            </p>
          ) : (
            <p className="meta">
              Você ainda não publica posts.{" "}
              <Link href="/pedidos">Pedir acesso de escrita</Link>.
            </p>
          )}
        </section>

        <p className="meta">
          <Link href={`/u/${user.username}`}>Ver perfil público &rarr;</Link>
        </p>
      </div>
    </Shell>
  );
}
