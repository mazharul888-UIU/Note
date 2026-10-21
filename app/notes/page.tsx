import { loadNotes } from "@/lib/storage";
import { publicNotes } from "@/lib/notes";
import Viewer from "./viewer";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const { data } = await loadNotes();
  return <Viewer data={publicNotes(data)} />;
}
