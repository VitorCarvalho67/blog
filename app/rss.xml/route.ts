import { prisma } from "@/lib/db";
import { resumo } from "@/lib/posts";

const esc = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );

export async function GET(req: Request) {
  const base = process.env.SITE_URL ?? new URL(req.url).origin;

  const posts = await prisma.post.findMany({
    where: { visibility: "PUBLICO" }, // feed é anônimo: nada de amigos aqui
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      slug: true,
      title: true,
      body: true,
      createdAt: true,
      author: { select: { username: true } },
    },
  });

  const itens = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/post/${p.slug}</link>
      <guid isPermaLink="true">${base}/post/${p.slug}</guid>
      <dc:creator>${esc(p.author.username)}</dc:creator>
      <pubDate>${p.createdAt.toUTCString()}</pubDate>
      <description>${esc(resumo(p.body, 400))}</description>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>~/blog</title>
    <link>${base}</link>
    <description>Um blog em texto puro.</description>
    <language>pt-BR</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
${itens}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=600",
    },
  });
}
