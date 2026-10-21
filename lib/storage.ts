import { BlobError, BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { EMPTY_DATA, parseNotesData, type NotesData } from "./notes";

const PATH = "sami-notes/data.json";

export async function loadNotes(): Promise<{ data: NotesData; revision: string | null }> {
  const result = await get(PATH, { access: "private", useCache: false });
  if (!result?.stream) return { data: EMPTY_DATA, revision: null };
  const body = await new Response(result.stream).json();
  return { data: parseNotesData(body), revision: result.blob.etag };
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
    return "saved";
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError || error instanceof BlobError && /already exists/i.test(error.message)) return "conflict";
    throw error;
  }
}
