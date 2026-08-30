import Link from "next/link";
import { Shell } from "@/components/shell";

export default function NotFound() {
  return (
    <Shell prose>
      <div className="stack">
        <h1>404</h1>
        <p className="dim">
          Essa rota não existe. Talvez esteja no{" "}
          <Link href="/arquivo">arquivo</Link>, ou tente a{" "}
          <Link href="/busca">busca</Link>.
        </p>
      </div>
    </Shell>
  );
}
