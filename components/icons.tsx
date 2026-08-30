type P = { size?: number };

const svg = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const Lista = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const Grade = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const Lua = ({ size = 16 }: P) => (
  <svg {...svg(size)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export const Sol = ({ size = 16 }: P) => (
  <svg {...svg(size)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const Auto = ({ size = 16 }: P) => (
  <svg {...svg(size)}>
    <rect x="2" y="4" width="20" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

export const Rss = ({ size = 16 }: P) => (
  <svg {...svg(size)}>
    <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />
    <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

/* Marca de leitura. Dois desenhos para os dois estados: círculo vazio é "ainda
   não li", círculo com o traço dentro é "li". A cor sozinha não poderia
   carregar essa diferença. */
export const Circulo = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const Check = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.3l2.6 2.6L16 9.5" />
  </svg>
);

/* Chevrons de código, para alternar entre o post formatado e o Markdown dele. */
export const Codigo = ({ size = 14 }: P) => (
  <svg {...svg(size)}>
    <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
  </svg>
);

/* Marca do GitHub. Fora do molde dos outros ícones de propósito: o logo é uma
   silhueta preenchida, e redesenhado a traço vira um borrão a 16px. */
export const GitHub = ({ size = 16 }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58 0-.28-.01-1.02-.02-2A3.73 3.73 0 0 1 4.2 19.9c-.35-.9-.86-1.14-.86-1.14-.7-.48.06-.47.06-.47.78.05 1.19.8 1.19.8.69 1.19 1.81.85 2.25.65.07-.5.27-.85.49-1.04-2.13-.24-4.37-1.07-4.37-4.76 0-1.05.37-1.9.99-2.58-.1-.24-.43-1.22.09-2.54 0 0 .8-.26 2.64.98a9.1 9.1 0 0 1 4.8 0c1.83-1.24 2.63-.98 2.63-.98.52 1.32.19 2.3.1 2.54.61.68.98 1.53.98 2.58 0 3.7-2.25 4.51-4.39 4.75.35.3.65.88.65 1.77 0 1.28-.01 2.31-.01 2.62 0 .26.22.56.83.46A12 12 0 0 0 12 .5z" />
  </svg>
);
