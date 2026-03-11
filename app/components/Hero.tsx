"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { mark, log, logMeasure, logSlow, sampleLog, measure } from "../utils/perf";

const HERO_BG_VIDEO = "/group/group.MOV";

export default function Hero() {
  const heroRef      = useRef<HTMLElement | null>(null);
  const scrollCueRef = useRef<HTMLDivElement | null>(null);
  const videoRef    = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    mark("hero-mount");
    log("Hero: mount start");
    if (!heroRef.current) return;

    const root = heroRef.current!;
    const splash = document.querySelector<HTMLElement>(".hero-splash");
    if (!splash) return;

    const ctx = gsap.context(() => {
      // ── Query elements (splash lives in layout; hero content in root) ───────
      const sevenTop    = splash.querySelector<HTMLElement>(".hero-splash-seven-top");
      const sevenBot    = splash.querySelector<HTMLElement>(".hero-splash-seven-bot");
      const splitLine   = splash.querySelector<HTMLElement>(".hero-splash-split-line");
      const splashSub   = splash.querySelector<HTMLElement>(".hero-splash-sub");
      const heroEyebrow = root.querySelector<HTMLElement>(".hero-eyebrow");
      const tagline     = root.querySelector<HTMLElement>(".tagline");
      const ctas        = root.querySelector<HTMLElement>(".cta-group");
      const scrollCue   = scrollCueRef.current;

      const heroReveal = [heroEyebrow, tagline, ctas, scrollCue].filter(Boolean) as HTMLElement[];
      if (heroReveal.length) {
        gsap.set(heroReveal, { opacity: 0, y: 8 });
      }
      if (sevenTop && sevenBot) gsap.set([sevenTop, sevenBot], { x: 0, y: 0 });
      if (splitLine) gsap.set(splitLine, { opacity: 0, scaleX: 0 });
      if (splashSub) gsap.set(splashSub, { opacity: 0, y: 6 });

      // ── Master timeline ───────────────────────────────────────────────────
      mark("hero-timeline-start");
      const tl = gsap.timeline({
        onComplete: () => {
          mark("hero-timeline-complete");
          const ms = logMeasure("hero-timeline", "hero-timeline-start", "hero-timeline-complete");
          if (ms > 0) log("Hero: splash + reveal complete");
        },
      });

      const hasSevenSplit = sevenTop && sevenBot && splitLine;
      if (hasSevenSplit && splashSub) {
        tl.to({}, { duration: 0.9 })
          .to(splashSub, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.1")
          .to({}, { duration: 0.55 })
          .to(splitLine, { opacity: 1, scaleX: 1, duration: 0.18, ease: "power4.out" })
          .to(splitLine, { opacity: 0, duration: 0.12, ease: "none" }, "+=0.06")
          .to(sevenTop, { x: "-42vw", y: "-55vh", rotation: -8, duration: 0.72, ease: "power4.in" }, "-=0.04")
          .to(sevenBot, { x: "44vw", y: "58vh", rotation: 9, duration: 0.72, ease: "power4.in" }, "<")
          .to(splashSub, { opacity: 0, duration: 0.22, ease: "none" }, "<");
      } else if (splashSub) {
        tl.to({}, { duration: 0.9 })
          .to(splashSub, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.1")
          .to({}, { duration: 0.8 })
          .to(splashSub, { opacity: 0, duration: 0.22, ease: "none" });
      }

      tl.fromTo(splash, { filter: "brightness(1)" }, { filter: "brightness(3)", duration: 0.08, ease: "none" }, hasSevenSplit ? "<+0.3" : undefined)
        .to(splash, { filter: "brightness(1)", duration: 0.1, ease: "none" })
        .to(splash, {
          opacity: 0,
          duration: 0.35,
          ease: "power2.out",
          onComplete: () => splash.classList.add("hero-splash-hidden"),
        }, "-=0.1");
      if (heroReveal.length) {
        tl.to(heroReveal, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, "<+0.1");
      }

      // ── Magnetic CTA hover (rAF-throttled to avoid lag during scroll/hover) ─
      let ctaRafId = 0;
      root.querySelectorAll<HTMLElement>(".cta a, .cta button").forEach((btn) => {
        const onMove = (e: MouseEvent) => {
          if (ctaRafId) return;
          ctaRafId = requestAnimationFrame(() => {
            ctaRafId = 0;
            const r = btn.getBoundingClientRect();
            gsap.to(btn, {
              x: (e.clientX - (r.left + r.width  / 2)) * 0.25,
              y: (e.clientY - (r.top  + r.height / 2)) * 0.25,
              duration: 0.38,
              ease: "power2.out",
              overwrite: true,
              force3D: true,
            });
          });
        };
        const onLeave = () =>
          gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: "elastic.out(1,0.5)" });

        btn.addEventListener("mousemove",  onMove,   { passive: true });
        btn.addEventListener("mouseleave", onLeave);
      });

      // ── 3D tilt on mouse move (time-throttled to reduce work during scroll) ──
      const bgPhotos   = root.querySelectorAll<HTMLElement>(".hero-bg-photo, .hero-bg-video-el");
      const bgVignette = root.querySelector<HTMLElement>(".hero-bg-vignette");
      let   rafId      = 0;
      let   lastTiltAt = 0;
      const TILT_THROTTLE_MS = 48;

      const parallaxSample = sampleLog("Hero parallax", 90);
      const onTiltMove = (e: MouseEvent) => {
        const nx = e.clientX / window.innerWidth  - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          const now = performance.now();
          if (now - lastTiltAt < TILT_THROTTLE_MS) return;
          lastTiltAt = now;
          parallaxSample();
          const t0 = performance.now();
          const els = [...bgPhotos, bgVignette].filter(Boolean);
          els.forEach((el) => {
            if (!el) return;
            gsap.to(el, {
              x: -nx * 24,
              y: -ny * 12,
              duration: 1.0,
              ease: "power2.out",
              overwrite: true,
              force3D: true,
            });
          });
          const tiltMs = performance.now() - t0;
          logSlow("Hero parallax GSAP", tiltMs);
        });
      };

      const onTiltLeave = () =>
        gsap.to(
          [...bgPhotos, bgVignette].filter(Boolean) as HTMLElement[],
          { x: 0, y: 0, duration: 0.9, ease: "power2.out", force3D: true }
        );

      root.addEventListener("mousemove",  onTiltMove,  { passive: true });
      root.addEventListener("mouseleave", onTiltLeave);

      // ── Cleanup — pause instead of revert so CTAs stay visible ───────────
      return () => {
        tl.pause();
        root.removeEventListener("mousemove",  onTiltMove);
        root.removeEventListener("mouseleave", onTiltLeave);
        if (rafId) cancelAnimationFrame(rafId);
        if (ctaRafId) cancelAnimationFrame(ctaRafId);
      };
    }, root);

    return () => ctx.revert();
  }, []);

  // Hero background video load timing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const start = performance.now();
    mark("hero-video-start");
    const onLoadedData = () => {
      const ms = performance.now() - start;
      log(`Hero video: first frame loaded in ${ms.toFixed(0)}ms`);
      logSlow("Hero video loadedData", ms);
    };
    const onCanPlay = () => {
      mark("hero-video-canplay");
      const ms = measure("hero-video-ready", "hero-video-start", "hero-video-canplay");
      log(`Hero video: can play in ${ms.toFixed(0)}ms`);
    };
    video.addEventListener("loadeddata", onLoadedData, { once: true });
    video.addEventListener("canplay", onCanPlay, { once: true });
    return () => {
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  return (
    <section ref={heroRef} id="hero" className="hero scroll-panel section">
      <div className="section-content">
        <div className="section-inner">
          {/* Background video + layers */}
          <div className="hero-bg-video">
            <video
              ref={videoRef}
              className="hero-bg-video-el"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source src={HERO_BG_VIDEO} />
            </video>
          </div>
          <div className="hero-bg-vignette" />
          <div className="hero-bg-grain" />

          {/* Depth / glow */}
          <div className="depth-layer" />
          <div className="bg-glow" />

          {/* Content */}
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-line" />
              <span className="hero-eyebrow-text">Since 2025 · Mumbai</span>
            </div>
            <div className="title-wrapper">
              <div className="title-group">
                <h1 className="salsette">SALSETTE</h1>
                <h1 className="seven">7</h1>
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
                  <svg
                    className="cta-arrow"
                    width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              <div className="cta">
                <a href="#band">
                  MEET THE BAND
                  <svg
                    className="cta-arrow"
                    width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
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
      >
        <span className="scroll-cue-text">Scroll</span>
        <span className="scroll-cue-line" />
      </div>
    </section>
  );
}
