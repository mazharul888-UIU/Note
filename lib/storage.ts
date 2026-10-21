import { BlobError, BlobPreconditionFailedError, del, get, put } from "@vercel/blob";
import { EMPTY_DATA, parseNotesData, type NotesData } from "./notes";

const PATH = "sami-notes/data.json";

export async function loadNotes(): Promise<{ data: NotesData; revision: string | null }> {
  const result = await get(PATH, { access: "private", useCache: false });
  if (!result?.stream) return { data: EMPTY_DATA, revision: null };
  const body = await new Response(result.stream).json();
  // Private Blob GET can return a weak HTTP ETag, while conditional writes
  // require the strong ETag for the same object.
  return { data: parseNotesData(body), revision: result.blob.etag.replace(/^W\//, "") };
}

export async function saveNotes(data: NotesData, revision: string | null): Promise<"saved" | "conflict"> {
  const current = await loadNotes();
  if (current.revision !== revision) return "conflict";
  try {
    await put(PATH, JSON.stringify(data), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: revision !== null,
      ...(revision ? { ifMatch: revision } : {}),
    });
    const retained = new Set(data.notes.flatMap(note => note.attachments.map(file => file.pathname)));
    const removed = current.data.notes.flatMap(note => note.attachments.map(file => file.pathname)).filter(pathname => !retained.has(pathname));
    if (removed.length) {
      try { await del(removed); }
      catch (error) { console.error("Could not delete removed note attachments", error); }
    }
    return "saved";
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError || error instanceof BlobError && /already exists/i.test(error.message)) return "conflict";
    throw error;
  }
}
