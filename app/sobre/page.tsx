import Link from "next/link";
import { Shell } from "@/components/shell";
import { renderizarMarkdown } from "@/lib/markdown";
import AvisoIA from "@/components/aviso-ia";

export const metadata = {
  title: "Sobre",
  description: "Política editorial: texto escrito por gente, sem IA.",
};

const TEXTO = `Um blog em **Markdown**, servido como texto.

Você escreve em markdown — títulos, listas, citações, tabelas, blocos de
código — e o servidor converte pra HTML antes de mandar. Nada de HTML cru:
a conversão roda com \`allowDangerousHtml\` desligado e ainda passa por um
sanitizador, então nem um \`<script>\` escrito de propósito sobrevive.

O corpo sai justificado com hifenização de verdade, porque o \`<html>\` declara
\`lang="pt-BR"\` e o navegador usa o dicionário certo.

## Quem lê o quê

Cada post tem uma de três visibilidades:

- **público** — qualquer pessoa lê. Aparece no feed, no arquivo, na busca e no RSS.
- **amigos** — só quem você liberou em Conta. Fica fora do RSS, porque leitor
  de feed chega sem sessão.
- **privado** — só você. É onde o rascunho mora.

A liberação é por pessoa e vale pros seus posts de amigos: você libera uma vez,
não a cada post. Dá pra revogar quando quiser, e quem perde o acesso passa a
receber 404 — não uma página dizendo que existe algo escondido ali.

## Sem JavaScript

O site inteiro funciona com JavaScript desligado:

- os formulários são Server Actions com fallback de POST nativo;
- a paginação são links;
- a busca é um \`<form method="get">\`;
- tema e modo de exibição ficam em cookie, decididos no servidor.

A única linha de script no cliente é o atalho \`Ctrl+K\` da busca.`;

export default async function Sobre() {
  const html = await renderizarMarkdown(TEXTO);

  return (
    <Shell prose>
      <div className="stack">
        <h1>Sobre</h1>

        <AvisoIA />

        <article className="md" dangerouslySetInnerHTML={{ __html: html }} />

        <p className="meta">
          <Link href="/arquivo">Arquivo completo</Link> ·{" "}
          <Link href="/rss.xml">Feed RSS</Link>
        </p>
      </div>
    </Shell>
  );
}
