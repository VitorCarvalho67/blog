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
