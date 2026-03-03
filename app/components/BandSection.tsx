"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const ARTISTS = [
  {
    name: "MARILYN",
    role: "Vocals",
    bio: "Glam-rock stage fire with velvet control. Her voice cuts through walls of distortion like silk through smoke.",
    img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=700&q=80",
    tint: "rgba(220,60,130,.18)",
    search: "Lady Gaga",
  },
  {
    name: "DALEER",
    role: "Vocals",
    bio: "Charisma heavy and spotlight hungry. Delivers each lyric like a final confession before the house lights die.",
    img: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=700&q=80",
    tint: "rgba(50,110,255,.18)",
    search: "Linkin Park",
  },
  {
    name: "ATHARVA",
    role: "Lead Guitar",
    bio: "Melodic but sharp — classic phrasing with modern bite. Every solo tells a story words simply can't reach.",
    img: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?w=700&q=80",
    tint: "rgba(225,155,45,.18)",
    search: "Bon Jovi",
  },
  {
    name: "ABIR",
    role: "Bass Guitar",
    bio: "Low frequencies, seismic impact. The invisible force that glues the chaos into something inevitable.",
    img: "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=700&q=80",
    tint: "rgba(44,198,198,.18)",
    search: "Arctic Monkeys",
  },
  {
    name: "KARTIK",
    role: "Drums",
    bio: "The rhythmic engine of beautiful chaos. He doesn't keep time — he bends it until the room shakes.",
    img: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=700&q=80",
    tint: "rgba(122,31,31,.28)",
    search: "Metallica",
  },
  {
    name: "JOANNA",
    role: "Keyboards",
    bio: "Jazz textures meet cathedral reverbs. She finds the emotional undertow beneath every riff and makes it ache.",
    img: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=700&q=80",
    tint: "rgba(255,70,110,.18)",
    search: "Tame Impala",
  },
  {
    name: "SAM",
    role: "Rhythm Guitar",
    bio: "Classic rock soul, modern grit. The backbone that lets every frontman believe they're carrying the whole band.",
    img: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=700&q=80",
    tint: "rgba(196,162,78,.18)",
    search: "The Rolling Stones",
  },
];

type Track = { url: string; art: string; name: string } | null;

