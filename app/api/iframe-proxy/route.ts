import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxy para iframes — busca a URL remota e retorna o conteúdo
 * removendo headers que bloqueiam embedding (X-Frame-Options, CSP frame-ancestors).
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing ?url= parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Bloqueia file:// e data: para evitar SSRF
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only http/https allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": req.headers.get("user-agent") ?? "",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const contentType = upstream.headers.get("content-type") ?? "text/html";

    const headers = new Headers();
    headers.set("Content-Type", contentType);

    // Passa headers seguros do upstream
    for (const name of ["cache-control", "content-language", "last-modified"]) {
      const v = upstream.headers.get(name);
      if (v) headers.set(name, v);
    }

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, { status: upstream.status, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
