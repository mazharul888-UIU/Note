"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Bookmark, Check, ChevronDown, ChevronRight, Download, FileText, FolderOpen, Home, Layers3, Menu, Pencil, Pin, Plus, Search, Trash2, Upload, X } from "lucide-react";

type Trimester = { id: string; title: string; description: string; createdAt: number };
type Course = { id: string; trimesterId: string; title: string; code: string; color: string; createdAt: number };
type Note = { id: string; courseId: string; title: string; content: string; tags: string; sourceUrl: string; pinned: boolean; createdAt: number; updatedAt: number };
type Data = { trimesters: Trimester[]; courses: Course[]; notes: Note[] };
type Kind = "trimester" | "course" | "note";
type Form = { kind: Kind; id?: string; title: string; description: string; trimesterId: string; code: string; color: string; courseId: string; content: string; tags: string; sourceUrl: string; pinned: boolean };
const EMPTY: Data = { trimesters: [], courses: [], notes: [] };
const COLORS = ["sage", "peach", "lavender", "blue"];
const STORAGE_KEY = "sami-notes-v1";

function readBackup(value: unknown): Data {
  if (!value || typeof value !== "object") throw new Error("This is not a Sami Notes backup.");
  const backup = value as Record<string, unknown>;
  if (!Array.isArray(backup.trimesters) || !Array.isArray(backup.courses) || !Array.isArray(backup.notes)) throw new Error("This backup is missing trimesters, courses, or notes.");
  const trimesters = backup.trimesters.map((item: unknown) => {
    const row = item as Record<string, unknown>;
    if (typeof row?.id !== "string" || typeof row?.title !== "string") throw new Error("The backup has an invalid trimester.");
    return { id: row.id, title: row.title, description: typeof row.description === "string" ? row.description : "", createdAt: Number(row.createdAt) || Date.now() };
  });
  const courses = backup.courses.map((item: unknown) => {
    const row = item as Record<string, unknown>;
    if (typeof row?.id !== "string" || typeof row?.trimesterId !== "string" || typeof row?.title !== "string") throw new Error("The backup has an invalid course.");
    return { id: row.id, trimesterId: row.trimesterId, title: row.title, code: typeof row.code === "string" ? row.code : "", color: typeof row.color === "string" ? row.color : "sage", createdAt: Number(row.createdAt) || Date.now() };
  });
  const notes = backup.notes.map((item: unknown) => {
    const row = item as Record<string, unknown>;
    if (typeof row?.id !== "string" || typeof row?.courseId !== "string" || typeof row?.title !== "string") throw new Error("The backup has an invalid note.");
    return { id: row.id, courseId: row.courseId, title: row.title, content: typeof row.content === "string" ? row.content : "", tags: typeof row.tags === "string" ? row.tags : "", sourceUrl: typeof row.sourceUrl === "string" ? row.sourceUrl : "", pinned: row.pinned === true, createdAt: Number(row.createdAt) || Date.now(), updatedAt: Number(row.updatedAt) || Date.now() };
  });
  if (courses.some(course => !trimesters.some(trimester => trimester.id === course.trimesterId)) || notes.some(note => !courses.some(course => course.id === note.courseId))) throw new Error("The backup has notes or courses without a parent.");
  return { trimesters, courses, notes };
}

function formFor(kind: Kind, item?: Trimester | Course | Note, parentId = ""): Form {
  const base: Form = { kind, id: item?.id, title: item?.title || "", description: "", trimesterId: "", code: "", color: "sage", courseId: "", content: "", tags: "", sourceUrl: "", pinned: false };
  if (kind === "trimester") return { ...base, description: (item as Trimester | undefined)?.description || "" };
  if (kind === "course") return { ...base, trimesterId: (item as Course | undefined)?.trimesterId || parentId, code: (item as Course | undefined)?.code || "", color: (item as Course | undefined)?.color || "sage" };
  return { ...base, courseId: (item as Note | undefined)?.courseId || parentId, content: (item as Note | undefined)?.content || "", tags: (item as Note | undefined)?.tags || "", sourceUrl: (item as Note | undefined)?.sourceUrl || "", pinned: (item as Note | undefined)?.pinned || false };
}

