export type Trimester = { id: string; title: string; description: string; createdAt: number };
export type Course = { id: string; trimesterId: string; title: string; code: string; color: string; createdAt: number };
export type Note = { id: string; courseId: string; title: string; content: string; tags: string; sourceUrl: string; pinned: boolean; published: boolean; createdAt: number; updatedAt: number };
export type NotesData = { trimesters: Trimester[]; courses: Course[]; notes: Note[] };

export const EMPTY_DATA: NotesData = { trimesters: [], courses: [], notes: [] };

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid notes data.");
  return value as Record<string, unknown>;
}

function string(value: unknown, max: number, required = false): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new Error("Invalid notes data.");
  return value;
}

function date(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("Invalid notes data.");
  return value;
}

function unique(ids: string[]): void {
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate IDs in notes data.");
}

export function parseNotesData(value: unknown): NotesData {
  const data = object(value);
  if (!Array.isArray(data.trimesters) || !Array.isArray(data.courses) || !Array.isArray(data.notes)) throw new Error("Invalid notes data.");
  if (data.trimesters.length > 100 || data.courses.length > 1000 || data.notes.length > 5000) throw new Error("Too many notes in this backup.");
  const trimesters = data.trimesters.map(value => {
    const row = object(value);
    return { id: string(row.id, 100, true), title: string(row.title, 100, true), description: string(row.description, 300), createdAt: date(row.createdAt) };
  });
  const courses = data.courses.map(value => {
    const row = object(value);
    return { id: string(row.id, 100, true), trimesterId: string(row.trimesterId, 100, true), title: string(row.title, 100, true), code: string(row.code, 30), color: string(row.color, 20), createdAt: date(row.createdAt) };
  });
  const notes = data.notes.map(value => {
    const row = object(value);
    const sourceUrl = string(row.sourceUrl, 2048);
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) throw new Error("Invalid note link.");
    if (typeof row.pinned !== "boolean" || typeof row.published !== "boolean") throw new Error("Invalid notes data.");
    return { id: string(row.id, 100, true), courseId: string(row.courseId, 100, true), title: string(row.title, 150, true), content: string(row.content, 100000), tags: string(row.tags, 300), sourceUrl, pinned: row.pinned, published: row.published, createdAt: date(row.createdAt), updatedAt: date(row.updatedAt) };
  });
  unique(trimesters.map(row => row.id)); unique(courses.map(row => row.id)); unique(notes.map(row => row.id));
  const trimesterIds = new Set(trimesters.map(row => row.id));
  const courseIds = new Set(courses.map(row => row.id));
  if (courses.some(row => !trimesterIds.has(row.trimesterId)) || notes.some(row => !courseIds.has(row.courseId))) throw new Error("Notes or courses are missing a parent.");
  return { trimesters, courses, notes };
}

export function publicNotes(data: NotesData): NotesData {
  const notes = data.notes.filter(note => note.published);
  const courseIds = new Set(notes.map(note => note.courseId));
  const courses = data.courses.filter(course => courseIds.has(course.id));
  const trimesterIds = new Set(courses.map(course => course.trimesterId));
  return { trimesters: data.trimesters.filter(trimester => trimesterIds.has(trimester.id)), courses, notes };
}
