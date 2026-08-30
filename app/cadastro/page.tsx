import Link from "next/link";
import { redirect } from "next/navigation";
import { cadastrar } from "@/lib/actions";
import { getUser } from "@/lib/auth";
import { Shell } from "@/components/shell";

export const metadata = { title: "Cadastro" };

const ERROS: Record<string, string> = {
  email: "E-mail inválido.",
  username: "Usuário: 3 a 20 caracteres, apenas a-z, 0-9 e _.",
  senha: "A senha precisa de pelo menos 8 caracteres.",
  existe: "Esse e-mail ou usuário já está em uso.",
};

export default async function Cadastro({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; email?: string; username?: string }>;
}) {
  if (await getUser()) redirect("/");
  const { e, email, username } = await searchParams;

  return (
    <Shell prose>
      <div className="stack narrow">
        <h1>Criar conta</h1>
        {e && <p className="err">{ERROS[e] ?? "Não deu certo."}</p>}

        <form action={cadastrar} className="stack">
          <div>
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              name="username"
              defaultValue={username ?? ""}
              required
              pattern="[a-zA-Z0-9_]{3,20}"
              autoComplete="username"
            />
          </div>
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
            <label htmlFor="senha">Senha (mínimo 8 caracteres)</label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button>Criar conta</button>
        </form>

        <p className="meta">
          Já tem conta? <Link href="/entrar">Entrar</Link>
        </p>
      </div>
    </Shell>
  );
}
