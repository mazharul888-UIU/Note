import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { BlobError, BlobPreconditionFailedError, del, get, put } from "@vercel/blob";
import { EMPTY_DATA, parseNotesData, type NotesData } from "./notes";

const PATH = "sami-notes/data.json";
type State = { data: NotesData; revision: string | null };
let databaseReady: Promise<void> | undefined;

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database is not configured.");
  return neon(url);
}

async function loadBlobNotes(): Promise<State> {
  const result = await get(PATH, { access: "private", useCache: false });
  if (!result?.stream) return { data: EMPTY_DATA, revision: null };
  const body = await new Response(result.stream).json();
  // Private Blob GET can return a weak HTTP ETag, while conditional writes
  // require the strong ETag for the same object.
  return { data: parseNotesData(body), revision: result.blob.etag.replace(/^W\//, "") };
}

async function ensureDatabase(): Promise<void> {
  if (!databaseReady) databaseReady = (async () => {
    const sql = database();
    await sql`CREATE TABLE IF NOT EXISTS sami_notes_state (
      id integer PRIMARY KEY CHECK (id = 1),
      data jsonb NOT NULL,
      revision text
    )`;
    const existing = await sql`SELECT id FROM sami_notes_state WHERE id = 1`;
    if (!existing.length) {
      const legacy = await loadBlobNotes();
      await sql`INSERT INTO sami_notes_state (id, data, revision)
        VALUES (1, ${JSON.stringify(legacy.data)}::jsonb, ${legacy.revision})
        ON CONFLICT (id) DO NOTHING`;
    }
  })().catch(error => { databaseReady = undefined; throw error; });
  return databaseReady;
}

async function loadDatabaseNotes(): Promise<State> {
  await ensureDatabase();
  const rows = await database()`SELECT data, revision FROM sami_notes_state WHERE id = 1`;
  const row = rows[0];
  if (!row) throw new Error("Notes database is not initialized.");
  return { data: parseNotesData(row.data), revision: row.revision };
}

export async function loadNotes(): Promise<State> {
  return process.env.DATABASE_URL ? loadDatabaseNotes() : loadBlobNotes();
}

async function deleteRemovedFiles(previous: NotesData, next: NotesData): Promise<void> {
  const retained = new Set(next.notes.flatMap(note => note.attachments.map(file => file.pathname)));
  const removed = previous.notes.flatMap(note => note.attachments.map(file => file.pathname)).filter(pathname => !retained.has(pathname));
  if (removed.length) {
    try { await del(removed); }
    catch (error) { console.error("Could not delete removed note attachments", error); }
  }
}

export async function saveNotes(data: NotesData, revision: string | null): Promise<"saved" | "conflict"> {
  const current = await loadNotes();
  // Tabs opened before the strong ETag fix may still submit a weak revision.
  const strongRevision = revision?.replace(/^W\//, "") ?? null;
  if (current.revision !== strongRevision) return "conflict";
  if (process.env.DATABASE_URL) {
    const nextRevision = randomUUID();
    const rows = await database()`UPDATE sami_notes_state
      SET data = ${JSON.stringify(data)}::jsonb, revision = ${nextRevision}
      WHERE id = 1 AND revision IS NOT DISTINCT FROM ${strongRevision}
      RETURNING revision`;
    if (!rows.length) return "conflict";
    await deleteRemovedFiles(current.data, data);
    return "saved";
  }
  try {
    await put(PATH, JSON.stringify(data), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: strongRevision !== null,
      ...(strongRevision ? { ifMatch: strongRevision } : {}),
    });
    await deleteRemovedFiles(current.data, data);
    return "saved";
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError || error instanceof BlobError && /already exists/i.test(error.message)) return "conflict";
    throw error;
  }
}
