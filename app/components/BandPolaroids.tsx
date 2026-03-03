"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/* Same names/roles/photos as BandSection.tsx ARTISTS */
const MEMBERS = [
  { id: 1, name: "MARILYN", role: "Vocals", photo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80&auto=format&fit=crop", tape: "tr" as const },
  { id: 2, name: "DALEER", role: "Vocals", photo: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80&auto=format&fit=crop", tape: "tl" as const },
  { id: 3, name: "ATHARVA", role: "Lead Guitar", photo: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?w=400&q=80&auto=format&fit=crop", tape: "none" as const },
  { id: 4, name: "ABIR", role: "Bass Guitar", photo: "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=400&q=80&auto=format&fit=crop", tape: "tr" as const },
  { id: 5, name: "KARTIK", role: "Drums", photo: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=400&q=80&auto=format&fit=crop", tape: "tl" as const },
  { id: 6, name: "JOANNA", role: "Keyboards", photo: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&q=80&auto=format&fit=crop", tape: "none" as const },
  { id: 7, name: "SAM", role: "Rhythm Guitar", photo: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80&auto=format&fit=crop", tape: "tr" as const },
] as const;

const SLOTS_DESKTOP: [number, number][] = [
  [4, 6], [72, 4], [2, 52], [78, 48], [10, 78], [68, 74], [40, 78],
];
const SLOTS_MOBILE: [number, number][] = [
  [2, 5], [68, 3], [1, 68], [66, 66],
];
const MOBILE_MEMBER_INDICES = [0, 1, 4, 6];

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function randomInRange(min: number, max: number, rand: () => number) {
  return min + rand() * (max - min);
}

type Member = (typeof MEMBERS)[number];

interface PolaroidProps {
  member: Member;
  slot: [number, number];
  index: number;
  seed: number;
  isMobile: boolean;
}

function Polaroid({ member, slot, index, seed, isMobile }: PolaroidProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<gsap.core.Timeline | null>(null);
  const rand = seededRand(seed + index * 7919);

  const jitterX = (rand() - 0.5) * (isMobile ? 2 : 5);
  const jitterY = (rand() - 0.5) * (isMobile ? 2 : 4);
  const baseRot = (rand() - 0.5) * (isMobile ? 16 : 28);
  const size = isMobile ? 0.80 + rand() * 0.14 : 0.88 + rand() * 0.26;
  const delay = 0.3 + index * 0.18 + rand() * 0.25;

  const left = isMobile
    ? `clamp(1vw, ${slot[0] + jitterX}vw, 72vw)`
    : `clamp(2vw, ${slot[0] + jitterX}vw, 88vw)`;
  const top = isMobile
    ? `clamp(1vh, ${slot[1] + jitterY}vh, 82vh)`
    : `clamp(2vh, ${slot[1] + jitterY}vh, 88vh)`;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set(card, {
      x: (rand() - 0.5) * 60,
      y: reduced ? 0 : -180,
      rotate: baseRot + (rand() - 0.5) * 30,
      opacity: reduced ? 1 : 0,
      scale: size * (reduced ? 1 : 0.8),
    });

    if (reduced) return;

    const tl = gsap.timeline({ delay });
    tl.to(card, {
      y: 0, opacity: 1, scale: size, rotate: baseRot,
      duration: 0.55, ease: "power3.in",
    })
    .to(card, {
      scaleY: size * 0.93, scaleX: size * 1.04, rotate: baseRot + (rand() - 0.5) * 4,
      duration: 0.09, ease: "power1.out",
    })
    .to(card, {
      scaleY: size, scaleX: size, rotate: baseRot,
      duration: 0.45, ease: "elastic.out(1, 0.55)",
    });

    const onEnter = () => {
      gsap.to(card, {
        scale: size * 1.08, rotate: baseRot * 0.2, y: -12, zIndex: 50,
        filter: "drop-shadow(0 28px 48px rgba(0,0,0,0.75)) drop-shadow(0 0 0px rgba(196,162,78,0))",
        duration: 0.35, ease: "power2.out", overwrite: "auto",
      });
    };
    const onLeave = () => {
      gsap.to(card, {
        scale: size, rotate: baseRot, y: 0, zIndex: index + 1,
        filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.55))",
        duration: 0.5, ease: "elastic.out(1, 0.5)", overwrite: "auto",
      });
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);
    const onTouchEnd = () => { setTimeout(onLeave, 420); };
    card.addEventListener("touchstart", onEnter, { passive: true });
    card.addEventListener("touchend", onTouchEnd, { passive: true });
    card.addEventListener("touchcancel", onLeave, { passive: true });
    return () => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
      card.removeEventListener("touchstart", onEnter);
      card.removeEventListener("touchend", onTouchEnd);
      card.removeEventListener("touchcancel", onLeave);
    };
  }, []);

  /* Random appear / disappear loop */
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const runCycle = () => {
      const visibleDur = randomInRange(4, 9, rand);
      const hiddenDur = randomInRange(2, 5, rand);
      loopRef.current = gsap.timeline({
        delay: randomInRange(0.5, 3, rand),
        onComplete: runCycle,
      });
      loopRef.current
        .to(card, { opacity: 0, pointerEvents: "none", duration: 0.6, ease: "power2.in" }, visibleDur)
        .to(card, { opacity: 1, pointerEvents: "auto", duration: 0.7, ease: "power2.out" }, `+=${hiddenDur}`);
    };
    runCycle();
    return () => { loopRef.current?.kill(); };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`polaroid polaroid--tape-${member.tape}`}
      style={{
        position: "absolute",
        left,
        top,
        zIndex: index + 1,
        filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.55))",
        cursor: "pointer",
        willChange: "transform, filter",
      }}
    >
      {member.tape !== "none" && (
        <div className={`polaroid__tape polaroid__tape--${member.tape}`} />
      )}
      <div className="polaroid__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={member.photo} alt={member.name} draggable={false} />
        <div className="polaroid__gloss" />
      </div>
      <div className="polaroid__caption">
        <span className="polaroid__name">{member.name}</span>
        <span className="polaroid__role">{member.role}</span>
      </div>
    </div>
  );
}

export default function BandPolaroids() {
  const [seed] = useState(() => 42);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const activePairs = isMobile
    ? MOBILE_MEMBER_INDICES.map((mi, i) => ({
        member: MEMBERS[mi],
        slot: SLOTS_MOBILE[i],
        index: i,
      }))
    : MEMBERS.map((member, i) => ({
        member,
        slot: SLOTS_DESKTOP[i],
        index: i,
      }));

  return (
    <div className="polaroids-field" aria-hidden="true">
      {activePairs.map(({ member, slot, index }) => (
        <Polaroid
          key={`${member.id}-${isMobile ? "m" : "d"}`}
          member={member}
          slot={slot}
          index={index}
          seed={seed}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}
