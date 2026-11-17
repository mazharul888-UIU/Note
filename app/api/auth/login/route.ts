import { configured, sameOrigin, setOwnerCookie, validCode } from "@/lib/auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (!configured()) return Response.json({ error: "Owner access has not been configured." }, { status: 503 });
  let code: unknown;
  try { code = (await request.json()).code; } catch { return Response.json({ error: "Enter your password." }, { status: 400 }); }
  const version = typeof code === "string" ? await validCode(code) : null;
  if (!version) return Response.json({ error: "Incorrect password." }, { status: 401 });
  await setOwnerCookie(version);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
