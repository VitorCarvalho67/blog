import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

export type Visibilidade = "PUBLICO" | "AMIGOS" | "PRIVADO";

export const ROTULO: Record<Visibilidade, string> = {
  PUBLICO: "público",
  AMIGOS: "amigos",
  PRIVADO: "privado",
};

export const EXPLICACAO: Record<Visibilidade, string> = {
  PUBLICO: "qualquer pessoa lê, aparece no feed, no arquivo e no RSS",
  AMIGOS: "só quem você liberou em Conta lê; fora do RSS",
  PRIVADO: "só você lê — é onde o rascunho mora",
};

/** Ids de quem liberou acesso de amigos a este usuário. Uma query por request. */
export const liberadoresDe = cache(async (userId: string) => {
  const linhas = await prisma.acesso.findMany({
    where: { friendId: userId },
    select: { ownerId: true },
  });
  return linhas.map((l) => l.ownerId);
});

type Visitante = { id: string } | null;

/**
 * Filtro de listagem (feed, busca, tag, arquivo): tudo que é público, mais os
 * posts de amigos de quem liberou o visitante. Post PRIVADO nunca entra numa
 * listagem geral — nem o seu próprio; ele vive no seu perfil.
 */
export async function filtroVisivel(user: Visitante) {
  if (!user) return { visibility: "PUBLICO" as const };
  const autores = [user.id, ...(await liberadoresDe(user.id))];
  return {
    OR: [
      { visibility: "PUBLICO" as const },
      { visibility: "AMIGOS" as const, authorId: { in: autores } },
    ],
  };
}

/** Filtro do perfil de alguém: o dono vê tudo, inclusive privados. */
export async function filtroPerfil(perfilId: string, user: Visitante) {
  if (user?.id === perfilId) return { authorId: perfilId };
  const amigo = user
    ? (await liberadoresDe(user.id)).includes(perfilId)
    : false;
  return {
    authorId: perfilId,
    visibility: amigo
      ? { in: ["PUBLICO", "AMIGOS"] as Visibilidade[] }
      : ("PUBLICO" as const),
  };
}

/** Autores cujos posts de amigos este visitante pode ler (inclui ele mesmo). */
export async function autoresLiberados(user: Visitante) {
  if (!user) return [];
  return [user.id, ...(await liberadoresDe(user.id))];
}

/** Decide o acesso a um post específico. */
export async function podeLer(
  post: { authorId: string; visibility: Visibilidade },
  user: Visitante,
) {
  if (post.visibility === "PUBLICO") return true;
  if (!user) return false;
  if (post.authorId === user.id) return true;
  if (post.visibility === "PRIVADO") return false;
  return (await liberadoresDe(user.id)).includes(post.authorId);
}
