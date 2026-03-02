"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import Image from "next/image";

const artists = [
  {
    name: "MARILYN",
    role: "Vocals",
    bio: "Glam-rock stage fire with velvet control.",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    bg: "radial-gradient(circle at 20% 40%, rgba(255,45,149,.4), transparent 60%)",
    accent: "rgba(255,45,149,.4)",
    search: "Lady Gaga",
  },
  {
    name: "DALEER",
    role: "Vocals",
    bio: "Charisma heavy and spotlight hungry.",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
    bg: "radial-gradient(circle at 70% 40%, rgba(42,108,255,.4), transparent 60%)",
    accent: "rgba(42,108,255,.4)",
    search: "Linkin Park",
  },
  {
    name: "ATHARVA",
    role: "Lead Guitar",
    bio: "Melodic but sharp, classic with bite.",
    image: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae",
    bg: "radial-gradient(circle at 30% 70%, rgba(232,156,44,.4), transparent 60%)",
    accent: "rgba(232,156,44,.4)",
    search: "Bon Jovi",
  },
  {
    name: "ABIR",
    role: "Bass",
    bio: "Low frequencies. High impact.",
    image: "https://images.unsplash.com/photo-1518972559570-7cc1309f3229",
    bg: "radial-gradient(circle at 60% 30%, rgba(44,198,198,.4), transparent 60%)",
    accent: "rgba(44,198,198,.4)",
    search: "Arctic Monkeys",
  },
  {
    name: "KARTIK",
    role: "Drums",
    bio: "The rhythmic engine of chaos.",
    image: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff",
    bg: "radial-gradient(circle at 50% 50%, rgba(122,31,31,.5), transparent 60%)",
    accent: "rgba(122,31,31,.5)",
    search: "Metallica",
  },
  {
    name: "JOANNA",
    role: "Keyboard",
    bio: "Jazz textures meet distortion waves.",
    image: "https://images.unsplash.com/photo-1487180144351-b8472da7d491",
    bg: "radial-gradient(circle at 40% 40%, rgba(255,59,107,.4), transparent 60%)",
    accent: "rgba(255,59,107,.4)",
    search: "Tame Impala",
  },
  {
    name: "SAM",
    role: "Guitar",
    bio: "Classic rock soul, modern grit.",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
    bg: "radial-gradient(circle at 70% 50%, rgba(198,167,94,.4), transparent 60%)",
    accent: "rgba(198,167,94,.4)",
    search: "The Rolling Stones",
  },
];

type iTunesTrack = {
  previewUrl: string;
  artworkUrl100: string;
  trackName: string;
};

