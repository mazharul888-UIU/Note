import test from "node:test";
import assert from "node:assert/strict";
import { rebaseCreated } from "../lib/rebase-created.ts";

const trimester = { id: "t1", title: "Ninth", description: "", createdAt: 1 };
const course = id => ({ id, trimesterId: "t1", title: id, code: "", color: "sage", createdAt: 1 });

test("a new course is saved with changes from another tab", () => {
  const attempted = { trimesters: [trimester], courses: [course("old"), course("mine")], notes: [] };
  const latest = { trimesters: [trimester], courses: [course("old"), course("other")], notes: [] };
  const merged = rebaseCreated(latest, attempted, { kind: "course", id: "mine" });
  assert.deepEqual(merged.courses.map(row => row.id), ["old", "other", "mine"]);
  assert.deepEqual(latest.courses.map(row => row.id), ["old", "other"]);
});

test("a new course is not retried if its trimester was removed", () => {
  const attempted = { trimesters: [trimester], courses: [course("mine")], notes: [] };
  const latest = { trimesters: [], courses: [], notes: [] };
  assert.equal(rebaseCreated(latest, attempted, { kind: "course", id: "mine" }), null);
});
