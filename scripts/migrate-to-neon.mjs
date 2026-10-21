import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";
import { get } from "@vercel/blob";
import { parseNotesData } from "../lib/notes.ts";

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url || !process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Production database and Blob credentials are required.");
const sql = neon(url);

await sql`CREATE TABLE IF NOT EXISTS sami_notes_state (
  id integer PRIMARY KEY CHECK (id = 1),
  data jsonb NOT NULL,
  revision text
)`;

const blob = await get("sami-notes/data.json", { access: "private", useCache: false });
const source = blob?.stream ? parseNotesData(await new Response(blob.stream).json()) : { trimesters: [], courses: [], notes: [] };
const sourceRevision = blob?.blob.etag.replace(/^W\//, "") ?? null;
const existing = await sql`SELECT data, revision FROM sami_notes_state WHERE id = 1`;

if (!existing.length) {
  await sql`INSERT INTO sami_notes_state (id, data, revision)
    VALUES (1, ${JSON.stringify(source)}::jsonb, ${sourceRevision})
    ON CONFLICT (id) DO NOTHING`;
} else if (existing[0].revision !== sourceRevision && /^"[a-f0-9]+"$/.test(existing[0].revision || "")) {
  // The database has not received an app write yet. Refresh a newer Blob snapshot.
  await sql`UPDATE sami_notes_state SET data = ${JSON.stringify(source)}::jsonb, revision = ${sourceRevision}
    WHERE id = 1 AND revision = ${existing[0].revision}`;
}

const rows = await sql`SELECT data, revision FROM sami_notes_state WHERE id = 1`;
if (!rows.length) throw new Error("Migration did not create the workspace row.");
const migrated = parseNotesData(rows[0].data);
if (rows[0].revision === sourceRevision) assert.deepEqual(migrated, source);
console.log(JSON.stringify({
  status: "ready",
  trimesters: migrated.trimesters.length,
  courses: migrated.courses.length,
  notes: migrated.notes.length,
  attachments: migrated.notes.reduce((count, note) => count + note.attachments.length, 0),
  matchesBlobSnapshot: rows[0].revision === sourceRevision,
}));
