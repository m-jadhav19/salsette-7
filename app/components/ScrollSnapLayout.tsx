"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { log, timed, startFPSLogger } from "../utils/perf";
import Hero from "./Hero";
import BandSection from "./BandSection";
import ContactSection from "./ContactSection";

gsap.registerPlugin(ScrollTrigger);

const MOBILE_BREAKPOINT = 768;

export default function ScrollSnapLayout() {
  useEffect(() => {
    log("ScrollSnapLayout: mount");
    const stopFPS = startFPSLogger(4000);

    const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
    if (isMobile()) {
      log("ScrollSnapLayout: mobile — ScrollTrigger skipped");
      return stopFPS;
    }

    timed("ScrollTrigger setup", () => {
      const panels = gsap.utils.toArray<HTMLElement>(".section");
      panels.pop();
      log(`ScrollSnapLayout: ${panels.length} panels`);

      panels.forEach((panel) => {
      const innerPanel = panel.querySelector<HTMLElement>(".section-inner");
      const contentEl = innerPanel ?? panel;
      const panelHeight = contentEl.offsetHeight;
      const windowHeight = window.innerHeight;
      const difference = panelHeight - windowHeight;
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
          scrub: 1.5,
          anticipatePin: 1,
        },
      });

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

      const scaleTarget = panel.querySelector<HTMLElement>(".section-content") ?? panel;
      tl.fromTo(
        scaleTarget,
        { scale: 1, opacity: 1 },
        { scale: 0.7, opacity: 0.5, duration: 0.9 },
        fakeScrollRatio ? undefined : 0
      ).to(scaleTarget, { opacity: 0, duration: 0.1 });
      });
    });

    const onResize = () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        ScrollTrigger.getAll().forEach((st) => st.kill());
      } else {
        ScrollTrigger.refresh();
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      stopFPS();
      window.removeEventListener("resize", onResize);
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
