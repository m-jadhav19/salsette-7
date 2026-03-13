"use client";

import { useEffect, useRef } from "react";
import SiteNav from "./SiteNav";
import Hero from "./Hero";
import BandSection from "./BandSection";
import ContactSection from "./ContactSection";

const PARALLAX_FACTOR = 0.08;

export default function ParallaxLayout() {
  const mainRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const tickingRef = useRef(false);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const sections = main.querySelectorAll<HTMLElement>(".section");
    const contentSelector = ".section-content";

    // Start at top on refresh
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const update = () => {
      tickingRef.current = false;
      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;

      sections.forEach((section) => {
        const content = section.querySelector<HTMLElement>(contentSelector);
        if (!content) return;

        const rect = section.getBoundingClientRect();
        const sectionMid = rect.top + rect.height / 2;
        const viewportMid = viewportH / 2;
        const progress = (viewportMid - sectionMid) / (viewportH + rect.height);
        const clamped = Math.max(-0.4, Math.min(0.4, progress));
        const translateY = clamped * rect.height * PARALLAX_FACTOR;

        content.style.transform = `translate3d(0,${translateY}px,0)`;
      });
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      sections.forEach((section) => {
        const content = section.querySelector<HTMLElement>(contentSelector);
        if (content) content.style.transform = "";
      });
    };
  }, []);

  return (
    <>
      <SiteNav />
      <main ref={mainRef} className="slides-wrapper" role="main">
        <Hero />
        <BandSection />
        <ContactSection />
      </main>
    </>
  );
}
