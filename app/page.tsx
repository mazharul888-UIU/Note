import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, FileText, Layers3, LockKeyhole, NotebookPen } from "lucide-react";
import { loadNotes } from "@/lib/storage";
import { publicNotes } from "@/lib/notes";
import LandingMotion from "./landing-motion";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data } = await loadNotes();
  const shared = publicNotes(data);
  const recent = [...shared.notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);

  return <div className="landing-page sami-landing">
    <LandingMotion />
    <div className="scroll-progress" aria-hidden="true" />
    <header className="sami-nav shell">
      <Link href="/" className="brand" aria-label="Sami Notes home"><span className="brand-mark"><BookOpen size={20}/></span><span>Sami<span className="brand-dot">.</span>notes</span></Link>
      <nav aria-label="Main navigation"><a href="#about">About</a><a href="#how-it-works">How it works</a><a href="#shared-notes">Shared notes</a></nav>
      <Link className="sami-owner-link" href="/owner/login"><LockKeyhole size={16}/> Owner access</Link>
    </header>

    <main>
      <section className="sami-hero shell" aria-labelledby="hero-title">
        <div className="sami-hero-copy">
          <span className="sami-kicker"><span className="sami-kicker-dot"/> A PERSONAL STUDY LIBRARY</span>
          <h1 id="hero-title">Hello, welcome to <em>Mazharul Islam Sami Notes.</em></h1>
          <p>I&apos;m Sami. This is where I collect what I learn, organize it by trimester and course, and share the notes that might help you too.</p>
          <div className="sami-hero-actions"><Link href="/notes" className="button-primary">Explore published notes <ArrowRight size={18}/></Link><a href="#about" className="sami-quiet-link">Meet the space <ArrowDown size={16}/></a></div>
          <div className="sami-hero-caption"><span className="sami-caption-line"/> Organized with care. Shared when ready.</div>
        </div>
        <div className="sami-portrait-scene" data-portrait-scene>
          <div className="sami-portrait-disc" aria-hidden="true"/>
          <div className="sami-portrait-rings" aria-hidden="true"/>
          <div className="sami-portrait-image"><Image src="/sami-cartoon.png" alt="Cartoon portrait of Mazharul Islam Sami" width={1106} height={1422} priority sizes="(max-width: 780px) 80vw, 45vw" /></div>
          <div className="sami-float-label sami-float-one"><span>01</span> Trimesters</div>
          <div className="sami-float-label sami-float-two"><BookOpen size={17}/> Courses</div>
          <div className="sami-float-label sami-float-three"><FileText size={17}/> Notes to share</div>
          <div className="sami-portrait-name"><span>MAZHARUL ISLAM SAMI</span><strong>Keep learning, keep sharing.</strong></div>
        </div>
      </section>

      <div className="sami-flow-strip" aria-label="How the notes are organized"><div className="shell"><span><b>01</b> Study</span><i/><span><b>02</b> Organize</span><i/><span><b>03</b> Share</span></div></div>

      <section id="about" className="sami-about shell reveal-on-scroll">
        <div className="sami-section-intro"><span className="sami-overline">A NOTE FROM SAMI</span><h2>Everything has its place.<br/><em>Good ideas travel further.</em></h2></div>
        <div className="sami-about-copy"><p>One trimester leads to the next. Every course brings a new set of ideas. I built this space to keep those ideas easy to revisit, and to share the ones I&apos;m ready to publish.</p><Link href="/notes" className="sami-inline-link">Step inside the library <ArrowRight size={17}/></Link></div>
      </section>

      <section id="how-it-works" className="sami-structure"><div className="shell"><div className="sami-section-heading reveal-on-scroll"><div><span className="sami-overline">SIMPLE BY DESIGN</span><h2>Find your way through.</h2></div><p>From the big picture to a single useful detail, each note has a clear home.</p></div><div className="sami-steps"><div className="sami-step reveal-on-scroll"><span className="sami-step-num">01 /</span><div className="sami-step-icon sage"><Layers3 size={27}/></div><h3>Choose a trimester</h3><p>Start with the chapter of the academic journey you&apos;re exploring.</p><span className="sami-step-line"/></div><div className="sami-step reveal-on-scroll"><span className="sami-step-num">02 /</span><div className="sami-step-icon peach"><BookOpen size={27}/></div><h3>Open a course</h3><p>Find related topics together, organized one subject at a time.</p><span className="sami-step-line"/></div><div className="sami-step reveal-on-scroll"><span className="sami-step-num">03 /</span><div className="sami-step-icon blue"><NotebookPen size={27}/></div><h3>Read a shared note</h3><p>Explore summaries and ideas I&apos;ve chosen to make public.</p><span className="sami-step-line"/></div></div></div></section>

      <section id="shared-notes" className="sami-featured shell"><div className="sami-section-heading reveal-on-scroll"><div><span className="sami-overline">FROM MY DESK</span><h2>Recently shared.</h2></div><Link href="/notes" className="sami-inline-link">All published notes <ArrowRight size={17}/></Link></div>{recent.length ? <div className="sami-featured-grid">{recent.map((note, index) => { const course = shared.courses.find(item => item.id === note.courseId); const trimester = shared.trimesters.find(item => item.id === course?.trimesterId); return <Link href={`/notes?note=${encodeURIComponent(note.id)}`} className="sami-featured-card reveal-on-scroll" key={note.id}><span className="sami-featured-index">{String(index + 1).padStart(2, "0")} / NOTE</span><span className="sami-featured-icon"><FileText size={21}/></span><strong>{note.title}</strong><p>{note.content || "Open this note to read more."}</p><span className="sami-featured-bottom"><span>{course?.title || "Course"}{trimester ? ` · ${trimester.title}` : ""}</span><ArrowRight size={18}/></span></Link>; })}</div> : <div className="sami-coming-soon reveal-on-scroll"><div className="sami-coming-icon"><NotebookPen size={32}/></div><div><span className="sami-overline">THE FIRST PAGE</span><h3>Shared notes are on their way.</h3><p>Once I publish a note, it will appear here and in the public library.</p></div><Link href="/notes" className="button-primary compact">Open library <ArrowRight size={16}/></Link></div>}</section>

      <section className="sami-closing shell reveal-on-scroll"><div className="sami-closing-text"><span className="sami-overline">KEEP CURIOSITY CLOSE</span><h2>One good note can<br/>open a new idea.</h2><p>Take a look at what I&apos;ve shared so far.</p></div><Link href="/notes" className="button-primary light">Browse the notes <ArrowRight size={18}/></Link><span className="sami-closing-circle" aria-hidden="true"/></section>
    </main>
    <footer className="sami-footer shell"><span>© {new Date().getFullYear()} Mazharul Islam Sami Notes</span><span>Made for learning, one note at a time.</span></footer>
  </div>;
}
