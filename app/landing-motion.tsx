"use client";

import { useEffect } from "react";

export default function LandingMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const landing = document.querySelector<HTMLElement>(".sami-landing");
    const onScroll = () => {
      const distance = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--landing-scroll", `${distance > 0 ? window.scrollY / distance * 100 : 0}%`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal-on-scroll").forEach(element => observer.observe(element));
    landing?.classList.add("motion-ready");

    const scene = document.querySelector<HTMLElement>("[data-portrait-scene]");
    const onPointerMove = (event: PointerEvent) => {
      if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const bounds = scene.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      scene.style.setProperty("--pointer-x", `${x * 14}px`);
      scene.style.setProperty("--pointer-y", `${y * 14}px`);
    };
    const onPointerLeave = () => { scene?.style.setProperty("--pointer-x", "0px"); scene?.style.setProperty("--pointer-y", "0px"); };
    scene?.addEventListener("pointermove", onPointerMove);
    scene?.addEventListener("pointerleave", onPointerLeave);
    return () => { window.removeEventListener("scroll", onScroll); observer.disconnect(); landing?.classList.remove("motion-ready"); scene?.removeEventListener("pointermove", onPointerMove); scene?.removeEventListener("pointerleave", onPointerLeave); };
  }, []);
  return null;
}
