"use client";

import { useState, useRef, useEffect, useCallback } from "react";

function shuffleOrder(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// ─── types ────────────────────────────────────────────────────────────────────
type Artist = {
  name: string;
  role: string;
  bio: string;
  img: string;
  video: string | null;
  tint: string;
  accentHex: string;
  search: string;
};

type Track = { url: string; art: string; name: string } | null;

// ─── data (your original) ─────────────────────────────────────────────────────
const ARTISTS: Artist[] = [
  {
    name: "MARILYN",
    role: "Vocals",
    bio: "Glam-rock stage fire with velvet control. Her voice cuts through walls of distortion like silk through smoke.",
    img: "/marilyn/marylin.jpg",
    video: "/marilyn/marilyn.MOV",
    tint: "rgba(220,60,130,.18)",
    accentHex: "#DC3C82",
    search: "Lady Gaga",
  },
  {
    name: "DALEER",
    role: "Vocals",
    bio: "Charisma heavy and spotlight hungry. Delivers each lyric like a final confession before the house lights die.",
    img: "/daleer/daleer.jpg",
    video: "/daleer/daleer.MOV",
    tint: "rgba(50,110,255,.18)",
    accentHex: "#326EFF",
    search: "Linkin Park",
  },
  {
    name: "ATHARVA",
    role: "Lead Guitar",
    bio: "Melodic but sharp — classic phrasing with modern bite. Every solo tells a story words simply can't reach.",
    img: "/atharva/atharva.jpg",
    video: "/atharva/atharva.MOV",
    tint: "rgba(225,155,45,.18)",
    accentHex: "#E19B2D",
    search: "Bon Jovi",
  },
  {
    name: "ABIR",
    role: "Bass Guitar",
    bio: "Low frequencies, seismic impact. The invisible force that glues the chaos into something inevitable.",
    img: "/abir/abir.jpg",
    video: "/abir/abir.MOV",
    tint: "rgba(44,198,198,.18)",
    accentHex: "#2CC6C6",
    search: "Arctic Monkeys",
  },
  {
    name: "KARTIK",
    role: "Drums",
    bio: "The rhythmic engine of beautiful chaos. He doesn't keep time — he bends it until the room shakes.",
    img: "/kartik/kartik.jpg",
    video: "/kartik/kartik.MOV",
    tint: "rgba(122,31,31,.28)",
    accentHex: "#C06060",
    search: "Metallica",
  },
  {
    name: "JOANNA",
    role: "Keyboards",
    bio: "Jazz textures meet cathedral reverbs. She finds the emotional undertow beneath every riff and makes it ache.",
    img: "/joanna/joanna.jpg",
    video: "/joanna/joanna.MOV",
    tint: "rgba(255,70,110,.18)",
    accentHex: "#FF466E",
    search: "Tame Impala",
  },
  {
    name: "SAM",
    role: "Rhythm Guitar",
    bio: "Classic rock soul, modern grit. The backbone that lets every frontman believe they're carrying the whole band.",
    img: "/sam/sam.png",
    video: null,
    tint: "rgba(196,162,78,.18)",
    accentHex: "#C4A24E",
    search: "The Rolling Stones",
  },
];

// ─── iTunes helper ─────────────────────────────────────────────────────────────
async function fetchTrack(query: string): Promise<Track> {
  try {
    const r = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=12`
    );
    const d = await r.json();
    const results = (d.results ?? []).filter((x: { previewUrl?: string }) => x.previewUrl);
    if (!results.length) return null;
    const t = results[Math.floor(Math.random() * results.length)];
    return {
      url: t.previewUrl,
      art: t.artworkUrl100?.replace("100x100", "200x200") ?? "",
      name: t.trackName,
    };
  } catch {
    return null;
  }
}

// ─── component ────────────────────────────────────────────────────────────────
const INITIAL_ORDER = Array.from({ length: ARTISTS.length }, (_, i) => i);

export default function BandSection() {
  const [order, setOrder]       = useState<number[]>(INITIAL_ORDER);
  const [cur, setCur]           = useState(0);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [shimmer, setShimmer]   = useState(false);
  const [track, setTrack]       = useState<Track>(null);
  const [trackLoading, setTL]   = useState(true);
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);

  // Apply random order after hydration so server and client render the same initial content
  useEffect(() => {
    setOrder(shuffleOrder(ARTISTS.length));
  }, []);

  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const cacheRef   = useRef<Map<number, Track>>(new Map());
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef    = useRef(false);
  const audioOkRef = useRef(false);
  const tx0Ref     = useRef(0);
  const mx0Ref     = useRef(0);
  const mDownRef   = useRef(false);
  const cardRef    = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef  = useRef(false);

  // ── audio helpers ────────────────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.src = "";
    if (timerRef.current) clearInterval(timerRef.current);
    setPlaying(false);
    setProgress(0);
  }, []);

  const startProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const a = audioRef.current;
      if (a?.duration) setProgress((a.currentTime / a.duration) * 100);
    }, 250);
  }, []);

  // ── load track ───────────────────────────────────────────────────────────────
  const loadTrack = useCallback(
    async (idx: number) => {
      stopAudio();
      setTL(true);
      setTrack(null);

      let t = cacheRef.current.get(idx) ?? null;
      if (!t) {
        t = await fetchTrack(ARTISTS[idx].search);
        if (t) cacheRef.current.set(idx, t);
      }
      setTrack(t);
      setTL(false);

      const a = audioRef.current;
      if (!a || !t) return;
      a.src = t.url;
      /* No autoplay — user clicks play to start */
    },
    [stopAudio]
  );

  // ── prefetch neighbours ──────────────────────────────────────────────────────
  const prefetch = useCallback((idx: number) => {
    const p = (idx - 1 + ARTISTS.length) % ARTISTS.length;
    const n = (idx + 1) % ARTISTS.length;
    [p, n].forEach((i) => {
      if (!cacheRef.current.has(i))
        fetchTrack(ARTISTS[i].search).then((t) => t && cacheRef.current.set(i, t));
    });
  }, []);

  // ── navigate ─────────────────────────────────────────────────────────────────
  const go = useCallback((newIdx: number, dir: "left" | "right") => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSlideDir(dir);

    setTimeout(() => {
      setCur(newIdx);
      setSlideDir(null);
      setShimmer(false);
      requestAnimationFrame(() => {
        setShimmer(true);
        setTimeout(() => setShimmer(false), 900);
      });
      setTimeout(() => { busyRef.current = false; }, 420);
    }, 320);
  }, []);

  const goNext = useCallback(() => {
    audioOkRef.current = true;
    go((cur + 1) % ARTISTS.length, "left");
  }, [cur, go]);

  const goPrev = useCallback(() => {
    audioOkRef.current = true;
    go((cur - 1 + ARTISTS.length) % ARTISTS.length, "right");
  }, [cur, go]);

  // ── effects ──────────────────────────────────────────────────────────────────
  useEffect(() => { loadTrack(order[cur]); prefetch(order[cur]); }, [cur, order, loadTrack, prefetch]);

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    const onPlay  = () => setPlaying(true);
    const onPause = () => { setPlaying(false); if (timerRef.current) clearInterval(timerRef.current); };
    const onEnded = () => { setPlaying(false); setProgress(100); if (timerRef.current) clearInterval(timerRef.current); };
    a.addEventListener("play",  onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    return () => { a.pause(); a.removeEventListener("play", onPlay); a.removeEventListener("pause", onPause); a.removeEventListener("ended", onEnded); if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // auto-advance carousel (only when visible)
  const AUTO_SCROLL_MS = 5500;
  useEffect(() => {
    const section = document.getElementById("band");
    if (!section) return;

    const obs = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0.1 });
    obs.observe(section);

    autoScrollRef.current = setInterval(() => {
      if (isVisibleRef.current) goNext();
    }, AUTO_SCROLL_MS);

    return () => {
      obs.disconnect();
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [goNext]);

  // keyboard
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [goNext, goPrev]);

  // touch swipe
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const ts = (e: TouchEvent) => { tx0Ref.current = e.touches[0].clientX; };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - tx0Ref.current;
      if (Math.abs(dx) > 48) { audioOkRef.current = true; dx < 0 ? goNext() : goPrev(); }
    };
    card.addEventListener("touchstart", ts, { passive: true });
    card.addEventListener("touchend",   te, { passive: true });
    return () => { card.removeEventListener("touchstart", ts); card.removeEventListener("touchend", te); };
  }, [goNext, goPrev]);

  // mouse drag
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const md = (e: MouseEvent) => { mDownRef.current = true; mx0Ref.current = e.clientX; };
    const mu = (e: MouseEvent) => {
      if (!mDownRef.current) return;
      mDownRef.current = false;
      const dx = e.clientX - mx0Ref.current;
      if (Math.abs(dx) > 70) { audioOkRef.current = true; dx < 0 ? goNext() : goPrev(); }
    };
    card.addEventListener("mousedown", md);
    window.addEventListener("mouseup", mu);
    return () => { card.removeEventListener("mousedown", md); window.removeEventListener("mouseup", mu); };
  }, [goNext, goPrev]);

  // ── derived ──────────────────────────────────────────────────────────────────
  const artist   = ARTISTS[order[cur]];
  const vinylArt = track?.art ?? artist.img;

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <section
      id="band"
      className="band-section scroll-panel section"
      style={{
        padding: "clamp(60px, 10vw, 100px) clamp(12px, 4vw, 32px) clamp(40px, 6vw, 60px)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lora:ital,wght@0,400;1,400&display=swap');

        .bs-bg-photo {
          position: absolute; inset: 0; background-size: cover;
          background-position: center 20%; opacity: .12;
          transition: background-image .6s ease;
          will-change: opacity;
        }
        .bs-vignette {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 80% at 50% 40%, transparent 15%, #0c0c0f 78%),
            linear-gradient(to bottom, #0c0c0f 0%, transparent 16%, transparent 80%, #0c0c0f 100%);
        }
        .bs-grain {
          position: absolute; inset: 0; opacity: .045; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        /* slide transitions */
        .bs-exit-left   { animation: bsExitL  .32s ease forwards; }
        .bs-exit-right  { animation: bsExitR  .32s ease forwards; }
        .bs-enter-left  { animation: bsEnterL .40s cubic-bezier(.22,1,.36,1) forwards; }
        .bs-enter-right { animation: bsEnterR .40s cubic-bezier(.22,1,.36,1) forwards; }
        @keyframes bsExitL   { to { opacity:0; transform:translateX(-40px); } }
        @keyframes bsExitR   { to { opacity:0; transform:translateX( 40px); } }
        @keyframes bsEnterL  { from { opacity:0; transform:translateX( 44px); } to { opacity:1; transform:translateX(0); } }
        @keyframes bsEnterR  { from { opacity:0; transform:translateX(-44px); } to { opacity:1; transform:translateX(0); } }

        /* name shimmer */
        @keyframes bsShimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .bs-shimmer {
          background: linear-gradient(90deg, #fff 30%, #FFD764 50%, #fff 70%);
          background-size: 400px 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: bsShimmer .85s ease forwards;
        }

        /* vinyl spin */
        @keyframes bsVinyl { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }

        /* shared button resets */
        .bs-arrow, .bs-play-btn, .bs-dot { cursor: pointer; }

        .bs-arrow {
          background: none;
          border: 1px solid rgba(255,255,255,.13);
          color: rgba(255,255,255,.6);
          width: clamp(38px,5vw,48px); height: clamp(38px,5vw,48px);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: border-color .2s, color .2s, background .2s;
          flex-shrink: 0;
        }
        .bs-arrow:hover {
          border-color: rgba(255,215,100,.5);
          color: rgba(255,215,100,.9);
          background: rgba(255,215,100,.05);
        }

        .bs-dot {
          width: 6px; height: 6px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,.28);
          background: transparent; padding: 0;
          transition: all .25s;
        }
        .bs-dot.on {
          background: #FFD764; border-color: #FFD764;
          width: 20px; border-radius: 3px;
        }

        .bs-play-btn {
          background: none;
          border: 1px solid rgba(255,255,255,.18);
          color: #fff;
          width: 38px; height: 38px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: border-color .2s, background .2s;
          flex-shrink: 0;
        }
        .bs-play-btn:hover:not(:disabled) {
          border-color: rgba(255,215,100,.55);
          background: rgba(255,215,100,.07);
        }
        .bs-play-btn:disabled { opacity: .4; cursor: default; }
        .bs-play-btn.active   { border-color: rgba(255,215,100,.5); background: rgba(255,215,100,.08); }

        .bs-bar { height: 2px; background: rgba(255,255,255,.07); border-radius: 2px; overflow: hidden; }
        .bs-bar-fill { height: 100%; border-radius: 2px; transition: width .25s linear; }

        /* ── mobile ── */
        .bs-mobile-nav { display: none; }

        @media (max-width: 600px) {
          .bs-stage    { flex-direction: column !important; gap: 0 !important; }
          .bs-nav-col  { display: none !important; }
          .bs-card     { flex-direction: column !important; }
          .bs-img-wrap {
            width: 100% !important; min-width: unset !important;
            aspect-ratio: 4/3 !important; height: auto !important;
          }
          .bs-img-wrap video,
          .bs-img-wrap img { min-height: unset !important; }
          .bs-info     { padding: 20px 18px 24px !important; }
          .bs-name     { font-size: clamp(26px,9vw,44px) !important; }
          .bs-mobile-nav { display: flex !important; justify-content: center !important; }
        }
      `}</style>

      {/* background photo */}
      <div className="bs-bg-photo" style={{ backgroundImage: `url(${artist.img})` }} />

      {/* per-artist colour tint */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 70% 70% at 35% 55%, ${artist.tint} 0%, transparent 70%)`,
        transition: "background .7s ease",
      }} />

      <div className="bs-vignette" />
      <div className="bs-grain" />

      {/* ── eyebrow ── */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", alignItems: "center", gap: "clamp(10px,3vw,20px)",
        marginBottom: "clamp(16px,4vw,36px)",
      }}>
        <div style={{ width: "clamp(24px,5vw,56px)", height: "1px", background: "linear-gradient(to right,transparent,rgba(255,215,100,.35))" }} />
        <span style={{ color: "rgba(255,215,100,.45)", fontSize: "10px", letterSpacing: "5px", textTransform: "uppercase", fontFamily: "'Cinzel',serif", whiteSpace: "nowrap" }}>
          The Seven
        </span>
        <div style={{ width: "clamp(24px,5vw,56px)", height: "1px", background: "linear-gradient(to left,transparent,rgba(255,215,100,.35))" }} />
      </div>

      {/* ── stage ── */}
      <div
        className="bs-stage"
        style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center",
          gap: "clamp(8px,2vw,24px)",
          width: "100%", maxWidth: "860px",
        }}
      >
        {/* left arrow */}
        <div className="bs-nav-col">
          <button className="bs-arrow" aria-label="Previous artist" onClick={goPrev}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* ── card ── */}
        <div
          ref={cardRef}
          className={`bs-card ${
            slideDir === "left"  ? "bs-exit-left"  :
            slideDir === "right" ? "bs-exit-right" :
            "bs-enter-left"
          }`}
          style={{
            flex: 1, minWidth: 0,
            display: "flex",
            background: "rgba(255,255,255,.025)",
            border: "1px solid rgba(255,255,255,.065)",
            backdropFilter: "blur(6px)",
            overflow: "hidden",
          }}
        >
          {/* image / video side */}
          <div
            className="bs-img-wrap"
            style={{
              width: "clamp(140px,38%,280px)",
              minWidth: "clamp(140px,38%,280px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* corner marks */}
            {([
              { top: "8px",    left:  "8px",  borderTop:    "1px solid rgba(255,215,100,.3)", borderLeft:   "1px solid rgba(255,215,100,.3)" },
              { top: "8px",    right: "8px",  borderTop:    "1px solid rgba(255,215,100,.3)", borderRight:  "1px solid rgba(255,215,100,.3)" },
              { bottom: "8px", left:  "8px",  borderBottom: "1px solid rgba(255,215,100,.3)", borderLeft:   "1px solid rgba(255,215,100,.3)" },
              { bottom: "8px", right: "8px",  borderBottom: "1px solid rgba(255,215,100,.3)", borderRight:  "1px solid rgba(255,215,100,.3)" },
            ] as React.CSSProperties[]).map((s, i) => (
              <span key={i} style={{ position: "absolute", width: "12px", height: "12px", zIndex: 2, ...s }} />
            ))}

            {/* video or image */}
            {artist.video ? (
              <video
                src={artist.video}
                poster={artist.img}
                autoPlay
                muted
                loop
                playsInline
                aria-label={artist.name}
                style={{
                  width: "100%", height: "100%",
                  minHeight: "clamp(220px,40vw,360px)",
                  objectFit: "cover", display: "block",
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artist.img}
                alt={artist.name}
                draggable={false}
                style={{
                  width: "100%", height: "100%",
                  minHeight: "clamp(220px,40vw,360px)",
                  objectFit: "cover", display: "block",
                }}
              />
            )}

            {/* overlays */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,transparent 55%,rgba(12,12,15,.92)),linear-gradient(to top,rgba(12,12,15,.5) 0%,transparent 45%)" }} />
            <div style={{ position: "absolute", left: 0, top: "12%", width: "3px", height: "28%", background: `linear-gradient(to bottom,transparent,${artist.accentHex},transparent)` }} />
          </div>

          {/* info side */}
          <div
            className="bs-info"
            style={{
              flex: 1, minWidth: 0,
              padding: "clamp(18px,4vw,40px) clamp(16px,3.5vw,36px)",
              display: "flex", flexDirection: "column",
              gap: "clamp(10px,2vw,18px)",
            }}
          >
            {/* name + role */}
            <div>
              <div style={{ color: artist.accentHex, fontSize: "10px", letterSpacing: "3.5px", textTransform: "uppercase", fontFamily: "'Cinzel',serif", marginBottom: "8px", opacity: .85 }}>
                {artist.role}
              </div>
              <div
                className={`bs-name${shimmer ? " bs-shimmer" : ""}`}
                style={{
                  color: "#fff",
                  fontSize: "clamp(24px,5.5vw,52px)",
                  fontWeight: "900",
                  lineHeight: 1.02,
                  letterSpacing: "-.5px",
                  fontFamily: "'Cinzel',serif",
                  wordBreak: "break-word",
                }}
              >
                {artist.name}
              </div>
            </div>

            {/* decorative rule */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "28px", height: "1px", background: artist.accentHex, opacity: .6 }} />
              <div style={{ width: "5px", height: "5px", background: artist.accentHex, transform: "rotate(45deg)", opacity: .7 }} />
            </div>

            {/* bio */}
            <p style={{
              color: "rgba(255,255,255,.52)",
              fontSize: "clamp(12px,1.85vw,15px)",
              lineHeight: 1.78,
              margin: 0,
              fontStyle: "italic",
              fontFamily: "'Lora',Georgia,serif",
              wordWrap: "break-word",
              overflowWrap: "break-word",
            }}>
              {artist.bio}
            </p>

            {/* ── music player ── */}
            <div style={{
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.07)",
              borderRadius: "6px",
              overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px" }}>

                {/* spinning vinyl */}
                <div style={{
                  width: "38px", height: "38px", borderRadius: "50%",
                  overflow: "hidden", flexShrink: 0, position: "relative",
                  border: "1px solid rgba(255,255,255,.1)",
                }}>
                  <img
                    src={vinylArt}
                    alt=""
                    style={{
                      width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%",
                      animation: playing ? "bsVinyl 3s linear infinite" : "none",
                    }}
                  />
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,0,0,.55) 18%,transparent 55%)" }} />
                </div>

                {/* track info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "rgba(255,255,255,.25)", fontSize: "8px", letterSpacing: "2px", fontFamily: "'Lora',serif", marginBottom: "2px" }}>
                    PREVIEWING
                  </div>
                  <div style={{
                    color: trackLoading ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.78)",
                    fontSize: "clamp(10px,1.75vw,12px)",
                    fontFamily: "'Cinzel',serif",
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {trackLoading ? "Loading…" : (track?.name ?? "—")}
                  </div>
                </div>

                {/* play / pause */}
                <button
                  className={`bs-play-btn${playing ? " active" : ""}`}
                  disabled={trackLoading || (!track && !trackLoading)}
                  aria-label="Play / Pause"
                  onClick={() => {
                    const a = audioRef.current;
                    if (!a) return;
                    audioOkRef.current = true;
                    if (playing) {
                      a.pause();
                    } else {
                      a.play()
                        .then(() => { startProgress(); setTimeout(() => a.pause(), 9000); })
                        .catch(() => {});
                    }
                  }}
                >
                  {playing
                    ? <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    : <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  }
                </button>
              </div>

              {/* progress bar */}
              <div className="bs-bar">
                <div
                  className="bs-bar-fill"
                  style={{ width: `${progress}%`, background: `linear-gradient(to right,${artist.accentHex}88,${artist.accentHex})` }}
                />
              </div>
            </div>

            {/* mobile-only prev/next */}
            <div className="bs-mobile-nav" style={{ alignItems: "center", gap: "10px" }}>
              <button className="bs-arrow" onClick={goPrev} aria-label="Previous">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="bs-arrow" onClick={goNext} aria-label="Next">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* right arrow */}
        <div className="bs-nav-col">
          <button className="bs-arrow" aria-label="Next artist" onClick={goNext}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── dots ── */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", gap: "8px", alignItems: "center",
        marginTop: "clamp(16px,3vw,28px)", flexWrap: "wrap", justifyContent: "center",
      }}>
        {ARTISTS.map((a, i) => (
          <button
            key={a.name}
            className={`bs-dot${i === cur ? " on" : ""}`}
            aria-label={a.name}
            onClick={() => {
              if (!busyRef.current && i !== cur) {
                audioOkRef.current = true;
                go(i, i > cur ? "left" : "right");
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}