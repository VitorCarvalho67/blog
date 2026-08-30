import { definirVista } from "@/lib/actions";
import { Grade, Lista } from "@/components/icons";
import type { Vista } from "@/lib/prefs";

export default function ViewToggle({ vista, de }: { vista: Vista; de: string }) {
  return (
    <form action={definirVista} className="seg">
      <input type="hidden" name="de" value={de} />
      <button
        name="vista"
        value="lista"
        className={vista === "lista" ? "on" : undefined}
        aria-pressed={vista === "lista"}
      >
        <Lista /> Lista
      </button>
      <button
        name="vista"
        value="grade"
        className={vista === "grade" ? "on" : undefined}
        aria-pressed={vista === "grade"}
      >
        <Grade /> Grade
      </button>
    </form>
  );
}
