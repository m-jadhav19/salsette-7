"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Linearly interpolates between evenly-spaced hex colour stops at t ∈ [0,1].
 */
function sampleGradient(stops: string[], t: number): string {
  const clamped  = Math.max(0, Math.min(1, t));
  const segments = stops.length - 1;
  const scaled   = clamped * segments;
  const idx      = Math.min(Math.floor(scaled), segments - 1);
  const frac     = scaled - idx;

  const parse = (hex: string): [number, number, number] | null => {
    const c = hex.replace("#", "");
    if (c.length !== 6) return null;
    return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
  };

  const a = parse(stops[idx]);
  const b = parse(stops[idx + 1]);
  if (!a || !b) return stops[idx] ?? "#ffffff";
  return `rgb(${Math.round(a[0]+(b[0]-a[0])*frac)},${Math.round(a[1]+(b[1]-a[1])*frac)},${Math.round(a[2]+(b[2]-a[2])*frac)})`;
}

/**
 * Splits element text into per-character <span class="char"> nodes.
 * Spaces become char--space spans to preserve natural word spacing.
 *
 * When gradientStops is provided each char receives a background-clip
 * gradient slice sampled from its proportional position across the word,
 * faithfully reconstructing the original multi-colour gradient after splitting.
 */
function splitIntoChars(el: HTMLElement, gradientStops?: string[]) {
  const text = el.innerText;
  el.setAttribute("aria-label", text);
  el.innerHTML = text
    .split("")
    .map((ch) =>
      ch === " "
        ? `<span class="char char--space">&#32;</span>`
        : `<span class="char">${ch}</span>`
    )
    .join("");

  const chars = Array.from(el.querySelectorAll<HTMLElement>(".char:not(.char--space)"));

  if (gradientStops && gradientStops.length >= 2) {
    const total = chars.length;
    chars.forEach((span, i) => {
      const centre = total === 1 ? 0.5 : i / (total - 1);
      const half  = 0.8 / Math.max(total - 1, 1);
      const colA  = sampleGradient(gradientStops, centre - half * 0.5);
      const colB  = sampleGradient(gradientStops, centre + half * 0.5);

      span.style.background           = `linear-gradient(175deg, ${colA} 0%, ${colB} 100%)`;
      span.style.webkitBackgroundClip = "text";
      span.style.backgroundClip       = "text";
      span.style.webkitTextFillColor  = "transparent";
    });
  }

  return chars;
}