export default function Workspace({ displayName }: { displayName: string }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState("home");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const reload = useCallback(async () => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setData(stored ? readBackup(JSON.parse(stored)) : EMPTY);
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not read notes saved in this browser."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 3500); return () => clearTimeout(timer); }, [notice]);

  const currentTrimester = view.startsWith("trim:") ? data.trimesters.find(x => x.id === view.slice(5)) : undefined;
  const currentCourse = view.startsWith("course:") ? data.courses.find(x => x.id === view.slice(7)) : undefined;
  const parentTrimester = currentCourse ? data.trimesters.find(x => x.id === currentCourse.trimesterId) : undefined;
  const filteredNotes = useMemo(() => {
    if (view === "pinned") return data.notes.filter(x => x.pinned);
    if (view === "search") { const needle = query.toLowerCase().trim(); return data.notes.filter(x => [x.title, x.content, x.tags, data.courses.find(c => c.id === x.courseId)?.title || ""].some(s => s.toLowerCase().includes(needle))); }
    if (currentCourse) return data.notes.filter(x => x.courseId === currentCourse.id);
    if (currentTrimester) return data.notes.filter(x => data.courses.some(c => c.id === x.courseId && c.trimesterId === currentTrimester.id));
    return data.notes;
  }, [data, view, query, currentCourse, currentTrimester]);

  function navigate(next: string) { setView(next); setSidebarOpen(false); if (next !== "search") setQuery(""); }
  function openNew(kind: Kind, parentId = "") { setFormError(""); setForm(formFor(kind, undefined, parentId)); }
  function openEdit(kind: Kind, item: Trimester | Course | Note) { setFormError(""); setForm(formFor(kind, item)); }
  function patchForm<K extends keyof Form>(key: K, value: Form[K]) { setForm(current => current ? { ...current, [key]: value } : current); }
  function persist(next: Data) { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setData(next); }

  async function saveForm(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const title = form.title.trim();
      if (!title) throw new Error("Enter a title.");
      const id = form.id || crypto.randomUUID();
      const now = Date.now();
      let next: Data;
      if (form.kind === "trimester") {
        const item: Trimester = { id, title, description: form.description.trim(), createdAt: data.trimesters.find(x => x.id === id)?.createdAt || now };
        next = { ...data, trimesters: form.id ? data.trimesters.map(x => x.id === id ? item : x) : [...data.trimesters, item] };
      } else if (form.kind === "course") {
        if (!data.trimesters.some(x => x.id === form.trimesterId)) throw new Error("Choose a trimester.");
        const item: Course = { id, title, trimesterId: form.trimesterId, code: form.code.trim(), color: form.color, createdAt: data.courses.find(x => x.id === id)?.createdAt || now };
        next = { ...data, courses: form.id ? data.courses.map(x => x.id === id ? item : x) : [...data.courses, item] };
      } else {
        if (!data.courses.some(x => x.id === form.courseId)) throw new Error("Choose a course.");
        let sourceUrl = form.sourceUrl.trim();
        if (sourceUrl) {
          try { const parsed = new URL(sourceUrl); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); sourceUrl = parsed.toString(); }
          catch { throw new Error("Use a valid http or https link."); }
        }
        const item: Note = { id, title, courseId: form.courseId, content: form.content, tags: form.tags.trim(), sourceUrl, pinned: form.pinned, createdAt: data.notes.find(x => x.id === id)?.createdAt || now, updatedAt: now };
        next = { ...data, notes: [item, ...data.notes.filter(x => x.id !== id)] };
      }
      persist(next);
      setForm(null);
      if (!form.id && form.kind === "trimester") navigate(`trim:${id}`);
      if (!form.id && form.kind === "course") navigate(`course:${id}`);
      setNotice(`${form.kind[0].toUpperCase()}${form.kind.slice(1)} saved.`);
    } catch (caught) { setFormError(caught instanceof Error ? caught.message : "Could not save."); }
    finally { setSaving(false); }
  }

  async function remove(kind: Kind, item: Trimester | Course | Note) {
    const detail = kind === "trimester" ? " This will also delete its courses and notes." : kind === "course" ? " This will also delete its notes." : "";
    if (!window.confirm(`Delete ${item.title}?${detail}`)) return;
    try {
      let next: Data;
      if (kind === "trimester") {
        const courseIds = new Set(data.courses.filter(x => x.trimesterId === item.id).map(x => x.id));
        next = { trimesters: data.trimesters.filter(x => x.id !== item.id), courses: data.courses.filter(x => !courseIds.has(x.id)), notes: data.notes.filter(x => !courseIds.has(x.courseId)) };
      } else if (kind === "course") next = { ...data, courses: data.courses.filter(x => x.id !== item.id), notes: data.notes.filter(x => x.courseId !== item.id) };
      else next = { ...data, notes: data.notes.filter(x => x.id !== item.id) };
      persist(next);
      if (form?.id === item.id) setForm(null);
      if (kind === "trimester" && view === `trim:${item.id}`) navigate("home");
      if (kind === "course" && view === `course:${item.id}`) navigate(`trim:${(item as Course).trimesterId}`);
      setNotice(`${kind[0].toUpperCase()}${kind.slice(1)} deleted.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete."); }
  }

  function exportBackup() {
    const backup = { format: "sami-notes-v1", exportedAt: new Date().toISOString(), ...data };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `sami-notes-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Backup downloaded.");
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 4_000_000) throw new Error("This backup is too large for browser storage.");
      const imported = readBackup(JSON.parse(await file.text()));
      if ((data.trimesters.length || data.courses.length || data.notes.length) && !window.confirm("Importing will replace the notes saved in this browser. Continue?")) return;
      persist(imported);
      navigate("home");
      setNotice(`Imported ${imported.notes.length} notes.`);
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not import this backup."); }
  }

  function noteList(notesToShow: Note[], emptyTitle = "No notes yet", emptyText = "Add your first note to keep an idea close.") {
    if (!notesToShow.length) return <div className="empty-list"><div className="empty-icon"><FileText size={24}/></div><h3>{emptyTitle}</h3><p>{emptyText}</p>{currentCourse && <button className="button-primary compact" onClick={() => openNew("note", currentCourse.id)}><Plus size={16}/> Add a note</button>}</div>;
    return <div className="notes-grid">{notesToShow.map(note => {
      const course = data.courses.find(x => x.id === note.courseId);
      const trimester = data.trimesters.find(x => x.id === course?.trimesterId);
      return <button className="note-card" key={note.id} onClick={() => openEdit("note", note)}><span className="note-card-top"><span className="note-icon"><FileText size={18}/></span>{note.pinned && <Pin size={15} className="pinned-icon"/>}</span><strong>{note.title}</strong><span className="note-excerpt">{note.content || "A new note, ready for your thoughts."}</span><span className="note-tags">{note.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 2).map(tag => <i key={tag}>{tag}</i>)}</span><span className="note-card-bottom"><span>{course?.code || course?.title || "Course"}{trimester ? ` · ${trimester.title}` : ""}</span><span>{new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></span></button>;
    })}</div>;
  }

  return <div className="workspace-page">
    <aside className={`workspace-sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-top"><Link href="/" className="brand"><span className="brand-mark"><BookOpen size={19}/></span><span>Sami<span className="brand-dot">.</span>notes</span></Link><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={19}/></button></div>
      <div className="sidebar-scroll"><div className="sidebar-label">WORKSPACE</div><button className={`sidebar-link ${view === "home" ? "active" : ""}`} onClick={() => navigate("home")}><Home size={18}/> Overview</button><button className={`sidebar-link ${view === "all" ? "active" : ""}`} onClick={() => navigate("all")}><FileText size={18}/> All notes <span>{data.notes.length}</span></button><button className={`sidebar-link ${view === "pinned" ? "active" : ""}`} onClick={() => navigate("pinned")}><Bookmark size={18}/> Pinned</button>
      <div className="sidebar-group-heading"><span>TRIMESTERS</span><button className="icon-button tiny" onClick={() => openNew("trimester")} aria-label="Add trimester"><Plus size={17}/></button></div>
      {data.trimesters.map(trimester => <div className="sidebar-trimester" key={trimester.id}><button className={`sidebar-link ${view === `trim:${trimester.id}` ? "active" : ""}`} onClick={() => navigate(`trim:${trimester.id}`)}><Layers3 size={17}/><span className="truncate">{trimester.title}</span><ChevronDown size={14}/></button>{data.courses.filter(c => c.trimesterId === trimester.id).map(course => <button key={course.id} className={`sidebar-course ${view === `course:${course.id}` ? "active" : ""}`} onClick={() => navigate(`course:${course.id}`)}><span className={`course-dot ${course.color}`}/><span className="truncate">{course.title}</span></button>)}</div>)}
      {!data.trimesters.length && !loading && <p className="sidebar-hint">Your trimesters will appear here.</p>}
      </div><div className="sidebar-bottom"><button className="sidebar-link" onClick={exportBackup}><Download size={18}/> Export backup</button><button className="sidebar-link" onClick={() => document.getElementById("backup-file")?.click()}><Upload size={18}/> Import backup</button><input id="backup-file" className="file-input-hidden" type="file" accept="application/json,.json" onChange={importBackup}/><div className="account-card"><span className="avatar">{displayName.charAt(0).toUpperCase()}</span><span><strong>{displayName}</strong><small>Saved in this browser</small></span></div></div>
    </aside>
    {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close menu"/>}
    <div className="workspace-main"><header className="workspace-header"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={21}/></button><div className="header-search"><Search size={18}/><input aria-label="Search notes" placeholder="Search notes, courses, ideas..." value={query} onChange={event => { setQuery(event.target.value); setView(event.target.value ? "search" : "home"); }}/></div><div className="header-actions"><button className="header-export" onClick={exportBackup} title="Download backup"><Download size={18}/></button><button className="button-primary compact" onClick={() => data.courses.length ? openNew("note", currentCourse?.id || data.courses[0].id) : data.trimesters.length ? openNew("course", currentTrimester?.id || data.trimesters[0].id) : openNew("trimester")}><Plus size={18}/> <span>{data.courses.length ? "New note" : data.trimesters.length ? "Add course" : "Add trimester"}</span></button></div></header>
      <main className="workspace-content">
        {error && <div className="alert-message" role="alert"><span>{error}</span><button onClick={() => { setError(""); void reload(); }} aria-label="Dismiss and retry"><X size={16}/></button></div>}
        {notice && <div className="toast-message" role="status"><Check size={17}/>{notice}</div>}
        {loading ? <div className="loading-state">Opening your study space...</div> : <>
          {view === "home" && <><div className="welcome-banner"><div><span className="eyebrow plain">YOUR STUDY SPACE</span><h1>Welcome back, {displayName.split(" ")[0]} <span>&#10022;</span></h1><p>Everything you&apos;re learning, beautifully in order.</p></div><div className="welcome-doodle" aria-hidden="true"><BookOpen size={72} strokeWidth={1.1}/><span>&#10022;</span></div></div><div className="stats-row"><div><Layers3 size={19}/><strong>{data.trimesters.length}</strong><span>Trimesters</span></div><div><FolderOpen size={19}/><strong>{data.courses.length}</strong><span>Courses</span></div><div><FileText size={19}/><strong>{data.notes.length}</strong><span>Notes</span></div></div><div className="content-heading"><div><span className="eyebrow plain">YOUR ORGANIZATION</span><h2>Trimesters</h2></div><button className="soft-button" onClick={() => openNew("trimester")}><Plus size={17}/> Add trimester</button></div>{data.trimesters.length ? <div className="trimester-grid">{data.trimesters.map((trimester, index) => <div className="trimester-card" key={trimester.id}><div className="card-top"><span className="trimester-icon"><Layers3 size={22}/></span><div className="card-actions"><button className="icon-button" onClick={() => openEdit("trimester", trimester)} aria-label={`Edit ${trimester.title}`}><Pencil size={16}/></button><button className="icon-button" onClick={() => remove("trimester", trimester)} aria-label={`Delete ${trimester.title}`}><Trash2 size={16}/></button></div></div><span className="card-index">TRIMESTER {String(index + 1).padStart(2, "0")}</span><h3>{trimester.title}</h3><p>{trimester.description || "A fresh chapter for your courses and ideas."}</p><button className="card-link" onClick={() => navigate(`trim:${trimester.id}`)}>{data.courses.filter(c => c.trimesterId === trimester.id).length} courses <ArrowRight size={17}/></button></div>)}</div> : <div className="empty-feature"><div className="empty-graphic"><Layers3 size={38}/><span>&#10022;</span></div><h3>Start with your first trimester</h3><p>Give this chapter a name, then add courses and notes inside it.</p><button className="button-primary compact" onClick={() => openNew("trimester")}><Plus size={16}/> Create trimester</button></div>}<div className="content-heading recent-heading"><div><span className="eyebrow plain">PICK UP WHERE YOU LEFT OFF</span><h2>Recent notes</h2></div>{data.notes.length > 0 && <button className="text-link small" onClick={() => navigate("all")}>View all <ArrowRight size={16}/></button>}</div>{noteList(data.notes.slice(0, 3), "No notes yet", "Your latest notes will show up here.")}</>}
          {currentTrimester && <><div className="crumbs"><button onClick={() => navigate("home")}>Overview</button><ChevronRight size={14}/><span>{currentTrimester.title}</span></div><div className="view-heading"><div><span className="eyebrow plain">TRIMESTER SPACE</span><h1>{currentTrimester.title}</h1><p>{currentTrimester.description || "All your courses and notes for this trimester."}</p></div><div className="view-actions"><button className="soft-button" onClick={() => openEdit("trimester", currentTrimester)}><Pencil size={16}/> Edit</button><button className="button-primary compact" onClick={() => openNew("course", currentTrimester.id)}><Plus size={17}/> Add course</button></div></div><div className="content-heading"><h2>Courses <span className="heading-count">{data.courses.filter(c => c.trimesterId === currentTrimester.id).length}</span></h2></div>{data.courses.some(c => c.trimesterId === currentTrimester.id) ? <div className="course-grid">{data.courses.filter(c => c.trimesterId === currentTrimester.id).map(course => <div className={`course-card ${course.color}`} key={course.id}><div className="card-top"><span className="course-symbol"><BookOpen size={23}/></span><div className="card-actions"><button className="icon-button" onClick={() => openEdit("course", course)} aria-label={`Edit ${course.title}`}><Pencil size={16}/></button><button className="icon-button" onClick={() => remove("course", course)} aria-label={`Delete ${course.title}`}><Trash2 size={16}/></button></div></div><small>{course.code || "COURSE"}</small><h3>{course.title}</h3><button onClick={() => navigate(`course:${course.id}`)} className="card-link">{data.notes.filter(n => n.courseId === course.id).length} notes <ArrowRight size={17}/></button></div>)}</div> : <div className="empty-feature small"><div className="empty-graphic"><BookOpen size={34}/></div><h3>Add your first course</h3><p>Courses keep related notes together.</p><button className="button-primary compact" onClick={() => openNew("course", currentTrimester.id)}><Plus size={16}/> Add course</button></div>}</>}
          {currentCourse && <><div className="crumbs"><button onClick={() => navigate("home")}>Overview</button><ChevronRight size={14}/><button onClick={() => navigate(`trim:${parentTrimester?.id}`)}>{parentTrimester?.title}</button><ChevronRight size={14}/><span>{currentCourse.title}</span></div><div className="view-heading"><div><span className="eyebrow plain">{currentCourse.code || "COURSE NOTES"}</span><h1>{currentCourse.title}</h1><p>{data.notes.filter(n => n.courseId === currentCourse.id).length} notes in this course</p></div><div className="view-actions"><button className="soft-button" onClick={() => openEdit("course", currentCourse)}><Pencil size={16}/> Edit course</button><button className="button-primary compact" onClick={() => openNew("note", currentCourse.id)}><Plus size={17}/> Add note</button></div></div><div className="content-heading"><h2>Notes <span className="heading-count">{filteredNotes.length}</span></h2></div>{noteList(filteredNotes)}</>}
          {(view === "all" || view === "pinned" || view === "search") && <><div className="view-heading simple"><div><span className="eyebrow plain">YOUR KNOWLEDGE LIBRARY</span><h1>{view === "all" ? "All notes" : view === "pinned" ? "Pinned notes" : "Search results"}</h1><p>{view === "search" ? `Notes matching ${query}` : `${filteredNotes.length} ${filteredNotes.length === 1 ? "note" : "notes"} to explore`}</p></div>{data.courses.length > 0 && <button className="button-primary compact" onClick={() => openNew("note", data.courses[0].id)}><Plus size={17}/> Add note</button>}</div>{noteList(filteredNotes, view === "search" ? "No matching notes" : "No notes here yet", view === "search" ? "Try a different word or course name." : "The notes you add will appear here.")}</>}
        </>}
      </main>
    </div>

    {form && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setForm(null); }}><div className={`editor-modal ${form.kind === "note" ? "note-editor" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><form onSubmit={saveForm}><div className="modal-header"><div><span className="eyebrow plain">{form.id ? "EDIT YOUR" : "CREATE A NEW"} {form.kind.toUpperCase()}</span><h2 id="modal-title">{form.id ? `Edit ${form.kind}` : form.kind === "trimester" ? "New trimester" : form.kind === "course" ? "New course" : "New note"}</h2></div><button type="button" className="icon-button" onClick={() => setForm(null)} aria-label="Close"><X size={20}/></button></div>{formError && <div className="modal-error" role="alert">{formError}</div>}<div className="modal-body">
      <label className="field"><span>{form.kind === "note" ? "Note title" : form.kind === "course" ? "Course name" : "Trimester name"} <b>*</b></span><input autoFocus required maxLength={form.kind === "note" ? 150 : 100} value={form.title} onChange={event => patchForm("title", event.target.value)} placeholder={form.kind === "trimester" ? "e.g. First trimester" : form.kind === "course" ? "e.g. Introduction to Programming" : "Give this note a clear title"}/></label>
      {form.kind === "trimester" && <label className="field"><span>Description <small>optional</small></span><textarea rows={3} maxLength={300} value={form.description} onChange={event => patchForm("description", event.target.value)} placeholder="What will you focus on this trimester?"/></label>}
      {form.kind === "course" && <><label className="field"><span>Trimester <b>*</b></span><select required disabled={!!form.id} value={form.trimesterId} onChange={event => patchForm("trimesterId", event.target.value)}><option value="">Choose a trimester</option>{data.trimesters.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label className="field"><span>Course code <small>optional</small></span><input maxLength={30} value={form.code} onChange={event => patchForm("code", event.target.value)} placeholder="e.g. CSE 101"/></label><div className="field"><span>Choose a color</span><div className="color-options">{COLORS.map(color => <button type="button" key={color} onClick={() => patchForm("color", color)} className={`color-option ${color} ${form.color === color ? "selected" : ""}`} aria-label={`${color} color`}>{form.color === color && <Check size={17}/>}</button>)}</div></div></>}
      {form.kind === "note" && <><label className="field"><span>Course <b>*</b></span><select required value={form.courseId} onChange={event => patchForm("courseId", event.target.value)}><option value="">Choose a course</option>{data.trimesters.map(t => <optgroup key={t.id} label={t.title}>{data.courses.filter(c => c.trimesterId === t.id).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</optgroup>)}</select></label><label className="field"><span>Your note</span><textarea className="note-textarea" rows={12} maxLength={100000} value={form.content} onChange={event => patchForm("content", event.target.value)} placeholder="Start writing your thoughts, summaries, formulas, or reminders..."/></label><div className="field-row"><label className="field"><span>Tags <small>separate with commas</small></span><input maxLength={300} value={form.tags} onChange={event => patchForm("tags", event.target.value)} placeholder="exam, chapter 1"/></label><label className="field"><span>Related link <small>optional</small></span><input type="url" value={form.sourceUrl} onChange={event => patchForm("sourceUrl", event.target.value)} placeholder="https://..."/></label></div><label className="pin-toggle"><input type="checkbox" checked={form.pinned} onChange={event => patchForm("pinned", event.target.checked)}/><Pin size={17}/> Pin this note for quick access</label></>}
    </div><div className="modal-footer">{form.id && <button type="button" className="danger-button" onClick={() => { const item = form.kind === "trimester" ? data.trimesters.find(x => x.id === form.id) : form.kind === "course" ? data.courses.find(x => x.id === form.id) : data.notes.find(x => x.id === form.id); if (item) void remove(form.kind, item); }}><Trash2 size={16}/> Delete</button>}<button type="button" className="soft-button" onClick={() => setForm(null)}>Cancel</button><button className="button-primary compact" disabled={saving} type="submit">{saving ? "Saving..." : form.id ? "Save changes" : `Create ${form.kind}`} <ArrowRight size={16}/></button></div></form></div></div>}
  </div>;
}

