import test from "node:test";
import assert from "node:assert/strict";
import { parseNotesData, publicNotes } from "../lib/notes.ts";

const sample = {
  trimesters: [
    { id: "t1", title: "First", description: "Shared", createdAt: 1 },
    { id: "t2", title: "Private trimester", description: "Private", createdAt: 1 },
  ],
  courses: [
    { id: "c1", trimesterId: "t1", title: "Public course", code: "CSE", color: "sage", createdAt: 1 },
    { id: "c2", trimesterId: "t2", title: "Private course", code: "HIDE", color: "peach", createdAt: 1 },
  ],
  notes: [
    { id: "n1", courseId: "c1", title: "Shared note", content: "Readable", tags: "topic", sourceUrl: "", pinned: false, published: true, createdAt: 1, updatedAt: 1 },
    { id: "n2", courseId: "c2", title: "Secret note", content: "Private text", tags: "secret", sourceUrl: "", pinned: false, published: false, createdAt: 1, updatedAt: 1 },
  ],
};

test("public projection includes only published notes and their parent folders", () => {
  const result = publicNotes(parseNotesData(sample));
  assert.deepEqual(result.notes.map(row => row.id), ["n1"]);
  assert.deepEqual(result.courses.map(row => row.id), ["c1"]);
  assert.deepEqual(result.trimesters.map(row => row.id), ["t1"]);
  assert.doesNotMatch(JSON.stringify(result), /Secret note|Private text|Private course|Private trimester/);
});

test("publishing and hiding change the public projection", () => {
  const hidden = structuredClone(sample);
  hidden.notes[0].published = false;
  assert.equal(publicNotes(parseNotesData(hidden)).notes.length, 0);
  hidden.notes[0].published = true;
  assert.equal(publicNotes(parseNotesData(hidden)).notes.length, 1);
});

test("invalid hierarchy and visibility values are rejected", () => {
  const invalid = structuredClone(sample);
  invalid.notes[0].courseId = "missing";
  assert.throws(() => parseNotesData(invalid));
  invalid.notes[0].courseId = "c1";
  delete invalid.notes[0].published;
  assert.throws(() => parseNotesData(invalid));
});
