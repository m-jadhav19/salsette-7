"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function SiteNav() {
  const navRef = useRef<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", menuOpen);
    return () => document.body.classList.remove("nav-menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const heroEl = document.getElementById("hero");
    const bandEl = document.getElementById("band");
    const contactEl = document.getElementById("contact");

    const FADE_START = 0;
    const FADE_END = 420;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = heroEl ? heroEl.getBoundingClientRect().height : window.innerHeight;
      const fadeEnd = Math.min(FADE_END, heroHeight * 0.45);
      const progress = Math.min(1, Math.max(0, (scrollY - FADE_START) / fadeEnd));
      nav.style.opacity = String(progress);
      nav.style.pointerEvents = progress > 0.02 ? "auto" : "none";

      const pastHero = scrollY > 60;
      const bandTop = bandEl ? bandEl.getBoundingClientRect().top : Infinity;
      const contactTop = contactEl ? contactEl.getBoundingClientRect().top : Infinity;
      const inBandOrContact =
        bandTop < window.innerHeight * 0.5 || contactTop < window.innerHeight * 0.5;
      nav.classList.toggle("scrolled", pastHero || inBandOrContact);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav ref={navRef} className={`site-nav${menuOpen ? " site-nav--menu-open" : ""}`} aria-label="Main">
      <Link href="#hero" className="nav-logo" onClick={closeMenu}>
        Salsette 7
      </Link>
      <button
        type="button"
        className="nav-hamburger"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen ? "true" : "false"}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className="nav-hamburger-inner">
          <span className="nav-hamburger-line nav-hamburger-line--1" />
          <span className="nav-hamburger-line nav-hamburger-line--2" />
          <span className="nav-hamburger-line nav-hamburger-line--3" />
        </span>
      </button>
      <ul className="nav-links">
        <li>
          <Link href="#hero" onClick={closeMenu}>Home</Link>
        </li>
        <li>
          <Link href="#band" onClick={closeMenu}>Artists</Link>
        </li>
        <li>
          <Link href="#contact" onClick={closeMenu}>Contact</Link>
        </li>
      </ul>
    </nav>
  );
}
