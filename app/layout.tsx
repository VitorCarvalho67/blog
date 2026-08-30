import type { Metadata } from "next";
import { Bitter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getTema } from "@/lib/prefs";
import { sair } from "@/lib/actions";
import SearchForm from "@/components/search-form";
import ThemeToggle from "@/components/theme-toggle";
import { Rss } from "@/components/icons";
import "./globals.css";

const serif = Bitter({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "~/blog", template: "%s — ~/blog" },
  description: "Um blog em texto puro.",
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};

/* Único JavaScript de aplicação do projeto: o atalho Ctrl+K da busca.
   Vai por next/script porque um <script> inline dentro de um componente React
   não é reexecutado em navegação client-side — e o React 19 avisa sobre isso. */
/* Atalhos da busca: Ctrl/Cmd+K e "/". A barra só vale fora de campo de texto,
   senão você não conseguiria digitar uma barra dentro de um post. */
const ATALHO = `addEventListener("keydown",function(e){
var a=e.target,t=a&&a.tagName,d=t==="INPUT"||t==="TEXTAREA"||(a&&a.isContentEditable);
var k=(e.ctrlKey||e.metaKey)&&e.key==="k";
var b=e.key==="/"&&!d&&!e.ctrlKey&&!e.metaKey&&!e.altKey;
if(!k&&!b)return;e.preventDefault();
var i=document.getElementById("q");if(i){i.focus();i.select()}})`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, tema, cabecalhos] = await Promise.all([
    getUser(),
    getTema(),
    headers(),
  ]);
  const de = cabecalhos.get("x-url") ?? "/";
  const rota = de.split("?")[0];
  const aqui = (destino: string) =>
    rota === destino ? ("page" as const) : undefined;

  return (
    <html
      lang="pt-BR"
      data-theme={tema ?? undefined}
      className={`${serif.variable} ${mono.variable}`}
    >
      <body>
        <a className="pular" href="#conteudo">
          Pular para o conteúdo
        </a>

        <header className="top">
          <div className="top-in">
            <Link href="/" className="brand" aria-current={aqui("/")}>
              ~/blog
            </Link>
            <nav aria-label="Principal">
              <Link href="/arquivo" aria-current={aqui("/arquivo")}>
                Arquivo
              </Link>
              <Link href="/sobre" aria-current={aqui("/sobre")}>
                Sobre
              </Link>
              {user && (
                <Link href="/escrever" aria-current={aqui("/escrever")}>
                  Escrever
                </Link>
              )}
            </nav>

            {/* filha direta do cabeçalho: no mobile ela ganha a linha inteira */}
            <SearchForm />

            <div className="top-right">
              <Link href="/rss.xml" className="btn ghost" title="Feed RSS">
                <Rss />
              </Link>
              <ThemeToggle tema={tema} de={de} />
              {user ? (
                <>
                  <Link href={`/u/${user.username}`} className="meta">
                    @{user.username}
                  </Link>
                  <form action={sair}>
                    <button className="ghost" title="Encerrar sessão">
                      sair
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/entrar" className="btn principal">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </header>

        {children}

        <footer className="foot">
          <nav className="foot-in" aria-label="Rodapé">
            <span>~/blog</span>
            <Link href="/arquivo">arquivo</Link>
            <Link href="/busca">busca</Link>
            <Link href="/rss.xml">rss</Link>
            <Link href="/sobre" title="Política editorial da casa">
              escrito por gente
            </Link>
            {user && <Link href="/conta">conta</Link>}
          </nav>
        </footer>

        <Script id="atalho-busca" strategy="afterInteractive">
          {ATALHO}
        </Script>
      </body>
    </html>
  );
}
