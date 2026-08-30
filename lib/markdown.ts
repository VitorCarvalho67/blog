import { unified, type Processor } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { rehypeApenasEmbedsConhecidos, remarkMidia } from "@/lib/midia";

/**
 * Markdown -> HTML seguro.
 *
 * `remark-rehype` roda com `allowDangerousHtml` desligado (o padrão), então
 * HTML cru escrito dentro do post é descartado ainda no AST. `rehype-sanitize`
 * é a segunda barreira: passa o resultado pelo schema do GitHub, que corta
 * atributos de evento e esquemas de URL perigosos (`javascript:`).
 *
 * `remark-breaks` mantém o comportamento antigo do blog, em que uma quebra de
 * linha simples continua sendo uma quebra de linha.
 */
/**
 * O schema do GitHub não conhece figura, vídeo nem iframe. Liberamos as tags,
 * mas os únicos nós desse tipo que existem no HTML são os que `remarkMidia`
 * criou — HTML escrito à mão já foi descartado antes, no AST.
 */
const schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "figure",
    "figcaption",
    "video",
    "iframe",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className"],
    img: [...(defaultSchema.attributes?.img ?? []), "loading", "decoding"],
    video: ["src", "controls", "preload", "playsInline", "poster"],
    iframe: ["src", "title", "loading", "allow", "allowFullScreen"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https"],
  },
};

/**
 * Desliga o título "setext": no Markdown padrão, uma linha só de traços logo
 * abaixo de um parágrafo promove aquele parágrafo inteiro a <h2>.
 *
 * É a pegadinha de quem escreve texto corrido e usa uma linha de traços como
 * separador entre parágrafos: em vez do separador, os parágrafos viram títulos
 * enormes, sem nenhum aviso. Aqui título se escreve com # (é o que o editor
 * ensina, e é o que os posts usam), então a sintaxe não faz falta. Desligá-la é
 * a mesma escolha do remark-breaks: o texto sai como foi digitado.
 *
 * Efeito colateral bem-vindo: com ela fora do caminho, uma linha de três ou
 * mais traços passa a valer como separador mesmo colada no parágrafo de cima.
 */
function semTituloSetext(this: Processor) {
  const data = this.data();
  data.micromarkExtensions ??= [];
  data.micromarkExtensions.push({ disable: { null: ["setextUnderline"] } });
}

const processador = unified()
  .use(remarkParse)
  .use(semTituloSetext)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkMidia)
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeApenasEmbedsConhecidos)
  .use(rehypeStringify);

export async function renderizarMarkdown(md: string) {
  return String(await processador.process(md));
}

/** Markdown -> texto corrido, para resumos, tempo de leitura e RSS. */
export function textoSimples(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    // o destino pode ter parênteses aninhados: [x](javascript:alert(1))
    .replace(/!\[[^\]]*\]\((?:[^()]|\([^()]*\))*\)/g, " ")
    .replace(/\[([^\]]*)\]\((?:[^()]|\([^()]*\))*\)/g, "$1")
    // HTML cru é descartado na renderização; some do resumo também
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    // URL sozinha vira mídia no post; no resumo ela só polui
    .replace(/^\s*https?:\/\/\S+\s*$/gm, " ")
    .replace(/^\s{0,3}>+\s?/gm, "")
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, "")
    // Só tirar o # deixaria o título de seção na mesma linha do parágrafo
    // seguinte, e o colapso de espaços logo abaixo os grudaria numa frase só:
    // "O porquê do blog Este não é o primeiro post". O ponto fecha o título e
    // separa os dois. Não se acrescenta ponto a título que já termina em
    // pontuação, senão "E agora?" viraria "E agora?.".
    // Roda depois da regra de lista de propósito: "## 2026" vira "2026. ", que
    // aquela regra confundiria com item de lista numerada e apagaria.
    .replace(/^\s{0,3}#{1,6}\s+(.*?)\s*$/gm, (_, t: string) =>
      /[.!?:;…]$/.test(t) ? `${t} ` : `${t}. `,
    )
    .replace(/^\s{0,3}([-*_]\s*){3,}$/gm, " ")
    .replace(/\*\*|__|\*|_|~~/g, "")
    .replace(/^\s*\|?[\s:|-]+\|\s*$/gm, " ")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
