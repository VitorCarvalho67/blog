export default function SearchForm({
  q = "",
  grande = false,
}: {
  q?: string;
  grande?: boolean;
}) {
  return (
    <form className="search" action="/busca" method="get" role="search">
      {/* visualmente oculto, mas ainda anunciado por leitor de tela */}
      <label htmlFor="q" className="sr-only">
        Buscar no site
      </label>
      <input
        id="q"
        name="q"
        defaultValue={q}
        placeholder={
          grande ? "buscar por título, texto ou #tag..." : "Buscar no site..."
        }
        autoComplete="off"
        style={grande ? { width: "100%" } : undefined}
      />
      <kbd>CTRL K</kbd>
    </form>
  );
}
