import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, NotebookPen, Sparkles } from "lucide-react";

export default function Home() {
  const startHref = "/notes";
  return (
    <div className="landing-page">
      <header className="landing-nav shell">
        <Link href="/" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Sami<span className="brand-dot">.</span>notes</span></Link>
        <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#about">About</a></nav>
        <a className="nav-button" href="/owner/login">Owner access <ArrowRight size={16}/></a>
      </header>

      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={15}/> A calmer way to study</span>
            <h1>Hello, welcome to <em>Mazharul Islam Sami Notes.</em></h1>
            <p>A little home for what I learn and choose to share. Browse my notes by trimester and course, and find an idea that helps your own studies.</p>
            <div className="hero-actions"><a className="button-primary" href={startHref}>Browse published notes <ArrowRight size={18}/></a><a className="text-link" href="#how-it-works">See how it works <span>↗</span></a></div>
            <div className="hero-footnote"><span className="stacked-icons"><i/><i/><i/></span> Only notes I publish are visible here.</div>
          </div>
          <div className="hero-art" role="img" aria-label="Illustration of an organized study journal">
            <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
            <div className="floating-chip chip-one">✦ &nbsp; Clear mind, clear notes</div>
            <div className="floating-chip chip-two"><span>✓</span> Saved and sorted</div>
            <div className="notebook">
              <div className="notebook-spine"/>
              <div className="notebook-top"><span>THE STUDY JOURNAL</span><span>✳</span></div>
              <div className="notebook-middle"><small>YOUR ACADEMIC SPACE</small><strong>Every idea<br/>has a place.</strong><span className="handdrawn-underline"/></div>
              <div className="notebook-bottom"><span>TRIMESTER 01</span><span>COURSES & NOTES</span></div>
            </div>
            <div className="mini-note"><span className="mini-note-pin">✳</span><span>Remember this.</span><i/><i/><i/></div>
            <span className="art-sparkle sparkle-one">✦</span><span className="art-sparkle sparkle-two">✳</span>
          </div>
        </section>

        <section id="how-it-works" className="how-section"><div className="shell"><div className="section-heading"><span className="eyebrow plain">MADE FOR YOUR JOURNEY</span><h2>From big picture<br/>to the little details.</h2><p>A simple structure that follows the way your studies actually work.</p></div><div className="steps"><div className="step-card"><span className="step-number">01 /</span><div className="step-icon sage"><Layers3 size={25}/></div><h3>Start with a trimester</h3><p>Create a space for each chapter of your academic year.</p></div><div className="step-card"><span className="step-number">02 /</span><div className="step-icon peach"><BookOpen size={25}/></div><h3>Add your courses</h3><p>Give every subject its own tidy place to grow.</p></div><div className="step-card"><span className="step-number">03 /</span><div className="step-icon lavender"><NotebookPen size={25}/></div><h3>Capture your notes</h3><p>Write, search, pin, and revisit what matters most.</p></div></div></div></section>

        <section id="about" className="closing-section shell"><div className="closing-card"><div><span className="eyebrow plain">EXPLORE THE LIBRARY</span><h2>Make room for what<br/>you&apos;re learning.</h2><p>Shared notes, organized by trimester and course.</p></div><a className="button-primary light" href={startHref}>View published notes <ArrowRight size={18}/></a></div></section>
      </main>
      <footer className="landing-footer shell"><span>© {new Date().getFullYear()} Mazharul Islam Sami Notes</span><span>Made for learning, one note at a time.</span></footer>
    </div>
  );
}
