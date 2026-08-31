"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { podeLer, type Visibilidade } from "@/lib/visibilidade";
import {
  createSession,
  destroySession,
  getUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const isUniqueError = (e: unknown) =>
  typeof e === "object" && e !== null && "code" in e && e.code === "P2002";

/** "LLMs, segurança, vibe coding" -> ["llms", "seguranca", "vibe-coding"] */
const parseTags = (raw: string) =>
  Array.from(
    new Set(
      raw
        .split(/[,\n]/)
        .map((t) => slugify(t.replace(/^#/, "")))
        .filter((t) => t !== "post"),
    ),
  ).slice(0, 6);

/** Volta pra uma rota interna informada pelo formulário, nunca pra fora. */
const voltarPara = (fd: FormData) => {
  const de = str(fd, "de");
  return de.startsWith("/") && !de.startsWith("//") ? de : "/";
};

/* ------------------------------------------------------------------ conta */

export async function cadastrar(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const username = str(fd, "username").toLowerCase();
  const senha = String(fd.get("senha") ?? "");
  const back = `&email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    redirect(`/cadastro?e=email${back}`);
  if (!/^[a-z0-9_]{3,20}$/.test(username))
    redirect(`/cadastro?e=username${back}`);
  if (senha.length < 8) redirect(`/cadastro?e=senha${back}`);

  let id: string;
  try {
    const user = await prisma.user.create({
      data: { email, username, passwordHash: await hashPassword(senha) },
    });
    id = user.id;
  } catch (e) {
    if (isUniqueError(e)) redirect(`/cadastro?e=existe${back}`);
    throw e;
  }

  await createSession(id);
  redirect(`/u/${username}`);
}

export async function entrar(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const senha = String(fd.get("senha") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(senha, user.passwordHash)))
    redirect(`/entrar?e=1&email=${encodeURIComponent(email)}`);

  await createSession(user.id);
  redirect("/");
}

export async function sair() {
  await destroySession();
  redirect("/");
}

export async function salvarPerfil(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/entrar");

  await prisma.user.update({
    where: { id: user.id },
    data: { bio: str(fd, "bio").slice(0, 280) || null },
  });

  revalidatePath(`/u/${user.username}`);
  redirect(`/u/${user.username}`);
}

/* ------------------------------------------------------------------ posts */

export async function publicar(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/entrar");
  // esconder o botão não é autorização: o POST forjado morre aqui
  if (!user.writer) redirect("/pedidos");

  const id = str(fd, "id");
  const title = str(fd, "titulo");
  const body = String(fd.get("corpo") ?? "").trim();
  const tags = parseTags(str(fd, "tags"));
  const escolha = str(fd, "visibilidade");
  const visibility: Visibilidade =
    escolha === "AMIGOS" || escolha === "PRIVADO" ? escolha : "PUBLICO";
  // destaque só faz sentido em post que alguém além de você pode ver
  const featured = fd.get("destaque") !== null && visibility !== "PRIVADO";
  const commentsOpen = fd.get("comentarios") !== null;
  const base = id ? `/escrever?id=${id}&` : "/escrever?";

  if (title.length < 3 || title.length > 140) redirect(`${base}e=titulo`);
  if (!body) redirect(`${base}e=corpo`);

  let slug: string;
  if (id) {
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing || existing.authorId !== user.id) redirect("/");
    const updated = await prisma.post.update({
      where: { id },
      data: { title, body, tags, featured, visibility, commentsOpen },
    });
    slug = updated.slug;
  } else {
    slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 8)}`;
    await prisma.post.create({
      data: {
        slug, title, body, tags, featured, visibility, commentsOpen,
        authorId: user.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/arquivo");
  revalidatePath(`/u/${user.username}`);
  revalidatePath(`/post/${slug}`);
  redirect(`/post/${slug}`); // privado inclusive: é a prévia do markdown
}

export async function apagar(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/entrar");

  const { count } = await prisma.post.deleteMany({
    where: { id: str(fd, "id"), authorId: user.id },
  });
  if (count) {
    revalidatePath("/");
    revalidatePath("/arquivo");
    revalidatePath(`/u/${user.username}`);
  }
  redirect(`/u/${user.username}`);
}

/* ------------------------------------------------------------ comentários */

const LIMITE_COMENTARIO = 4000;

export async function comentar(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/entrar");

  const parentId = str(fd, "parentId") || null;
  const body = String(fd.get("corpo") ?? "").trim();

  const post = await prisma.post.findUnique({
    where: { id: str(fd, "postId") },
    select: {
      id: true,
      slug: true,
      authorId: true,
      visibility: true,
      commentsOpen: true,
    },
  });
  // quem não pode ler o post não pode comentar nele — nem descobrir que existe
  if (!post || !(await podeLer(post, user))) redirect("/");
  if (!post.commentsOpen) redirect(`/post/${post.slug}#comentarios`);

  if (body.length < 2 || body.length > LIMITE_COMENTARIO) {
    const volta = parentId ? `?e=comentario&responder=${parentId}` : "?e=comentario";
    redirect(`/post/${post.slug}${volta}#comentarios`);
  }

  // resposta só vale para um comentário raiz do mesmo post: a árvore para no 2º nível
  if (parentId) {
    const pai = await prisma.comentario.findUnique({
      where: { id: parentId },
      select: { postId: true, parentId: true },
    });
    if (!pai || pai.postId !== post.id || pai.parentId) {
      redirect(`/post/${post.slug}#comentarios`);
    }
  }

  const novo = await prisma.comentario.create({
    data: { body, postId: post.id, authorId: user.id, parentId },
  });

  revalidatePath(`/post/${post.slug}`);
  redirect(`/post/${post.slug}#c${novo.id}`);
}

export async function apagarComentario(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/entrar");

  const comentario = await prisma.comentario.findUnique({
    where: { id: str(fd, "id") },
    select: {
      id: true,
      authorId: true,
      post: { select: { slug: true, authorId: true } },
    },
  });
  if (!comentario) redirect("/");

  // apaga quem escreveu o comentário, ou o dono do post (moderação da própria casa)
  const pode =
    comentario.authorId === user.id || comentario.post.authorId === user.id;
  if (pode) {
    await prisma.comentario.delete({ where: { id: comentario.id } });
    revalidatePath(`/post/${comentario.post.slug}`);
  }

  redirect(`/post/${comentario.post.slug}#comentarios`);
}

/* --------------------------------------------------- acesso de escrita */

export async function pedirWriter(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/entrar");
  if (user.writer) redirect("/pedidos");

  const motivo = str(fd, "motivo").slice(0, 500) || null;

  // upsert: pedido recusado pode ser refeito, voltando pra fila
  await prisma.pedidoWriter.upsert({
    where: { userId: user.id },
    create: { userId: user.id, motivo },
    update: { motivo, status: "PENDENTE", decisorId: null, decididoEm: null },
  });

  revalidatePath("/pedidos");
  redirect("/pedidos?ok=1");
}

export async function decidirPedido(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/entrar");
  if (!user.writer) redirect("/pedidos");

  const id = str(fd, "id");
  const aprovar = str(fd, "decisao") === "aprovar";

  const pedido = await prisma.pedidoWriter.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  // já decidido por outro writer enquanto esta página estava aberta
  if (!pedido || pedido.status !== "PENDENTE") redirect("/pedidos");
  // ninguém se aprova
  if (pedido.userId === user.id) redirect("/pedidos?e=proprio");

  // virar writer e registrar a decisão têm de acontecer juntos, ou nenhum dos dois
  await prisma.$transaction([
    prisma.pedidoWriter.update({
      where: { id },
      data: {
        status: aprovar ? "APROVADO" : "RECUSADO",
        decisorId: user.id,
        decididoEm: new Date(),
      },
    }),
    ...(aprovar
      ? [prisma.user.update({ where: { id: pedido.userId }, data: { writer: true } })]
      : []),
  ]);

  revalidatePath("/pedidos");
  redirect("/pedidos");
}

/* ------------------------------------------------ liberação de acesso */

export async function liberarAmigo(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/entrar");

  const username = str(fd, "amigo").toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_]{3,20}$/.test(username)) redirect("/conta?e=usuario");

  const amigo = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!amigo) redirect("/conta?e=inexistente");
  if (amigo.id === user.id) redirect("/conta?e=voce");

  try {
    await prisma.acesso.create({
      data: { ownerId: user.id, friendId: amigo.id },
    });
  } catch (e) {
    if (isUniqueError(e)) redirect("/conta?e=jatem");
    throw e;
  }

  revalidatePath("/conta");
  redirect("/conta?ok=1");
}

export async function revogarAmigo(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/entrar");

  await prisma.acesso.deleteMany({
    where: { ownerId: user.id, friendId: str(fd, "id") },
  });

  revalidatePath("/conta");
  redirect("/conta");
}

/* ------------------------------------------------------- marca de leitura */

export async function alternarLido(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/entrar");

  const post = await prisma.post.findUnique({
    where: { id: str(fd, "id") },
    select: { id: true, slug: true, authorId: true, visibility: true },
  });
  // mesma regra dos comentários: quem não enxerga o post não marca leitura
  // nele, e o redirect é para "/", sem confirmar que aquele id existe.
  if (!post || !(await podeLer(post, user))) redirect("/");

  // Apagar primeiro e criar só se não havia nada é o que faz o botão alternar
  // sem uma consulta antes: uma ida ao banco decide e aplica o estado novo.
  const { count } = await prisma.leitura.deleteMany({
    where: { userId: user.id, postId: post.id },
  });
  if (count === 0) {
    try {
      await prisma.leitura.create({
        data: { userId: user.id, postId: post.id },
      });
    } catch (e) {
      // dois cliques ao mesmo tempo: o par é único, o segundo perde e tudo bem
      if (!isUniqueError(e)) throw e;
    }
  }

  revalidatePath(`/post/${post.slug}`);
  redirect(voltarPara(fd));
}

/* ------------------------------------------------- preferências de leitura */

const ANO = 60 * 60 * 24 * 365;

export async function definirVista(fd: FormData) {
  const vista = str(fd, "vista") === "lista" ? "lista" : "grade";
  (await cookies()).set("vista", vista, { path: "/", maxAge: ANO, sameSite: "lax" });
  redirect(voltarPara(fd));
}

export async function definirTema(fd: FormData) {
  const tema = str(fd, "tema");
  const jar = await cookies();
  if (tema === "light" || tema === "dark") {
    jar.set("tema", tema, { path: "/", maxAge: ANO, sameSite: "lax" });
  } else {
    jar.delete("tema");
  }
  redirect(voltarPara(fd));
}
