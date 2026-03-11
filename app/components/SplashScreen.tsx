"use client";

import { useEffect, useRef } from "react";

export default function SplashScreen() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const splashRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const splash = splashRef.current;
    const wrap = wrapRef.current;
    if (!splash || !wrap) return;

    const observer = new MutationObserver(() => {
      if (splash.classList.contains("hero-splash-hidden")) {
        wrap.classList.add("splash-wrap-hidden");
      }
    });

    observer.observe(splash, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="site-splash-wrap" aria-hidden="true">
      <div ref={splashRef} className="hero-splash">
        <div className="hero-splash-bg-lines" />
        <div className="vinyl-stage">
          <div className="vinyl-record">
            <div className="vinyl-reflection"></div>
            <div className="vinyl-grooves"></div>
            <div className="vinyl-label">
              <div className="vinyl-hole"></div>
              <div className="vinyl-text">
                SALSETTE
                <span>MUMBAI</span>
              </div>
            </div>
          </div>
          <div className="vinyl-needle"></div>
        </div>
        <div className="hero-splash-sub">
          SALSETTE&nbsp;&nbsp;·&nbsp;&nbsp;MUMBAI&nbsp;&nbsp;·&nbsp;&nbsp;2025
        </div>
      </div>
    </div>
  );
}