import { NextResponse, type NextRequest } from "next/server";

/** Expõe a URL atual aos Server Components, pra que os formulários de
 *  preferência (tema, lista/grade) saibam pra onde redirecionar de volta. */
export default function proxy(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-url", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|rss.xml).*)"],
};
