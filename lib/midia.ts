/**
 * Mídia dentro do post: um link sozinho no parágrafo vira imagem, vídeo ou
 * player embutido.
 *
 * A transformação acontece no AST (mdast -> hast via `data.hName`), nunca
 * injetando HTML cru — o `allowDangerousHtml` continua desligado e o
 * sanitizador continua sendo a última palavra.
 */

type No = {
  type: string;
  url?: string;
  alt?: string | null;
  value?: string;
  children?: No[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
};

const IMAGENS = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
const VIDEOS = /\.(mp4|webm|ogv|mov)$/i;

/** Únicos hosts de onde um <iframe> pode vir. */
export const HOSTS_EMBED = ["www.youtube-nocookie.com", "player.vimeo.com"];

const caminhoDe = (url: string) => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

const textoDe = (no: No): string =>
  no.type === "text"
    ? (no.value ?? "")
    : (no.children ?? []).map(textoDe).join("");

/** Reconhece YouTube e Vimeo e devolve a URL de embed equivalente. */
function embedDe(url: string): { src: string; titulo: string } | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;

  const host = u.hostname.replace(/^www\./, "");
  const idOk = (id: string | undefined | null) =>
    id && /^[\w-]{6,24}$/.test(id) ? id : null;

  if (host === "youtu.be") {
    const id = idOk(u.pathname.slice(1));
    return id
      ? { src: `https://www.youtube-nocookie.com/embed/${id}`, titulo: "Vídeo do YouTube" }
      : null;
  }
  if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
    const id = idOk(
      u.searchParams.get("v") ??
        u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/)?.[1],
    );
    return id
      ? { src: `https://www.youtube-nocookie.com/embed/${id}`, titulo: "Vídeo do YouTube" }
      : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(\d{6,})/)?.[1];
    return id
      ? { src: `https://player.vimeo.com/video/${id}`, titulo: "Vídeo do Vimeo" }
      : null;
  }
  return null;
}

const bloco = (
  hName: string,
  hProperties: Record<string, unknown> = {},
  children: No[] = [],
): No => ({ type: "paragraph", data: { hName, hProperties }, children });

const comLegenda = (midia: No, legenda: string): No =>
  bloco(
    "figure",
    { className: ["midia"] },
    legenda
      ? [midia, bloco("figcaption", {}, [{ type: "text", value: legenda }])]
      : [midia],
  );

const blocoImagem = (url: string, legenda: string) =>
  comLegenda(
    bloco("img", {
      src: url,
      alt: legenda,
      loading: "lazy",
      decoding: "async",
    }),
    legenda,
  );

const blocoVideo = (url: string, legenda: string) =>
  comLegenda(
    bloco("video", {
      src: url,
      controls: true,
      preload: "metadata",
      playsInline: true,
    }),
    legenda,
  );

const blocoEmbed = (alvo: { src: string; titulo: string }) =>
  bloco("div", { className: ["embed"] }, [
    bloco("iframe", {
      src: alvo.src,
      title: alvo.titulo,
      loading: "lazy",
      allow: "accelerometer; encrypted-media; picture-in-picture; fullscreen",
      allowFullScreen: true,
    }),
  ]);

/**
 * Só transforma parágrafo cujo conteúdo é um único link ou imagem — ou seja,
 * a URL precisa estar sozinha, com linha em branco antes e depois. Link no
 * meio de uma frase continua sendo link.
 */
export function remarkMidia() {
  return (arvore: No) => {
    const filhos = arvore.children;
    if (!filhos) return;

    filhos.forEach((no, i) => {
      if (no.type !== "paragraph" || !no.children) return;

      const conteudo = no.children.filter(
        (c) => !(c.type === "text" && !(c.value ?? "").trim()),
      );
      if (conteudo.length !== 1) return;

      const unico = conteudo[0];
      let url: string | undefined;
      let legenda = "";

      if (unico.type === "link") {
        url = unico.url;
        const texto = textoDe(unico).trim();
        legenda = texto && texto !== url ? texto : "";
      } else if (unico.type === "image") {
        url = unico.url;
        legenda = (unico.alt ?? "").trim();
      } else {
        return;
      }
      if (!url) return;

      const alvo = embedDe(url);
      if (alvo) {
        filhos[i] = blocoEmbed(alvo);
        return;
      }

      const caminho = caminhoDe(url);
      if (VIDEOS.test(caminho)) {
        filhos[i] = blocoVideo(url, legenda);
      } else if (unico.type === "image" || IMAGENS.test(caminho)) {
        filhos[i] = blocoImagem(url, legenda);
      }
    });
  };
}

type Elemento = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Elemento[];
};

/**
 * Segunda barreira: roda DEPOIS do sanitizador e remove qualquer <iframe> que
 * não seja de um host da lista. Hoje é redundante — só `remarkMidia` cria
 * iframes — mas garante que afrouxar o schema no futuro não abra um buraco.
 */
export function rehypeApenasEmbedsConhecidos() {
  return (arvore: Elemento) => {
    const anda = (no: Elemento) => {
      if (!no.children) return;
      no.children = no.children.filter((f) => {
        if (f.type !== "element" || f.tagName !== "iframe") return true;
        try {
          return HOSTS_EMBED.includes(new URL(String(f.properties?.src ?? "")).hostname);
        } catch {
          return false;
        }
      });
      no.children.forEach(anda);
    };
    anda(arvore);
  };
}
