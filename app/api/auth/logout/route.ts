import { clearOwnerCookie, sameOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  await clearOwnerCookie();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
