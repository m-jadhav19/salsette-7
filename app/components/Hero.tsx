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

      const content = document.querySelector(".title-group");

      const handleMouseMove = (e: MouseEvent) => {
        if (!content) return;
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;

        gsap.to(content, {
          rotateY: x * 40,
          rotateX: -y * 40,
          duration: 0.8,
          ease: "power2.out",
        });
      };

      window.addEventListener("mousemove", handleMouseMove);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
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

