import { definirTema } from "@/lib/actions";
import { proximoTema, type Tema } from "@/lib/prefs";
import { Auto, Lua, Sol } from "@/components/icons";

const ROTULOS = { light: "claro", dark: "escuro", auto: "automático" } as const;

export default function ThemeToggle({ tema, de }: { tema: Tema; de: string }) {
  const atual = tema ?? "auto";
  const Icone = atual === "light" ? Sol : atual === "dark" ? Lua : Auto;

  return (
    <form action={definirTema}>
      <input type="hidden" name="de" value={de} />
      <input type="hidden" name="tema" value={proximoTema(tema)} />
      <button
        className="ghost"
        title={`Tema: ${ROTULOS[atual]} — clique para alternar`}
        aria-label={`Tema: ${ROTULOS[atual]}. Clique para alternar.`}
      >
        <Icone />
      </button>
    </form>
  );
}
