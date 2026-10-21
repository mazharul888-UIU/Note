"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Eye, LockKeyhole } from "lucide-react";

export default function OwnerLogin() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      window.location.assign("/workspace");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not sign in."); setBusy(false); }
  }

  return <main className="access-page"><div className="access-card"><Link href="/" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>Sami<span className="brand-dot">.</span>notes</span></Link><span className="access-icon"><LockKeyhole size={26}/></span><span className="eyebrow plain">PRIVATE WORKSPACE</span><h1>Welcome back, Sami.</h1><p>Enter your secret code to manage trimesters, courses, and notes. Only published notes appear to visitors.</p><form onSubmit={login}><label className="field"><span>Secret code</span><input type="password" autoComplete="current-password" required maxLength={100} value={code} onChange={event => setCode(event.target.value)} placeholder="Enter your code"/></label>{error && <div className="modal-error" role="alert">{error}</div>}<button className="button-primary access-submit" disabled={busy} type="submit">{busy ? "Opening..." : "Open my workspace"}<ArrowRight size={17}/></button></form><Link className="access-public-link" href="/notes"><Eye size={17}/> Browse published notes</Link></div></main>;
}
