export const POR_PAGINA = 12;

export const paginaAtual = (p?: string) => {
  const n = Number(p);
  return Number.isFinite(n) && n > 1 ? Math.floor(n) : 1;
};
