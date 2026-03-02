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
    const panels = gsap.utils.toArray<HTMLElement>(".scroll-panel");

    panels.forEach((panel, i) => {
      const isFirst = i === 0;
      const target = panel.querySelector<HTMLElement>(".panel-inner") ?? panel;
      const scrollTL = gsap.timeline({
        scrollTrigger: {
          trigger: panel,
          start: "top top",
          end: "bottom top",
          pin: true,
          pinSpacing: true,
          scrub: 1,
          snap: 1,
          anticipatePin: 1,
        },
      });

      scrollTL.fromTo(
        target,
        isFirst ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1 },
        0
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <main>
      <Hero />
      <BandSection />
      <ContactSection />
    </main>
  );
}
