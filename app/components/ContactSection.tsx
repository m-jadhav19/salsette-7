"use client";

import { useEffect, useRef } from "react";

export default function ContactSection() {
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = cardsRef.current;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll<HTMLElement>(".contact-card"));

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            const delay = Number(card.dataset.delay ?? 0);
            setTimeout(() => card.classList.add("revealed"), delay);
            obs.unobserve(card);
          }
        });
      },
      { threshold: 0.25 }
    );

    cards.forEach((card, i) => {
      card.dataset.delay = String(i * 120);
      obs.observe(card);
    });

    return () => obs.disconnect();
  }, []);

  return (
    <section id="contact" className="contact-section scroll-panel section">
      <div className="section-content">
        <div className="section-inner">
          <div className="contact-bg" />
          <div className="contact-overlay" />

          <div className="contact-content">
            <p className="contact-eyebrow">GET IN TOUCH</p>
            <h2 className="contact-title">
              SALSETTE<em className="contact-title-seven"> 7</em>
            </h2>
            <p className="contact-sub">Seven Mumbai kids. Book us for your next gig.</p>

            <div className="contact-cards" ref={cardsRef}>
              <a href="mailto:thesalsette7@gmail.com" className="contact-card">
                <span className="contact-card-icon"><EmailIcon /></span>
                <span className="contact-card-label">EMAIL</span>
                <span className="contact-card-value">thesalsette7@gmail.com</span>
              </a>

              <a
                href="https://instagram.com/thesalsette7"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card"
              >
                <span className="contact-card-icon"><InstagramIcon /></span>
                <span className="contact-card-label">INSTAGRAM</span>
                <span className="contact-card-value">@thesalsette7</span>
              </a>

              <div className="contact-card contact-card--phone">
                <span className="contact-card-icon"><PhoneIcon /></span>
                <span className="contact-card-label">CALL US</span>
                <div className="contact-phones">
                  <a href="tel:+917259824529">7259824529</a>
                  <a href="tel:+918879535264">8879535264</a>
                  <a href="tel:+917275000683">7275000683</a>
                </div>
              </div>
            </div>

            <div className="contact-divider" />
            <p className="contact-footer-text">Mumbai · Est. 2025</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
    </svg>
  );
}
