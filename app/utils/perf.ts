/**
 * Performance logging — use ?perf=1 in the URL or run in dev to see [Perf] logs.
 * Helps find lag: marks, measures, slow ops, and optional FPS/long-task hints.
 */

const PREFIX = "[Perf]";
const SLOW_MS = 50;

function enabled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location?.search?.includes("perf=1"))
  );
}

export function mark(name: string): void {
  if (!enabled()) return;
  try {
    performance.mark(name);
  } catch {
    // ignore
  }
}

export function measure(name: string, startMark: string, endMark?: string): number {
  if (!enabled()) return 0;
  try {
    const measureName = `perf-${name}`;
    performance.measure(measureName, startMark, endMark);
    const entry = performance.getEntriesByName(measureName, "measure")[0];
    const ms = entry?.duration ?? 0;
    performance.clearMarks(startMark);
    if (endMark) performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    return ms;
  } catch {
    return 0;
  }
}

export function logMeasure(name: string, startMark: string, endMark?: string): number {
  const ms = measure(name, startMark, endMark);
  if (ms > 0) {
    const slow = ms >= SLOW_MS ? " [SLOW]" : "";
    console.log(`${PREFIX} ${name}: ${ms.toFixed(1)}ms${slow}`);
  }
  return ms;
}

export function log(msg: string, detail?: Record<string, unknown>): void {
  if (!enabled()) return;
  if (detail) console.log(`${PREFIX} ${msg}`, detail);
  else console.log(`${PREFIX} ${msg}`);
}

export function logSlow(label: string, ms: number): void {
  if (!enabled() || ms < SLOW_MS) return;
  console.warn(`${PREFIX} [SLOW] ${label}: ${ms.toFixed(1)}ms`);
}

/** Run a function and log its duration; returns the result. */
export function timed<T>(label: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const ms = performance.now() - start;
    if (enabled()) {
      if (ms >= SLOW_MS) console.warn(`${PREFIX} [SLOW] ${label}: ${ms.toFixed(1)}ms`);
      else console.log(`${PREFIX} ${label}: ${ms.toFixed(1)}ms`);
    }
  }
}

/** Async version: run and log duration. */
export async function timedAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const ms = performance.now() - start;
    if (enabled()) {
      if (ms >= SLOW_MS) console.warn(`${PREFIX} [SLOW] ${label}: ${ms.toFixed(1)}ms`);
      else console.log(`${PREFIX} ${label}: ${ms.toFixed(1)}ms`);
    }
  }
}

/** Throttled sampler: log at most every N calls (e.g. parallax every 60th). */
export function sampleLog(name: string, everyN: number): () => void {
  let count = 0;
  return () => {
    count++;
    if (enabled() && count % everyN === 0) {
      console.log(`${PREFIX} ${name} (every ${everyN}): count=${count}`);
    }
  };
}

/** Start a simple FPS counter that logs every 2s when enabled. */
export function startFPSLogger(intervalMs = 2000): () => void {
  if (!enabled() || typeof window === "undefined") return () => {};
  let frames = 0;
  let last = performance.now();
  let cancelled = false;
  const id = setInterval(() => {
    if (cancelled) return;
    const now = performance.now();
    const elapsed = (now - last) / 1000;
    const fps = elapsed > 0 ? (frames / elapsed).toFixed(1) : "0";
    console.log(`${PREFIX} FPS: ${fps} (${frames} frames in ${(elapsed * 1000).toFixed(0)}ms)`);
    frames = 0;
    last = now;
  }, intervalMs);
  function tick() {
    if (cancelled) return;
    frames++;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    clearInterval(id);
  };
}
