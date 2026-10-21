import { get } from "@vercel/blob";
import { isOwner } from "@/lib/auth";
import { loadNotes } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ noteId: string; attachmentId: string }> }) {
  const { noteId, attachmentId } = await params;
  const { data } = await loadNotes();
  const note = data.notes.find(item => item.id === noteId);
  if (!note || (!note.published && !await isOwner())) return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const file = note.attachments.find(item => item.id === attachmentId);
  if (!file) return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const result = await get(file.pathname, { access: "private" });
  if (!result?.stream) return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const isPdf = file.contentType === "application/pdf";
  const filename = `filename*=UTF-8''${encodeURIComponent(file.name)}`;
  return new Response(result.stream, { headers: {
    "Content-Type": isPdf ? "application/pdf" : "application/octet-stream",
    "Content-Disposition": `${isPdf ? "inline" : "attachment"}; ${filename}`,
    "Content-Length": String(file.size),
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
