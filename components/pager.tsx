import Link from "next/link";

export default function Pager({
  base,
  page,
  temProxima,
}: {
  base: string;
  page: number;
  temProxima: boolean;
}) {
  if (page === 1 && !temProxima) return null;
  const href = (p: number) => `${base}${base.includes("?") ? "&" : "?"}p=${p}`;

  return (
    <nav className="pager">
      {page > 1 ? (
        <Link className="btn" href={href(page - 1)}>
          &larr; Anteriores
        </Link>
      ) : (
        <span />
      )}
      <span className="meta">página {page}</span>
      {temProxima ? (
        <Link className="btn" href={href(page + 1)}>
          Próximos &rarr;
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
