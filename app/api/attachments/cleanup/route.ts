import { del } from "@vercel/blob";
import { isOwner, sameOrigin } from "@/lib/auth";
import { ATTACHMENT_PATH } from "@/lib/notes";
import { loadNotes } from "@/lib/storage";

export async function POST(request: Request) {
  if (!await isOwner()) return Response.json({ error: "Owner access required." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  let pathnames: unknown;
  try { pathnames = (await request.json()).pathnames; } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (!Array.isArray(pathnames) || pathnames.length > 20 || pathnames.some(path => typeof path !== "string" || !ATTACHMENT_PATH.test(path))) return Response.json({ error: "Invalid paths." }, { status: 400 });
  const { data } = await loadNotes();
  const referenced = new Set(data.notes.flatMap(note => note.attachments.map(file => file.pathname)));
  const unused = pathnames.filter(path => !referenced.has(path));
  if (unused.length) await del(unused);
  return Response.json({ ok: true });
}
