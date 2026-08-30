import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Ids dos posts que este usuário já marcou como lidos.
 *
 * Vem tudo de uma vez, embrulhado no `cache()` do React: uma página de feed
 * desenha dezenas de cartões, e cada um precisa saber se está lido. Perguntar
 * por cartão seriam dezenas de queries; assim é uma só por request, como em
 * `getUser()`. Só ids, sem nenhum campo do post: o que volta é do tamanho do
 * que a pessoa leu, não do banco inteiro.
 *
 * Se um dia a conta mais antiga acumular milhares de leituras, o caminho é
 * receber os ids da página e filtrar por `postId: { in: ... }`.
 */
export const lidosDo = cache(async (userId: string) => {
  const linhas = await prisma.leitura.findMany({
    where: { userId },
    select: { postId: true },
  });
  return new Set(linhas.map((l) => l.postId));
});

/** Este usuário já leu este post? `null` (visitante sem conta) nunca leu. */
export async function jaLeu(userId: string | null, postId: string) {
  if (!userId) return false;
  return (await lidosDo(userId)).has(postId);
}
