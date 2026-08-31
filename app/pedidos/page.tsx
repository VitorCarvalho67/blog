import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { dataHora } from "@/lib/posts";
import { decidirPedido, pedirWriter } from "@/lib/actions";
import { Shell } from "@/components/shell";
import { AvisoColar } from "@/components/aviso-ia";

export const metadata = { title: "Acesso de escrita" };

const CAMPOS = {
  id: true,
  motivo: true,
  status: true,
  createdAt: true,
  decididoEm: true,
  user: { select: { username: true, bio: true, createdAt: true } },
  decisor: { select: { username: true } },
} as const;

export default async function Pedidos({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/entrar");

  const { ok, e } = await searchParams;

  /* ------------------------------------------------ quem já pode escrever */
  if (user.writer) {
    const [pendentes, decididos] = await Promise.all([
      prisma.pedidoWriter.findMany({
        where: { status: "PENDENTE" },
        orderBy: { createdAt: "asc" },
        select: CAMPOS,
      }),
      prisma.pedidoWriter.findMany({
        where: { status: { not: "PENDENTE" } },
        orderBy: { decididoEm: "desc" },
        take: 20,
        select: CAMPOS,
      }),
    ]);

    return (
      <Shell prose>
        <div className="stack">
          <h1>Acesso de escrita</h1>
          <p className="meta">
            Você é writer, então decide o pedido de qualquer pessoa. Não há
            administrador aqui: quem já escreve é quem abre a porta.
          </p>

          {e === "proprio" && (
            <p className="err">Ninguém decide o próprio pedido.</p>
          )}

          <section className="stack">
            <h2>
              {pendentes.length === 0
                ? "Nenhum pedido esperando"
                : `${pendentes.length} ${pendentes.length === 1 ? "pedido esperando" : "pedidos esperando"}`}
            </h2>

            {pendentes.map((p) => (
              <article key={p.id} className="pedido">
                <div className="comentario-cab">
                  <Link href={`/u/${p.user.username}`}>
                    @{p.user.username}
                  </Link>
                  <span className="meta">pediu em {dataHora(p.createdAt)}</span>
                </div>
                {p.user.bio && <p className="meta">{p.user.bio}</p>}
                {p.motivo && <p>{p.motivo}</p>}
                <form action={decidirPedido} className="row">
                  <input type="hidden" name="id" value={p.id} />
                  <button name="decisao" value="aprovar">
                    Aprovar
                  </button>
                  <button name="decisao" value="recusar" className="secundario">
                    Recusar
                  </button>
                </form>
              </article>
            ))}
          </section>

          {decididos.length > 0 && (
            <section className="stack">
              <h2>Decididos</h2>
              <ul className="compact">
                {decididos.map((p) => (
                  <li key={p.id}>
                    <span className="meta">
                      {p.decididoEm ? dataHora(p.decididoEm) : "—"}
                    </span>
                    <span>
                      <Link href={`/u/${p.user.username}`}>
                        @{p.user.username}
                      </Link>{" "}
                      <span className="selo">
                        {p.status === "APROVADO" ? "aprovado" : "recusado"}
                      </span>{" "}
                      <span className="meta">
                        por @{p.decisor?.username ?? "alguém que saiu"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Shell>
    );
  }

  /* --------------------------------------------- quem ainda não escreve */
  const meu = await prisma.pedidoWriter.findUnique({
    where: { userId: user.id },
    select: { status: true, motivo: true, createdAt: true, decididoEm: true },
  });

  return (
    <Shell prose>
      <div className="stack">
        <h1>Acesso de escrita</h1>
        <p>
          Ler e comentar já está liberado para você. Publicar posts precisa da
          aprovação de alguém que já escreve aqui — qualquer writer serve, não
          existe administrador.
        </p>

        {ok && <p className="meta">Pedido enviado. Agora é esperar.</p>}

        {meu?.status === "PENDENTE" ? (
          <p className="meta">
            Seu pedido está na fila desde {dataHora(meu.createdAt)}.
          </p>
        ) : (
          <>
            {meu?.status === "RECUSADO" && (
              <p className="err">
                Seu pedido foi recusado
                {meu.decididoEm ? ` em ${dataHora(meu.decididoEm)}` : ""}. Você
                pode mandar outro.
              </p>
            )}

            <form action={pedirWriter} className="stack">
              <div>
                <label htmlFor="motivo">
                  Sobre o que você quer escrever? — opcional, até 500
                  caracteres. Ajuda quem vai decidir.
                </label>
                <textarea
                  id="motivo"
                  name="motivo"
                  maxLength={500}
                  defaultValue={meu?.motivo ?? ""}
                  style={{ minHeight: "7rem" }}
                  data-sem-colar="colar-motivo"
                />
                <AvisoColar id="colar-motivo" />
              </div>
              <button>Pedir acesso</button>
            </form>
          </>
        )}

        <p className="meta">
          Enquanto isso: <Link href="/arquivo">o arquivo</Link> e{" "}
          <Link href="/sobre">a política da casa</Link>.
        </p>
      </div>
    </Shell>
  );
}