export default function Hero() {
  const heroRef      = useRef<HTMLElement | null>(null);
  const scrollCueRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const salsette    = heroRef.current!.querySelector<HTMLElement>(".salsette")!;
      const seven       = heroRef.current!.querySelector<HTMLElement>(".seven")!;
      const sweepEl     = heroRef.current!.querySelector<HTMLElement>(".light-sweep")!;
      const sweepGlowEl = heroRef.current!.querySelector<HTMLElement>(".light-sweep-glow")!;
      const tagLines    = heroRef.current!.querySelectorAll<HTMLElement>(".tagline-line");

      const SALSETTE_GRADIENT = ["#ffffff", "#faf6ed", "#c4a24e", "#d4b86a", "#e8dcc2"];
      const salChars  = splitIntoChars(salsette, SALSETTE_GRADIENT);
      const tagGroups = Array.from(tagLines).map((el) => splitIntoChars(el));

      gsap.set(salsette, { x: "28vw" });
      gsap.set(salChars, { opacity: 0, filter: "blur(20px)" });
      tagGroups.forEach((chars) =>
        gsap.set(chars, { opacity: 0, filter: "blur(12px)", y: 10 })
      );
      gsap.set(sweepEl,     { left: "-60%", opacity: 0 });
      gsap.set(sweepGlowEl, { left: "-80%", opacity: 0 });

      const tl = gsap.timeline();

      tl.fromTo(
        seven,
        {
          opacity: 0,
          filter: "blur(32px) drop-shadow(0 0 0px rgba(196,162,78,0))",
        },
        {
          opacity: 1,
          filter: "blur(0px) drop-shadow(0 0 0px rgba(196,162,78,0))",
          duration: 1.1,
          ease: "power2.out",
          keyframes: [
            {
              filter: "blur(18px) drop-shadow(0 0 48px rgba(196,162,78,0.45))",
              opacity: 0.6,
              duration: 0.44,
              ease: "power1.in",
            },
            {
              filter: "blur(0px) drop-shadow(0 0 0px rgba(196,162,78,0))",
              opacity: 1,
              duration: 0.66,
              ease: "power3.out",
            },
          ],
        }
      )
      .to(seven, { scaleY: 0.96, scaleX: 1.02, duration: 0.12, ease: "power2.in"         }, "-=0.04")
      .to(seven, { scaleY: 1,    scaleX: 1,    duration: 0.4,  ease: "elastic.out(1,0.5)" })
      .to(salsette, { x: 0, duration: 0.65, ease: "expo.out" }, "-=0.35")
      .to(
        salChars,
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.28,
          stagger: { amount: 0.24, from: "start", ease: "sine.inOut" },
          ease: "power2.out",
        },
        "-=0.4"
      )
      .set(sweepEl, { opacity: 1 })
      .to(sweepEl, { left: "160%", duration: 0.5, ease: "power2.in" }, "+=0.04")
      .to(sweepEl, { opacity: 0, duration: 0.12, ease: "none" }, "-=0.12")
      .set(sweepGlowEl, { left: "-80%", opacity: 0 }, "<-0.45")
      .to(sweepGlowEl, { left: "180%", opacity: 0.6, duration: 0.75, ease: "power1.out" }, "<")
      .to(sweepGlowEl, { opacity: 0, duration: 0.28, ease: "power2.in" }, "-=0.28")
      .to(
        tagGroups[0],
        {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.28,
          stagger: { amount: 0.22, from: "start", ease: "sine.inOut" },
          ease: "power2.out",
        },
        "-=0.35"
      )
      .to(
        tagGroups[1],
        {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.28,
          stagger: { amount: 0.24, from: "start", ease: "sine.inOut" },
          ease: "power2.out",
        },
        "-=0.2"
      )
      .fromTo(
        ".cta a, .cta button",
        { y: 20, opacity: 0, filter: "blur(6px)" },
        {
          y: 0, opacity: 1, filter: "blur(0px)",
          stagger: 0.09, duration: 0.42, ease: "power3.out",
        },
        "-=0.2"
      )
      .to(
        scrollCueRef.current,
        { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" },
        "-=0.08"
      );

      heroRef.current!
        .querySelectorAll<HTMLElement>(".cta a, .cta button")
        .forEach((btn) => {
          const onMove = (e: MouseEvent) => {
            const r = btn.getBoundingClientRect();
            gsap.to(btn, {
              x: (e.clientX - (r.left + r.width  / 2)) * 0.28,
              y: (e.clientY - (r.top  + r.height / 2)) * 0.28,
              duration: 0.38,
              ease: "power2.out",
              overwrite: true,
            });
          };
          const onLeave = () =>
            gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: "elastic.out(1,0.5)" });

          btn.addEventListener("mousemove",  onMove,   { passive: true });
          btn.addEventListener("mouseleave", onLeave);
        });

      const titleGroup = heroRef.current!.querySelector<HTMLElement>(".title-group")!;
      const bgPhoto    = heroRef.current!.querySelector<HTMLElement>(".hero-bg-photo");
      const bgVignette = heroRef.current!.querySelector<HTMLElement>(".hero-bg-vignette");
      const pref = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tiltStr = pref ? 0 : Math.min(18, 9 + window.innerWidth / 110);
      let rafId = 0;

      const onTiltMove = (e: MouseEvent) => {
        const nx = e.clientX / window.innerWidth  - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        const tx = nx *  tiltStr;
        const ty = ny * -tiltStr;
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          gsap.to(titleGroup, {
            rotateY: tx, rotateX: ty,
            duration: 0.65, ease: "power2.out", overwrite: true,
          });
          if (bgPhoto) {
            gsap.to(bgPhoto, {
              x: -nx * 26,
              y: -ny * 14,
              duration: 1.0,
              ease: "power2.out",
              overwrite: true,
            });
          }
          if (bgVignette) {
            gsap.to(bgVignette, {
              x: -nx * 18,
              y: -ny * 10,
              duration: 1.0,
              ease: "power2.out",
              overwrite: true,
            });
          }
        });
      };
      const onTiltLeave = () =>
        gsap.to(
          [titleGroup, bgPhoto, bgVignette].filter(Boolean) as HTMLElement[],
          {
            rotateY: 0,
            rotateX: 0,
            x: 0,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
          }
        );

      heroRef.current!.addEventListener("mousemove",  onTiltMove,  { passive: true });
      heroRef.current!.addEventListener("mouseleave", onTiltLeave);

      return () => {
        heroRef.current?.removeEventListener("mousemove",  onTiltMove);
        heroRef.current?.removeEventListener("mouseleave", onTiltLeave);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="hero scroll-panel section">
      <div className="section-content">
        <div className="section-inner">
          <div className="hero-bg-photo" />
          <div className="hero-bg-vignette" />
          <div className="hero-bg-grain" />

          <div className="depth-layer" />
          <div className="bg-glow" />

          <div className="hero-content">
            <div className="title-wrapper">
              <div className="title-group">
                <h1 className="salsette">SALSETTE</h1>
                <h1 className="seven">7</h1>
                <div className="light-sweep" />
                <div className="light-sweep-glow" />
              </div>
            </div>

            <p className="tagline">
              <span className="tagline-clip">
                <span className="tagline-line">Seven Mumbai kids. Since 2025.</span>
              </span>
              <span className="tagline-clip">
                <span className="tagline-line">
                  Rock, jazz, blues and controlled&nbsp;chaos.
                </span>
              </span>
            </p>

            <div className="cta-group">
              <div className="cta">
                <a href="#contact">
                  BOOK US
                  <svg className="cta-arrow" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              <div className="cta">
                <a href="#band">
                  MEET THE BAND
                  <svg className="cta-arrow" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="grain" />
        </div>
      </div>

      <div
        ref={scrollCueRef}
        className="scroll-cue"
        style={{ opacity: 0, transform: "translateY(10px)" }}
      >
        <span className="scroll-cue-text">Scroll</span>
        <span className="scroll-cue-line" />
      </div>
    </section>
  );
}
