export default function ContactSection() {
  return (
    <section id="contact" className="contact-section scroll-panel section">
      <div className="section-content">
      <div className="section-inner">
      <div className="contact-bg" />
      <div className="contact-overlay" />
      <div className="contact-content">
        <h2 className="contact-title">Contact us</h2>
        <div className="contact-info">
          <p>
            <span className="contact-label">EMAIL:</span>{" "}
            <a href="mailto:thesalsette7@gmail.com">THESALSETTE7@GMAIL.COM</a>
          </p>
          <p>
            <span className="contact-label">IG:</span>{" "}
            <a href="https://instagram.com/thesalsette7" target="_blank" rel="noopener noreferrer">
              @THESALSETTE7
            </a>
          </p>
          <p>
            <span className="contact-label">CONTACT NUMBER:</span>{" "}
            <a href="tel:+917259824529">7259824529</a>,{" "}
            <a href="tel:+918879535264">88795 35264</a>,{" "}
            <a href="tel:+917275000683">7275000683</a>
          </p>
        </div>
        <div className="contact-socials">
          <a
            href="https://instagram.com/thesalsette7"
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn"
            aria-label="Instagram"
          >
            <InstagramIcon />
            <span>Instagram</span>
          </a>
        </div>
      </div>
      </div>
      </div>
    </section>
  );
}

function InstagramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
