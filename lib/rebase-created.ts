import type { NotesData } from "./notes";

export type CreatedItem = { kind: "trimester" | "course" | "note"; id: string };

/** Apply a newly created item to a newer workspace snapshot without replacing other changes. */
export function rebaseCreated(latest: NotesData, attempted: NotesData, created: CreatedItem): NotesData | null {
  if (created.kind === "trimester") {
    const item = attempted.trimesters.find(row => row.id === created.id);
    if (!item || latest.trimesters.some(row => row.id === item.id)) return null;
    return { ...latest, trimesters: [...latest.trimesters, item] };
  }
  if (created.kind === "course") {
    const item = attempted.courses.find(row => row.id === created.id);
    if (!item || latest.courses.some(row => row.id === item.id) || !latest.trimesters.some(row => row.id === item.trimesterId)) return null;
    return { ...latest, courses: [...latest.courses, item] };
  }
  const item = attempted.notes.find(row => row.id === created.id);
  if (!item || latest.notes.some(row => row.id === item.id) || !latest.courses.some(row => row.id === item.courseId)) return null;
  return { ...latest, notes: [item, ...latest.notes] };
}