async function fetchPreview(query: string): Promise<iTunesTrack | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`
    );
    const data = await res.json();
    const results = data.results ?? [];
    if (results.length === 0) return null;
    const track = results[Math.floor(Math.random() * results.length)];
    return {
      previewUrl: track.previewUrl,
      artworkUrl100: track.artworkUrl100,
      trackName: track.trackName,
    };
  } catch {
    return null;
  }
}

export default function BandSection() {
  const [index, setIndex] = useState(0);
  const [track, setTrack] = useState<iTunesTrack | null>(null);
  const [sweepActive, setSweepActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const prevBtnRef = useRef<HTMLButtonElement | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);
  const nameRef = useRef<HTMLHeadingElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const audioEnabledRef = useRef(false);
  const trackCacheRef = useRef<Map<number, iTunesTrack>>(new Map());

  const artist = artists[index];

  const playClickSound = useCallback(() => {
    if (!audioEnabledRef.current) return;
    try {
      const s = clickSoundRef.current ?? new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"
      );
      if (!clickSoundRef.current) {
        clickSoundRef.current = s;
        s.volume = 0.12;
      }
      s.currentTime = 0;
      void s.play();
    } catch {
      // ignore
    }
  }, []);

  const updateArtist = useCallback(
    async (i: number) => {
      const a = artists[i];
      if (!sectionRef.current) return;

      sectionRef.current.style.setProperty("--band-bg-image", `url(${a.image})`);
      sectionRef.current.style.setProperty("--band-bg-gradient", a.bg);
      sectionRef.current.style.setProperty(
        "--band-spotlight",
        `radial-gradient(circle, ${a.accent}, transparent 70%)`
      );

      sectionRef.current.querySelectorAll(".nav-btn").forEach((btn) => {
        (btn as HTMLElement).style.boxShadow = `0 0 20px ${a.accent}`;
      });

      setTrack(null);
      setSweepActive(true);
      setTimeout(() => setSweepActive(false), 1200);

      if (nameRef.current) {
        gsap.killTweensOf(nameRef.current);
        gsap.fromTo(
          nameRef.current,
          { letterSpacing: "0.6em", opacity: 0 },
          { letterSpacing: "0.25em", opacity: 1, duration: 0.45, overwrite: true }
        );
      }

      if (imgRef.current) {
        gsap.killTweensOf(imgRef.current);
        gsap.fromTo(
          imgRef.current,
          { scale: 1.1 },
          { scale: 1, duration: 0.5, ease: "power2.out", overwrite: true }
        );
      }

      const fromCache = trackCacheRef.current.has(i);
      let fetched: iTunesTrack | null = fromCache ? trackCacheRef.current.get(i)! : null;
      if (!fetched) {
        fetched = await fetchPreview(a.search);
        if (fetched) trackCacheRef.current.set(i, fetched);
      }
      setTrack(fetched);

      const prevI = (i - 1 + artists.length) % artists.length;
      const nextI = (i + 1) % artists.length;
      if (!trackCacheRef.current.has(prevI))
        fetchPreview(artists[prevI].search).then((t) => t && trackCacheRef.current.set(prevI, t));
      if (!trackCacheRef.current.has(nextI))
        fetchPreview(artists[nextI].search).then((t) => t && trackCacheRef.current.set(nextI, t));

      if (fetched && audioRef.current) {
        audioRef.current.src = fetched.previewUrl;
        setIsPlaying(false);
        if (previewTimeoutRef.current)
          window.clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = window.setTimeout(() => {
          audioRef.current?.pause();
          setIsPlaying(false);
        }, 5000);
        void audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        setIsPlaying(false);
      }
    },
    []
  );

  useEffect(() => {
    updateArtist(index);
    return () => {
      if (previewTimeoutRef.current)
        window.clearTimeout(previewTimeoutRef.current);
    };
  }, [index, updateArtist]);

  // Show/hide fixed nav based on section visibility
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([entry]) => setNavVisible(entry.intersectionRatio >= 0.4),
      { threshold: [0, 0.4, 1] }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!stageRef.current) return;
    gsap.killTweensOf(stageRef.current);
    gsap.fromTo(
      stageRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", overwrite: true }
    );
  }, [index]);

  useEffect(() => {
    const stage = stageRef.current;
    const prev = prevBtnRef.current;
    const next = nextBtnRef.current;
    const spotlight = spotlightRef.current;
    if (!stage || !prev || !next) return;

    gsap.set(prev, { yPercent: -50 });
    gsap.set(next, { yPercent: -50 });
    gsap.from(prev, { x: -50, opacity: 0, duration: 0.8, ease: "power3.out" });
    gsap.from(next, { x: 50, opacity: 0, duration: 0.8, ease: "power3.out" });

    const stageRotateY = gsap.quickTo(stage, "rotateY", { duration: 0.5 });
    const stageRotateX = gsap.quickTo(stage, "rotateX", { duration: 0.5 });
    const prevX = gsap.quickTo(prev, "x", { duration: 0.25 });
    const prevY = gsap.quickTo(prev, "y", { duration: 0.25 });
    const nextX = gsap.quickTo(next, "x", { duration: 0.25 });
    const nextY = gsap.quickTo(next, "y", { duration: 0.25 });
    const spotlightScale = spotlight
      ? gsap.quickTo(spotlight, "scale", { duration: 0.3 })
      : null;

    let rafId = 0;
    let lastX = 0;
    let lastY = 0;

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const x = lastX / window.innerWidth - 0.5;
        const y = lastY / window.innerHeight - 0.5;
        stageRotateY(x * 6);
        stageRotateX(-y * 4);

        const magneticStrength = 0.12;
        const radius = 120;
        [prev, next].forEach((btn, i) => {
          const qx = i === 0 ? prevX : nextX;
          const qy = i === 0 ? prevY : nextY;
          const rect = btn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = lastX - cx;
          const dy = lastY - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius) {
            const f = (radius - dist) / radius;
            qx(dx * f * magneticStrength);
            qy(dy * f * magneticStrength);
          } else {
            qx(0);
            qy(0);
          }
        });

        if (spotlightScale) {
          const pr = prev.getBoundingClientRect();
          const nr = next.getBoundingClientRect();
          const inPrev =
            lastX >= pr.left && lastX <= pr.right &&
            lastY >= pr.top && lastY <= pr.bottom;
          const inNext =
            lastX >= nr.left && lastX <= nr.right &&
            lastY >= nr.top && lastY <= nr.bottom;
          spotlightScale(inPrev || inNext ? 1.15 : 1);
        }
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
    <div className={`floating-nav${navVisible ? " nav-visible" : ""}`}>
        <button
          ref={prevBtnRef}
          type="button"
          id="prevBtn"
          className="nav-btn left"
          onClick={() => {
            audioEnabledRef.current = true;
            playClickSound();
            setIndex((i) => (i - 1 + artists.length) % artists.length);
          }}
          aria-label="Previous artist"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          ref={nextBtnRef}
          type="button"
          id="nextBtn"
          className="nav-btn right"
          onClick={() => {
            audioEnabledRef.current = true;
            playClickSound();
            setIndex((i) => (i + 1) % artists.length);
          }}
          aria-label="Next artist"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    <section ref={sectionRef} className="band-section scroll-panel section">
      <div className="section-content">
      <div className="panel-inner section-inner">
        <div className="band-bg-image" />
        <div className="band-bg-gradient" />
        <div className="spotlight-wrap">
          <div ref={spotlightRef} className="spotlight" />
        </div>

        <h2 className="band-title">THE SEVEN</h2>

        <div className="artist-stage" ref={stageRef}>
        <div className="artist-image">
          <Image ref={imgRef} src={artist.image} alt={artist.name} width={300} height={300} quality={100} priority unoptimized />
        </div>

        <div className="artist-right">
          <div className="artist-info">
            <h3 ref={nameRef} className={sweepActive ? "sweep" : ""}>
              {artist.name}
            </h3>
            <p className="role">{artist.role}</p>
            <p className="bio">{artist.bio}</p>
          </div>

          <div className="artist-music">
            <div className="vinyl-controls">
              <div
                className={`vinyl-wrapper ${isPlaying ? "playing" : ""}`}
              >
                <div className="vinyl">
                  <div className="vinyl-label">
                    <Image
                      src={
                        track?.artworkUrl100?.replace("100x100", "300x300") ??
                        artist.image
                      }
                      alt=""
                      width={100}
                      height={100}
                      quality={100}
                      priority
                      unoptimized
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="play-pause-btn"
                onClick={() => {
                  if (!audioRef.current) return;
                  audioEnabledRef.current = true;
                  if (isPlaying) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                    if (previewTimeoutRef.current) {
                      window.clearTimeout(previewTimeoutRef.current);
                      previewTimeoutRef.current = null;
                    }
                  } else {
                    audioRef.current.play().then(() => setIsPlaying(true));
                  }
                }}
                disabled={!track}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
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

              <div className="track-info">
                <span>PREVIEWING</span>
                <h4>{track?.trackName ?? "—"}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

        <audio
          ref={audioRef}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      </div>

      </div>
    </section>
    </>
  );
}
