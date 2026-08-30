import Link from "next/link";
import { redirect } from "next/navigation";
import { entrar } from "@/lib/actions";
import { getUser } from "@/lib/auth";
import { Shell } from "@/components/shell";

export const metadata = { title: "Entrar" };

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; email?: string }>;
}) {
  if (await getUser()) redirect("/");
  const { e, email } = await searchParams;

  return (
    <Shell prose>
      <div className="stack narrow">
        <h1>Entrar</h1>
        {e && <p className="err">E-mail ou senha incorretos.</p>}

        <form action={entrar} className="stack">
          <div>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={email ?? ""}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <button>Entrar</button>
        </form>

        <p className="meta">
          Sem conta? <Link href="/cadastro">Criar uma</Link>
        </p>
      </div>
    </Shell>
  );
}
