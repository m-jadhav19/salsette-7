"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "./Hero";
import BandSection from "./BandSection";
import ContactSection from "./ContactSection";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollSnapLayout() {
  useEffect(() => {
    const panels = gsap.utils.toArray<HTMLElement>(".section");
    panels.pop(); // exclude last section (Contact) from scale/fade

    panels.forEach((panel, i) => {
      const innerPanel = panel.querySelector<HTMLElement>(".section-inner");
      const contentEl = innerPanel ?? panel;
      const panelHeight = contentEl.offsetHeight;
      const windowHeight = window.innerHeight;
      const difference = panelHeight - windowHeight;

      // ratio for fake-scrolling when content is taller than viewport
      const fakeScrollRatio = difference > 0 ? difference / (difference + windowHeight) : 0;

      if (fakeScrollRatio && panel instanceof HTMLElement) {
        panel.style.marginBottom = `${panelHeight * fakeScrollRatio}px`;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: panel,
          start: "bottom bottom",
          end: fakeScrollRatio ? `+=${contentEl.offsetHeight}` : "bottom top",
          pinSpacing: false,
          pin: true,
          scrub: true,
        },
      });

      // fake scroll through tall content first
      if (fakeScrollRatio && innerPanel) {
        tl.to(
          innerPanel,
          {
            yPercent: -100,
            y: windowHeight,
            duration: 1 / (1 - fakeScrollRatio) - 1,
            ease: "none",
          },
          0
        );
      }

      tl.fromTo(
        panel,
        { scale: 1, opacity: 1 },
        { scale: 0.7, opacity: 0.5, duration: 0.9 },
        fakeScrollRatio ? undefined : 0
      ).to(panel, { opacity: 0, duration: 0.1 });
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <main className="slides-wrapper">
      <Hero />
      <BandSection />
      <ContactSection />
    </main>
  );
}
