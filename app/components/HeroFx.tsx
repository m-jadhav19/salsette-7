/**
 * HeroFx.tsx – animation helpers for the Salsette 7 hero section.
 * Isolated here to keep the component file lean.
 */

import gsap from "gsap";

// ─── Timing constants ────────────────────────────────────────────────────────
export const FX = {
  SEVEN_REVEAL_DURATION:  1.2,
  SEVEN_REVEAL_DELAY:     0.4,
  SLIDE_DURATION:         0.55,
  CHAR_STAGGER_AMOUNT:    0.26,
  CHAR_DURATION:          0.22,
  SWEEP_TRAVEL:           0.5,
  TAG_STAGGER_AMOUNT:     0.24,
  TAG_CHAR_DURATION:      0.24,
  CTA_STAGGER:            0.09,
  CTA_DURATION:           0.42,
  SCROLL_CUE_DURATION:    0.38,
  TILT_STRENGTH_BASE:     9,
  TILT_STRENGTH_SCALE:    110,
  TILT_STRENGTH_MAX:      18,
} as const;

// ─── Gradient utilities ───────────────────────────────────────────────────────

/**
 * Linearly interpolates between evenly-spaced hex colour stops at t ∈ [0,1].
 */
export function sampleGradient(stops: string[], t: number): string {
  const clamped  = Math.max(0, Math.min(1, t));
  const segments = stops.length - 1;
  const scaled   = clamped * segments;
  const idx      = Math.min(Math.floor(scaled), segments - 1);
  const frac     = scaled - idx;

  const parse = (hex: string): [number, number, number] | null => {
    const c = hex.replace("#", "");
    if (c.length !== 6) return null;
    return [
      parseInt(c.slice(0, 2), 16),
      parseInt(c.slice(2, 4), 16),
      parseInt(c.slice(4, 6), 16),
    ];
  };

  const a = parse(stops[idx]);
  const b = parse(stops[idx + 1]);
  if (!a || !b) return stops[idx] ?? "#ffffff";

  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * frac)},${Math.round(
    a[1] + (b[1] - a[1]) * frac
  )},${Math.round(a[2] + (b[2] - a[2]) * frac)})`;
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

/**
 * Splits element text into per-character <span class="char"> nodes.
 * Spaces become char--space spans to preserve natural word spacing.
 *
 * When gradientStops is provided each char receives a background-clip
 * gradient slice sampled from its proportional position across the word,
 * faithfully reconstructing the original multi-colour gradient after splitting.
 */
export function splitIntoChars(
  el: HTMLElement,
  gradientStops?: string[]
): HTMLElement[] {
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

  const chars = Array.from(
    el.querySelectorAll<HTMLElement>(".char:not(.char--space)")
  );

  if (gradientStops && gradientStops.length >= 2) {
    const total = chars.length;
    chars.forEach((span, i) => {
      const centre = total === 1 ? 0.5 : i / (total - 1);
      const half   = 0.8 / Math.max(total - 1, 1);
      const colA   = sampleGradient(gradientStops, centre - half * 0.5);
      const colB   = sampleGradient(gradientStops, centre + half * 0.5);

      span.style.background           = `linear-gradient(175deg, ${colA} 0%, ${colB} 100%)`;
      span.style.webkitBackgroundClip = "text";
      span.style.backgroundClip       = "text";
      span.style.webkitTextFillColor  = "transparent";
    });
  }

  return chars;
}

// ─── Sweep factory ────────────────────────────────────────────────────────────

interface SweepElements {
  sharp: HTMLElement;
  glow:  HTMLElement;
}

/**
 * Returns a reusable GSAP tween factory for the light-sweep effect.
 * Separating this avoids duplicating the 3 set/to/to calls inline.
 */
export function buildSweepSequence(
  tl: gsap.core.Timeline,
  { sharp, glow }: SweepElements,
  insertAt: string | number = ">"
) {
  tl.set(sharp, { opacity: 1 }, insertAt)
    .to(sharp, { left: "160%", duration: FX.SWEEP_TRAVEL, ease: "power2.in" }, ">+0.04")
    .to(sharp, { opacity: 0, duration: 0.12, ease: "none" }, "-=0.12")
    .set(glow,  { left: "-80%", opacity: 0 }, "<-0.45")
    .to(glow,   { left: "180%", opacity: 0.6, duration: 0.75, ease: "power1.out" }, "<")
    .to(glow,   { opacity: 0, duration: 0.28, ease: "power2.in" }, "-=0.28");
}

// ─── Glitch / stutter helpers ─────────────────────────────────────────────────

/**
 * Adds 2–3 micro-stutter keyframes to a tween that slides `el` from
 * `startX` to 0, giving a broken-machine judder before settling.
 *
 * Returns the full x keyframe array for use with gsap `keyframes`.
 */
export function stutterSlideKeyframes(startX: string): gsap.TweenVars["keyframes"] {
  return [
    { x: startX,          duration: 0 },
    { x: "calc(6vw)",     duration: 0.08, ease: "steps(1)" },
    { x: "calc(10vw)",    duration: 0.06, ease: "steps(1)" },
    { x: "calc(3vw)",     duration: 0.07, ease: "steps(1)" },
    { x: 0,               duration: 0.34, ease: "expo.out"  },
  ];
}

/**
 * Chromatic-aberration flash: briefly splits the element into
 * R/G/B channels by toggling a CSS class that drives a text-shadow.
 * Cleans itself up after `duration` ms.
 */
export function chromaticFlash(
  el: HTMLElement,
  duration = 220
): void {
  el.classList.add("chroma-flash");
  setTimeout(() => el.classList.remove("chroma-flash"), duration);
}
