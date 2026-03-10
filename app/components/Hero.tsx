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

    const ctx = gsap.context(() => {
      // ── Query elements ────────────────────────────────────────────────────
      const root        = heroRef.current!;
      const splash      = root.querySelector<HTMLElement>(".hero-splash")!;
      const sevenTop    = root.querySelector<HTMLElement>(".hero-splash-seven-top")!;
      const sevenBot    = root.querySelector<HTMLElement>(".hero-splash-seven-bot")!;
      const splitLine   = root.querySelector<HTMLElement>(".hero-splash-split-line")!;
      const splashSub   = root.querySelector<HTMLElement>(".hero-splash-sub")!;
      const heroEyebrow = root.querySelector<HTMLElement>(".hero-eyebrow")!;
      const tagline     = root.querySelector<HTMLElement>(".tagline")!;
      const ctas        = root.querySelector<HTMLElement>(".cta-group")!;

      gsap.set([sevenTop, sevenBot], { x: 0, y: 0 });
      gsap.set(splitLine, { opacity: 0, scaleX: 0 });
      gsap.set(splashSub, { opacity: 0, y: 6 });
      gsap.set([heroEyebrow, tagline, ctas, scrollCueRef.current], {
        opacity: 0,
        y: 8,
      });

      // ── Master timeline ───────────────────────────────────────────────────
      mark("hero-timeline-start");
      const tl = gsap.timeline({
        onComplete: () => {
          mark("hero-timeline-complete");
          const ms = logMeasure("hero-timeline", "hero-timeline-start", "hero-timeline-complete");
          if (ms > 0) log("Hero: splash + reveal complete");
        },
      });

      tl.to({}, { duration: 0.9 })
        .to(splashSub, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.1")
        .to({}, { duration: 0.55 })
        .to(splitLine, { opacity: 1, scaleX: 1, duration: 0.18, ease: "power4.out" })
        .to(splitLine, { opacity: 0, duration: 0.12, ease: "none" }, "+=0.06")
        .to(
          sevenTop,
          { x: "-42vw", y: "-55vh", rotation: -8, duration: 0.72, ease: "power4.in" },
          "-=0.04"
        )
        .to(
          sevenBot,
          { x: "44vw", y: "58vh", rotation: 9, duration: 0.72, ease: "power4.in" },
          "<"
        )
        .to(splashSub, { opacity: 0, duration: 0.22, ease: "none" }, "<")
        .fromTo(splash, { filter: "brightness(1)" }, { filter: "brightness(3)", duration: 0.08, ease: "none" }, "<+0.3")
        .to(splash, { filter: "brightness(1)", duration: 0.1, ease: "none" })
        .to(splash, {
          opacity: 0,
          duration: 0.35,
          ease: "power2.out",
          onComplete: () => splash.classList.add("hero-splash-hidden"),
        }, "-=0.1")
        .to(heroEyebrow, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, "<+0.1")
        .to(tagline, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, "<+0.12")
        .to(ctas, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "<+0.08")
        .to(scrollCueRef.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "<+0.08");

      // ── Magnetic CTA hover ────────────────────────────────────────────────
      root.querySelectorAll<HTMLElement>(".cta a, .cta button").forEach((btn) => {
        const onMove = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, {
            x: (e.clientX - (r.left + r.width  / 2)) * 0.25,
            y: (e.clientY - (r.top  + r.height / 2)) * 0.25,
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

      // ── 3D tilt on mouse move ─────────────────────────────────────────────
      const bgPhotos   = root.querySelectorAll<HTMLElement>(".hero-bg-photo, .hero-bg-video-el");
      const bgVignette = root.querySelector<HTMLElement>(".hero-bg-vignette");
      let   rafId      = 0;

      const parallaxSample = sampleLog("Hero parallax", 90);
      const onTiltMove = (e: MouseEvent) => {
        const nx = e.clientX / window.innerWidth  - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          parallaxSample();
          const t0 = performance.now();
          [...bgPhotos, bgVignette].forEach((el) => {
            if (!el) return;
            gsap.to(el, {
              x: -nx * 24,
              y: -ny * 12,
              duration: 1.0,
              ease: "power2.out",
              overwrite: true,
            });
          });
          const tiltMs = performance.now() - t0;
          logSlow("Hero parallax GSAP", tiltMs);
        });
      };

      const onTiltLeave = () =>
        gsap.to(
          [...bgPhotos, bgVignette].filter(Boolean) as HTMLElement[],
          { x: 0, y: 0, duration: 0.9, ease: "power2.out" }
        );

      root.addEventListener("mousemove",  onTiltMove,  { passive: true });
      root.addEventListener("mouseleave", onTiltLeave);

      // ── Cleanup — pause instead of revert so CTAs stay visible ───────────
      return () => {
        tl.pause();
        root.removeEventListener("mousemove",  onTiltMove);
        root.removeEventListener("mouseleave", onTiltLeave);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, heroRef);

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
    <section ref={heroRef} className="hero scroll-panel section">
      <div className="section-content">
        <div className="section-inner">
          <div className="hero-splash">
            <div className="hero-splash-bg-lines" />
            <div className="hero-splash-seven-wrap">
              <div className="hero-splash-seven-top">
                <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="metalTop" x1="0" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
                      <stop offset="0%" stopColor="#fdf8ee" />
                      <stop offset="10%" stopColor="#ead9aa" />
                      <stop offset="26%" stopColor="#c9a96e" />
                      <stop offset="45%" stopColor="#a07840" />
                      <stop offset="64%" stopColor="#7a5c28" />
                      <stop offset="80%" stopColor="#9a7838" />
                      <stop offset="100%" stopColor="#c8a458" />
                    </linearGradient>
                    <linearGradient id="sheenTop" x1="0.15" y1="0" x2="0.65" y2="0.6" gradientUnits="objectBoundingBox">
                      <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                      <stop offset="42%" stopColor="rgba(255,255,255,0)" />
                      <stop offset="52%" stopColor="rgba(255,255,255,0.15)" />
                      <stop offset="62%" stopColor="rgba(255,255,255,0)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                  <polygon points="40,40 460,40 460,140 230,620 140,620 370,140 40,140" fill="url(#metalTop)" />
                  <polygon points="40,40 460,40 460,140 230,620 140,620 370,140 40,140" fill="url(#sheenTop)" />
                  <line x1="41" y1="41" x2="459" y2="41" stroke="rgba(253,248,230,0.65)" strokeWidth="2" />
                  <line x1="41" y1="42" x2="41" y2="138" stroke="rgba(253,248,230,0.4)" strokeWidth="1.5" />
                  <line x1="371" y1="142" x2="141" y2="618" stroke="rgba(253,248,230,0.18)" strokeWidth="1.5" />
                  <line x1="459" y1="142" x2="229" y2="618" stroke="rgba(0,0,0,0.22)" strokeWidth="2" />
                </svg>
              </div>
              <div className="hero-splash-seven-bot">
                <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="metalBot" x1="0" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
                      <stop offset="0%" stopColor="#c9a96e" />
                      <stop offset="22%" stopColor="#a07840" />
                      <stop offset="46%" stopColor="#7a5c28" />
                      <stop offset="66%" stopColor="#6a4c18" />
                      <stop offset="82%" stopColor="#8a6830" />
                      <stop offset="100%" stopColor="#b89050" />
                    </linearGradient>
                    <linearGradient id="sheenBot" x1="0.15" y1="0" x2="0.65" y2="0.6" gradientUnits="objectBoundingBox">
                      <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                      <stop offset="44%" stopColor="rgba(255,255,255,0)" />
                      <stop offset="52%" stopColor="rgba(255,255,255,0.08)" />
                      <stop offset="60%" stopColor="rgba(255,255,255,0)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                  <polygon points="40,40 460,40 460,140 230,620 140,620 370,140 40,140" fill="url(#metalBot)" />
                  <polygon points="40,40 460,40 460,140 230,620 140,620 370,140 40,140" fill="url(#sheenBot)" />
                  <line x1="459" y1="142" x2="229" y2="618" stroke="rgba(0,0,0,0.28)" strokeWidth="2" />
                </svg>
              </div>
              <div className="hero-splash-split-line" />
            </div>
            <div className="hero-splash-sub">SALSETTE&nbsp;&nbsp;·&nbsp;&nbsp;MUMBAI&nbsp;&nbsp;·&nbsp;&nbsp;2025</div>
          </div>

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
