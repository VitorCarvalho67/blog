import { cookies } from "next/headers";

export type Vista = "grade" | "lista";
export type Tema = "light" | "dark" | null;

export async function getVista(): Promise<Vista> {
  return (await cookies()).get("vista")?.value === "lista" ? "lista" : "grade";
}

export async function getTema(): Promise<Tema> {
  const v = (await cookies()).get("tema")?.value;
  return v === "light" || v === "dark" ? v : null;
}

/** auto -> claro -> escuro -> auto */
export const proximoTema = (t: Tema) =>
  t === null ? "light" : t === "light" ? "dark" : "auto";
