import { configured, sameOrigin, setOwnerCookie, validCode } from "@/lib/auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (!configured()) return Response.json({ error: "Owner access has not been configured." }, { status: 503 });
  let code: unknown;
  try { code = (await request.json()).code; } catch { return Response.json({ error: "Enter your secret code." }, { status: 400 }); }
  if (typeof code !== "string" || !validCode(code)) return Response.json({ error: "Incorrect secret code." }, { status: 401 });
  await setOwnerCookie();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
