import { changeOwnerPassword, isOwner, sameOrigin, setOwnerCookie } from "@/lib/auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (!await isOwner()) return Response.json({ error: "Owner access required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Enter your current and new passwords." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Enter your current and new passwords." }, { status: 400 });
  const { currentPassword, newPassword } = body;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 100) {
    return Response.json({ error: "New password must be 8 to 100 characters." }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) return Response.json({ error: "Database is required to change the password." }, { status: 503 });
  const outcome = await changeOwnerPassword(currentPassword, newPassword);
  if (outcome.status === "incorrect") return Response.json({ error: "Current password is incorrect." }, { status: 401 });
  if (outcome.status === "conflict") return Response.json({ error: "Password changed in another session. Sign in again." }, { status: 409 });
  await setOwnerCookie(outcome.version);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
