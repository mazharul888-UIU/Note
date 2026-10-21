import { isOwner, sameOrigin } from "@/lib/auth";
import { parseNotesData } from "@/lib/notes";
import { loadNotes, saveNotes } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await isOwner()) return Response.json({ error: "Owner access required." }, { status: 401 });
  const state = await loadNotes();
  return Response.json(state, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request) {
  if (!await isOwner()) return Response.json({ error: "Owner access required." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 4_000_000) return Response.json({ error: "Notes data is too large." }, { status: 413 });
  try {
    const body = await request.json();
    const data = parseNotesData(body.data);
    const revision = body.revision;
    if (revision !== null && typeof revision !== "string") throw new Error("Invalid data revision.");
    const result = await saveNotes(data, revision);
    if (result === "conflict") return Response.json({ error: "These notes changed in another tab. Reload before saving." }, { status: 409 });
    return Response.json(await loadNotes(), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error && /Invalid|Too many|missing a parent|Duplicate/.test(error.message)) return Response.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
