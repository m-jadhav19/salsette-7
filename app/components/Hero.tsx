"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(".seven", {
        scale: 8,
        opacity: 0,
        duration: 1.5,
      })
        .to(".seven", {
          scale: 0.9,
          duration: 0.35,
          ease: "power2.inOut",
        })
        .to(".seven", {
          scale: 1,
          duration: 0.7,
          ease: "elastic.out(1,0.6)",
        })
        .from(
          ".salsette",
          {
            y: 120,
            opacity: 0,
            duration: 1.2,
          },
          "-=1"
        )
        .to(
          ".light-sweep",
          {
            left: "150%",
            duration: 1.2,
            ease: "power2.inOut",
          },
          "-=0.4"
        )
        .from(
          ".tagline",
          {
            y: 40,
            opacity: 0,
            duration: 1,
          },
          "-=0.6"
        )
        .fromTo(
          ".cta a, .cta button",
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.2,
            duration: 0.8,
          },
          "-=0.6"
        );

      const content = document.querySelector(".title-group") as HTMLElement | null;
      if (!content) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tiltStrength = prefersReducedMotion ? 0 : Math.min(24, 12 + window.innerWidth / 80);
      let rafId = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        targetX = (e.clientX / window.innerWidth - 0.5) * tiltStrength;
        targetY = (e.clientY / window.innerHeight - 0.5) * -tiltStrength;
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          gsap.to(content, {
            rotateY: targetX,
            rotateX: targetY,
            duration: 0.6,
            ease: "power2.out",
            overwrite: true,
          });
        });
      };

      const handleMouseLeave = () => {
        gsap.to(content, {
          rotateY: 0,
          rotateX: 0,
          duration: 0.8,
          ease: "power2.out",
        });
      };

      heroRef.current.addEventListener("mousemove", handleMouseMove, { passive: true });
      heroRef.current.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        heroRef.current?.removeEventListener("mousemove", handleMouseMove);
        heroRef.current?.removeEventListener("mouseleave", handleMouseLeave);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="hero scroll-panel section">
      <div className="section-content">
        <div className="section-inner">
          <div className="depth-layer" />
          <div className="bg-glow" />
          <div className="hero-content">
        <div className="title-wrapper">
          <div className="title-group">
            <h1 className="salsette">SALSETTE</h1>
            <h1 className="seven">7</h1>
            <div className="light-sweep" />
          </div>
        </div>
        <p className="tagline">
          Seven Mumbai kids. Since 2025.
          <br />
          Rock, jazz, blues and controlled chaos.
        </p>

        <div className="cta">
          <a href="#contact">BOOK US</a>
        </div>
          </div>
          <div className="grain" />
        </div>
      </div>
    </section>
  );
}