async function fetchTrack(query: string): Promise<Track> {
  try {
    const r = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=12`
    );
    const d = await r.json();
    const results = (d.results ?? []).filter((x: { previewUrl?: string }) => x.previewUrl);
    if (!results.length) return null;
    const t = results[Math.floor(Math.random() * results.length)];
    return { url: t.previewUrl, art: t.artworkUrl100, name: t.trackName };
  } catch {
    return null;
  }
}

export default function BandSection() {
  const [cur, setCur] = useState(0);
  const [slideClass, setSlideClass] = useState("");
  const [shimmer, setShimmer] = useState(false);
  const [track, setTrack] = useState<Track>(null);
  const [trackLoading, setTrackLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<number, Track>>(new Map());
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioOkRef = useRef(false);
  const busyRef = useRef(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // touch / mouse drag
  const tx0Ref = useRef(0);
  const ty0Ref = useRef(0);
  const draggingRef = useRef(false);
  const mx0Ref = useRef(0);
  const mDownRef = useRef(false);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setPlaying(false);
    setProgress(0);
  }, []);

  const startProgress = useCallback(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || !audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
    }, 300);
  }, []);

  const loadTrack = useCallback(
    async (idx: number) => {
      stopAudio();
      setTrackLoading(true);
      setTrack(null);

      let t = cacheRef.current.get(idx) ?? null;
      if (!t) {
        t = await fetchTrack(ARTISTS[idx].search);
        if (t) cacheRef.current.set(idx, t);
      }

      setTrack(t);
      setTrackLoading(false);

      const audio = audioRef.current;
      if (!audio || !t) return;
      audio.src = t.url;

      if (audioOkRef.current) {
        audio
          .play()
          .then(() => {
            setPlaying(true);
            startProgress();
            setTimeout(() => audio.pause(), 9000);
          })
          .catch(() => {});
      }
    },
    [stopAudio, startProgress]
  );

  const prefetch = useCallback((idx: number) => {
    const p = (idx - 1 + ARTISTS.length) % ARTISTS.length;
    const n = (idx + 1) % ARTISTS.length;
    [p, n].forEach((i) => {
      if (!cacheRef.current.has(i)) {
        fetchTrack(ARTISTS[i].search).then((t) => t && cacheRef.current.set(i, t));
      }
    });
  }, []);

  const go = useCallback(
    (newIdx: number, dir: 1 | -1) => {
      if (busyRef.current) return;
      busyRef.current = true;

      const exitClass = dir > 0 ? "slide-exit-left" : "slide-exit-right";
      const enterClass = dir > 0 ? "slide-enter-right" : "slide-enter-left";

      setSlideClass(exitClass);

      setTimeout(() => {
        setSlideClass("");
        setCur(newIdx);
        setShimmer(false);
        requestAnimationFrame(() => {
          setShimmer(true);
          setTimeout(() => setShimmer(false), 950);
        });
        setSlideClass(enterClass);
        setTimeout(() => {
          setSlideClass("");
          busyRef.current = false;
        }, 440);
      }, 360);
    },
    []
  );

  const goNext = useCallback(() => {
    audioOkRef.current = true;
    go((cur + 1) % ARTISTS.length, 1);
  }, [cur, go]);

  const goPrev = useCallback(() => {
    audioOkRef.current = true;
    go((cur - 1 + ARTISTS.length) % ARTISTS.length, -1);
  }, [cur, go]);

  // Load track whenever cur changes; loadTrack only sets state after async awaits
  useEffect(() => {
    void loadTrack(cur);
    prefetch(cur);
  }, [cur, loadTrack, prefetch]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Audio events
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onPlay  = () => setPlaying(true);
    const onPause = () => { setPlaying(false); if (progressTimerRef.current) clearInterval(progressTimerRef.current); };
    const onEnded = () => { setPlaying(false); setProgress(100); if (progressTimerRef.current) clearInterval(progressTimerRef.current); };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Touch swipe on card
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onTouchStart = (e: TouchEvent) => {
      tx0Ref.current = e.touches[0].clientX;
      ty0Ref.current = e.touches[0].clientY;
      draggingRef.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - tx0Ref.current;
      const dy = e.touches[0].clientY - ty0Ref.current;
      if (Math.abs(dx) > Math.abs(dy) + 8) draggingRef.current = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      const dx = e.changedTouches[0].clientX - tx0Ref.current;
      audioOkRef.current = true;
      if (Math.abs(dx) > 52) { dx < 0 ? goNext() : goPrev(); }
      draggingRef.current = false;
    };

    card.addEventListener("touchstart", onTouchStart, { passive: true });
    card.addEventListener("touchmove", onTouchMove, { passive: true });
    card.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      card.removeEventListener("touchstart", onTouchStart);
      card.removeEventListener("touchmove", onTouchMove);
      card.removeEventListener("touchend", onTouchEnd);
    };
  }, [goNext, goPrev]);

  // Mouse drag on card
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onMouseDown = (e: MouseEvent) => { mDownRef.current = true; mx0Ref.current = e.clientX; };
    const onMouseUp = (e: MouseEvent) => {
      if (!mDownRef.current) return;
      mDownRef.current = false;
      const dx = e.clientX - mx0Ref.current;
      if (Math.abs(dx) > 70) { audioOkRef.current = true; dx < 0 ? goNext() : goPrev(); }
    };

    card.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      card.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [goNext, goPrev]);

  const artist = ARTISTS[cur];
  const numStr = String(cur + 1).padStart(2, "0");
  const vinylArt = track?.art
    ? track.art.replace("100x100", "200x200")
    : artist.img;

  return (
    <section id="band" className="band-section scroll-panel section">
      {/* BG */}
      <div className="band-bg-photo" style={{ backgroundImage: `url(${artist.img})` }} />
      <div
        className="band-bg-tint"
        style={{
          background: `radial-gradient(ellipse 70% 70% at 35% 55%, ${artist.tint} 0%, transparent 70%)`,
        }}
      />
      <div className="band-bg-vignette" />
      <div className="grain" />

      {/* Eyebrow */}
      <div className="band-eyebrow">
        <span className="eyebrow-line" />
        <span className="eyebrow-text">The Seven</span>
        <span className="eyebrow-line r" />
      </div>

      {/* Stage */}
      <div className="band-stage">
        {/* Left arrow */}
        <div className="band-nav-col">
          <button
            className="band-arrow-btn left"
            aria-label="Previous artist"
            onClick={goPrev}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Card */}
        <div ref={cardRef} className={`band-card-col ${slideClass}`}>
          {/* Image */}
          <div className="band-img-side">
            <div className="band-img-outer">
              <span className="band-corner tl" />
              <span className="band-corner tr" />
              <span className="band-corner bl" />
              <span className="band-corner br" />
              <div className="band-img-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artist.img} alt={artist.name} draggable={false} />
              </div>
              <div className="band-artist-num">{numStr}</div>
            </div>
          </div>

          {/* Info */}
          <div className="band-info-side">
            <div>
              <div className={`band-artist-name${shimmer ? " shimmer" : ""}`}>
                {artist.name}
              </div>
              <div className="band-artist-role">{artist.role}</div>
            </div>

            <div className="band-rule">
              <div className="band-rule-line" />
              <div className="band-rule-diamond" />
            </div>

            <p className="band-artist-bio">{artist.bio}</p>

            {/* Player */}
            <div className={`band-player${playing ? " active" : ""}`}>
              <div className="band-player-top">
                <div className={`band-mini-vinyl${playing ? " spinning" : ""}`}>
                  <div className="band-vinyl-disc">
                    <div className="band-vinyl-label">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={vinylArt} alt="" />
                    </div>
                    <div className="band-vinyl-center" />
                  </div>
                </div>
                <div className="band-player-info">
                  <div className="band-player-status">Previewing</div>
                  <div className={`band-player-track${trackLoading ? " loading" : ""}`}>
                    {trackLoading ? "Loading…" : (track?.name ?? "—")}
                  </div>
                </div>
                <button
                  className="band-play-btn"
                  disabled={!track && !trackLoading ? true : trackLoading}
                  aria-label="Play / Pause"
                  onClick={() => {
                    const audio = audioRef.current;
                    if (!audio) return;
                    audioOkRef.current = true;
                    const isPlaying = playing;
                    setTimeout(() => {
                      if (isPlaying) {
                        audio.pause();
                      } else {
                        audio
                          .play()
                          .then(() => { startProgress(); setTimeout(() => audio.pause(), 9000); })
                          .catch(() => {});
                      }
                    }, 0);
                  }}
                >
                  {playing ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="band-player-bar">
                <div
                  className="band-player-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right arrow */}
        <div className="band-nav-col">
          <button
            className="band-arrow-btn right"
            aria-label="Next artist"
            onClick={goNext}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="band-dots">
        {ARTISTS.map((a, i) => (
          <button
            key={a.name}
            className={`band-dot${i === cur ? " on" : ""}`}
            aria-label={a.name}
            onClick={() => {
              if (!busyRef.current && i !== cur) go(i, i > cur ? 1 : -1);
            }}
          />
        ))}
      </div>
    </section>
  );
}
