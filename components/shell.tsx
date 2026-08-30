import type { Mes } from "@/lib/posts";

/** três larguras: com TOC (2 colunas), `wide` (grade de cards) e `prose` (leitura). */
export function Shell({
  toc,
  prose = false,
  children,
}: {
  toc?: React.ReactNode;
  prose?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={toc ? "shell" : prose ? "shell solo" : "shell wide"}>
      {/* tabIndex -1 faz o foco realmente ir pro main quando o skip link
          é acionado — sem isso alguns navegadores só rolam a página */}
      <main
        id="conteudo"
        tabIndex={-1}
        className={prose ? "prose" : undefined}
      >
        {children}
      </main>
      {toc && <aside className="toc">{toc}</aside>}
    </div>
  );
}

export function TocMeses({ meses }: { meses: Mes[] }) {
  return (
    <>
      <h2>Nesta página</h2>
      <ol>
        {meses.map((m) => (
          <li key={m.id}>
            <a href={`#${m.id}`}>{m.rotulo}</a>
          </li>
        ))}
      </ol>
    </>
  );
}
