import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── Intersection Observer helper ──────────────────────────────────────── */
function useRevealOnScroll(className = '.will-reveal') {
  useEffect(() => {
    const els = document.querySelectorAll(className);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-revealed'); }),
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── FAQ Item ───────────────────────────────────────────────────────────── */
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef(null);

  const toggle = () => setOpen((o) => !o);

  useEffect(() => {
    if (!bodyRef.current) return;
    if (open) {
      bodyRef.current.style.maxHeight = bodyRef.current.scrollHeight + 'px';
      bodyRef.current.style.opacity = '1';
    } else {
      bodyRef.current.style.maxHeight = '0px';
      bodyRef.current.style.opacity = '0';
    }
  }, [open]);

  return (
    <div className="faq-item">
      <button className="faq-summary" onClick={toggle} aria-expanded={open}>
        <span>{q}</span>
        <span className={`faq-chevron ${open ? 'open' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div ref={bodyRef} className="faq-body">
        <p>{a}</p>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────────────────── */
const HomePage = () => {
  const preloaderRef    = useRef(null);
  const heroRef         = useRef(null);
  const titleRef        = useRef(null);
  const photoStackRef   = useRef(null);
  const manifestoRef    = useRef(null);
  const featuresRef     = useRef(null);
  const methodRef       = useRef(null);
  const faqRef          = useRef(null);
  const ctaRef          = useRef(null);

  useRevealOnScroll();

  /* ── GSAP Animations ─────────────────────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {

      /* 1. Preloader text stagger reveal */
      gsap.fromTo('.preloader-line', {
        y: 50,
        opacity: 0,
        clipPath: 'inset(100% 0 0 0)',
      }, {
        y: 0,
        opacity: 1,
        clipPath: 'inset(0% 0 0 0)',
        duration: 0.9,
        stagger: 0.18,
        ease: 'power3.out',
        delay: 0.3,
      });

      /* 2. Giant brand title parallax on scroll */
      if (titleRef.current) {
        gsap.to(titleRef.current, {
          y: -120,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      /* 3. Photo stack parallax — different speeds per layer */
      const photos = document.querySelectorAll('.photo-layer');
      photos.forEach((photo, i) => {
        const speeds = [0.25, 0.45, 0.65];
        gsap.to(photo, {
          y: -(80 + i * 40) * speeds[i],
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      /* 4. Manifesto headline counter / reveal */
      gsap.fromTo('.manifesto-huge', {
        x: -60,
        opacity: 0,
      }, {
        x: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: manifestoRef.current,
          start: 'top 75%',
        },
      });

      /* 5. Feature cards 3D flip on scroll */
      const cards = gsap.utils.toArray('.feature-item');
      cards.forEach((card, idx) => {
        gsap.fromTo(card, {
          rotationX: 45, // tilt backward
          rotationY: idx % 2 === 0 ? -12 : 12, // subtle twist
          z: -80,
          opacity: 0,
          scale: 0.9,
          transformOrigin: "top center",
        }, {
          rotationX: 0,
          rotationY: 0,
          z: 0,
          opacity: 1,
          scale: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 95%',
            end: 'top 70%',
            scrub: 0.8,
          },
        });
      });


      /* 6. Method steps slide in */
      gsap.fromTo('.method-step', {
        x: -60,
        opacity: 0,
      }, {
        x: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: methodRef.current,
          start: 'top 70%',
        },
      });

      /* 7. CTA section */
      gsap.fromTo('.cta-headline', {
        y: 80,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 75%',
        },
      });

    });

    return () => ctx.revert();
  }, []);

  const FAQ_DATA = [
    { q: 'How do I start logging my trips?', a: 'Create a free account, hit "Log New Trip," fill in your destination and dates, then add photos, notes, and ratings. Your diary is saved instantly.' },
    { q: 'Can I share trips with friends?', a: 'Yes — set any trip to "Public" to appear in Explore search and share a direct link. Use Social Feed to follow other travelers and see their public itineraries.' },
    { q: 'What are AI Recommendations?', a: 'Our algorithm analyzes the destinations you\'ve rated highly — the tags you love (food, scenery, culture) — and surfaces new places that match your travel DNA.' },
    { q: 'Is my data private?', a: 'By default, all trips are private and visible only to you. You control visibility per trip. Your account data is never sold to third parties.' },
    { q: 'Can I export my travel data?', a: 'Full data export is on the roadmap. For now, your photos, trip notes, and ratings are all stored in your profile and accessible at any time.' },
  ];

  return (
    <div className="home-page">

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 0 — Preloader / Manifesto Intro (dark forest)            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="preloader-section" ref={preloaderRef}>
        <div className="preloader-content">
          <p className="preloader-line preloader-white">TO EXPLORE WITHOUT BOUNDARIES.</p>
          <p className="preloader-line preloader-white">TO REMEMBER WITHOUT FORGETTING.</p>
          <p className="preloader-line">
            AND TO DISCOVER,&nbsp;
            <span className="preloader-pink">TO TRULY LIVE.</span>
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 1 — Hero: Giant Brand + Photo Stack                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="hero-section" ref={heroRef}>
        {/* Giant brand title — overflows, clipped by section */}
        <div className="hero-brand-title" ref={titleRef}>
          TRAVEL<br />DIARY
        </div>

        <div className="hero-body">
          {/* Left: Caption + CTA */}
          <div className="hero-left">
            <p className="hero-label">Your travel companion</p>
            <div className="hero-headline">
              <span className="hero-hl-ghost">EVERY</span>
              <span className="hero-hl-loud">JOURNEY</span>
            </div>
            <p className="hero-desc prose">
              Log adventures. Store memories. Rate every place you visit — and let AI guide you to the next great destination.
            </p>
            <div className="hero-actions">
              <Link to="/register" id="hero-start-btn" className="btn btn-primary btn-lg">
                Start your diary
              </Link>
              <Link to="/login" id="hero-login-link" className="btn-text-link">
                Sign in →
              </Link>
            </div>
          </div>

          {/* Center: Stacked photos with parallax */}
          <div className="hero-photos" ref={photoStackRef}>
            <div className="photo-stack">
              <div className="photo-layer photo-back">
                <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=360&h=540&fit=crop&q=80" alt="Travel" loading="lazy" />
              </div>
              <div className="photo-layer photo-mid">
                <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=340&h=520&fit=crop&q=80" alt="Adventure" loading="lazy" />
              </div>
              <div className="photo-layer photo-front">
                <img src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=320&h=500&fit=crop&q=80" alt="Journey" loading="lazy" />
              </div>
              {/* Floating lightning bolt — accent element */}
              <div className="float-badge float-badge-tl">
                <span>⚡</span>
              </div>
              <div className="float-badge float-badge-br">
                <span>✈</span>
              </div>
            </div>
          </div>

          {/* Bottom-right: Featured trip sticky card */}
          <div className="featured-card">
            <div className="featured-card-inner">
              <p className="featured-label">Featured Trip</p>
              <p className="featured-title">AMALFI COAST</p>
              <p className="featured-sub">Italy · 7 days</p>
              <Link to="/register" id="hero-view-btn" className="btn btn-primary btn-sm">
                View diary
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 2 — Cotton Pink: Video / Image Banner                     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="pink-banner-section">
        <div className="pink-banner-headline">
          <span className="pb-ghost">HUMAN</span>
          <span className="pb-loud">SOCIAL</span>
        </div>
        <div className="pink-banner-photo">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=800&fit=crop&q=80"
            alt="Travel explorer"
            loading="lazy"
          />
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 3 — Manifesto                                             */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="manifesto-section" ref={manifestoRef}>
        <div className="manifesto-inner">
          <div className="manifesto-opener will-reveal">
            <p className="manifesto-small-label">Our mission</p>
            <h2 className="manifesto-hook">
              We capture your journeys,
            </h2>
          </div>

          <div className="manifesto-body will-reveal">
            <p className="prose">
              At Travel Diary, we believe every trip deserves to be documented, shared, and remembered. Not just as a photo dump — but as a story worth telling. Your adventures deserve an archive as bold as the journeys themselves.
            </p>
          </div>

          <div className="manifesto-huge-block">
            <p className="manifesto-huge display-text display-ghost">WE MAKE THEM</p>
            <p className="manifesto-huge display-text display-pink">UNFORGETTABLE</p>
          </div>

          <div className="manifesto-statement will-reveal">
            <p className="manifesto-stat-line">It's the impact of your authenticity.</p>
            <p className="manifesto-stat-line manifesto-stat-accent">
              It's documenting precisely and <span>LIVING BOLDLY.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 4 — Features / Expertises                                 */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="features-section" ref={featuresRef}>
        <div className="features-header will-reveal">
          <h2 className="features-headline display-text">
            Think clearly<br/>to <span className="display-pink">travel freely.</span>
          </h2>
        </div>
        <div className="features-grid">
          {[
            { num: '01', title: 'Trip Logging', desc: 'Record every destination with photos, dates, rich descriptions, and star ratings.' },
            { num: '02', title: 'Photo Journals', desc: 'Your visual memories organized by trip, destination, and date — always beautiful.' },
            { num: '03', title: 'AI Suggestions', desc: 'Your personal travel DNA analyzed to surface destinations you\'ll love next.' },
            { num: '04', title: 'Social Sharing', desc: 'Follow fellow explorers, share public itineraries, and inspire each other.' },
          ].map((f) => (
            <div key={f.num} className="feature-item">
              <span className="feature-num display-text display-ghost">{f.num}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc prose">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 5 — Method / How It Works                                 */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="method-section" ref={methodRef}>
        <div className="method-header will-reveal">
          <h2 className="method-headline display-text">
            WE WILL ALWAYS<br/>PREFER THIS ORDER.
          </h2>
        </div>

        <div className="method-steps">
          {[
            { num: '01', verb: 'LOG', desc: 'Open your diary and capture the destination, the date, and every detail worth keeping. Add photos, add notes, add a rating.' },
            { num: '02', verb: 'DISCOVER', desc: 'Search thousands of destinations, explore your world map, and let our AI recommendation engine surprise you with new places.' },
            { num: '03', verb: 'SHARE', desc: 'Make trips public, follow fellow explorers on the Social Feed, and build a community of travelers who inspire each other.' },
          ].map((step) => (
            <div key={step.num} className="method-step">
              <div className="method-step-left">
                <span className="method-num display-text display-ghost">{step.num}</span>
                <span className="method-verb display-text display-pink">{step.verb}</span>
              </div>
              <p className="method-desc prose">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="method-submanifesto will-reveal">
          <p className="prose">
            At Travel Diary, each journey follows a clear path: log your experiences, discover new places through AI-powered recommendations, and share your stories with fellow travelers.
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 6 — FAQ                                                    */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="faq-section" ref={faqRef}>
        <h2 className="faq-headline display-text will-reveal">
          SMALL QUESTIONS,<br/>BIG ANSWERS.
        </h2>
        <div className="faq-list">
          {FAQ_DATA.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 7 — CTA Footer                                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="cta-section" ref={ctaRef}>
        <div className="cta-inner">
          <p className="cta-headline display-text">CONTACT</p>
          <p className="cta-sub">Tell us about your next adventure.</p>
          <div className="cta-actions">
            <Link to="/register" id="cta-register-btn" className="btn btn-primary btn-lg">
              Get started
            </Link>
            <Link to="/login" id="cta-login-link" className="btn-text-link">
              Sign in →
            </Link>
          </div>
        </div>
        <div className="cta-footer-row">
          <span>© 2024 Travel Diary. All rights reserved.</span>
          <span>Log. Remember. Discover.</span>
        </div>
      </section>

      <style>{`
        /* ── Page container ─────────────────────────────────────────── */
        .home-page {
          width: 100%;
          overflow-x: hidden;
        }

        /* ── Text link (ghost with underline hover) ─────────────────── */
        .btn-text-link {
          font-family: var(--font-grotesk);
          font-size: 15px;
          font-weight: 500;
          color: var(--color-forest);
          text-decoration: none;
          padding: 4px 0;
          border-bottom: 1px solid var(--color-blush);
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .btn-text-link:hover {
          color: var(--color-lipstick);
          border-color: var(--color-lipstick);
        }

        /* ─────────────────────────────────────────────────────────────── */
        /* SECTION 0 — Preloader                                           */
        /* ─────────────────────────────────────────────────────────────── */
        .preloader-section {
          width: 100%;
          min-height: 100vh;
          background: var(--color-forest);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 60px;
        }
        .preloader-content {
          text-align: center;
          max-width: 900px;
        }
        .preloader-line {
          font-family: var(--font-beni);
          font-size: clamp(20px, 3vw, 36px);
          font-weight: 700;
          text-transform: uppercase;
          line-height: 0.85;
          letter-spacing: 0.04em;
          margin-bottom: 14px;
          color: var(--color-chalk);
          opacity: 0; /* GSAP animates this */
        }
        .preloader-white { color: var(--color-chalk); }
        .preloader-pink  { color: var(--color-lipstick); }

        /* ─────────────────────────────────────────────────────────────── */
        /* SECTION 1 — Hero                                                 */
        /* ─────────────────────────────────────────────────────────────── */
        .hero-section {
          position: relative;
          min-height: 100vh;
          background: var(--color-chalk);
          overflow: hidden;
          padding: 80px 60px 120px;
        }

        /* Giant overflowing brand title */
        .hero-brand-title {
          font-family: var(--font-beni);
          font-size: clamp(120px, 20vw, 230px);
          font-weight: 700;
          line-height: 0.70;
          text-transform: uppercase;
          color: var(--color-forest);
          position: absolute;
          top: -20px;
          left: 60px;
          right: 0;
          z-index: 0;
          pointer-events: none;
          user-select: none;
          letter-spacing: -0.02em;
        }

        /* Body content sits in front of the giant title */
        .hero-body {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 60px;
          align-items: flex-end;
          min-height: 85vh;
          padding-top: clamp(140px, 22vw, 280px);
        }

        /* Left column */
        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .hero-label {
          font-family: var(--font-grotesk);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .hero-headline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .hero-hl-ghost {
          font-family: var(--font-beni);
          font-size: clamp(60px, 10vw, 130px);
          font-weight: 700;
          line-height: 0.75;
          text-transform: uppercase;
          color: var(--color-blush);
          letter-spacing: -0.01em;
        }
        .hero-hl-loud {
          font-family: var(--font-beni);
          font-size: clamp(60px, 10vw, 130px);
          font-weight: 700;
          line-height: 0.75;
          text-transform: uppercase;
          color: var(--color-lipstick);
          letter-spacing: -0.01em;
        }
        .hero-desc {
          margin-top: 8px;
        }
        .hero-actions {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        /* Photo stack */
        .hero-photos {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .photo-stack {
          position: relative;
          width: 340px;
          height: 520px;
        }
        .photo-layer {
          position: absolute;
          border-radius: 20px;
          overflow: hidden;
        }
        .photo-back {
          width: 280px;
          height: 420px;
          top: 30px;
          left: -40px;
          transform: rotate(-4deg);
          z-index: 1;
        }
        .photo-mid {
          width: 280px;
          height: 430px;
          top: 20px;
          left: 20px;
          transform: rotate(1.5deg);
          z-index: 2;
        }
        .photo-front {
          width: 260px;
          height: 400px;
          top: 60px;
          right: -20px;
          transform: rotate(3deg);
          z-index: 3;
        }
        .photo-layer img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Floating accent badges */
        .float-badge {
          position: absolute;
          background: var(--color-blush);
          border-radius: var(--radius-full);
          padding: 8px 14px;
          font-size: 20px;
          z-index: 10;
          animation: floatBob 3s ease-in-out infinite;
        }
        .float-badge-tl { top: 10px; left: -20px; animation-delay: 0s; }
        .float-badge-br { bottom: 40px; right: -10px; animation-delay: 1.5s; }
        @keyframes floatBob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }

        /* Featured trip card */
        .featured-card {
          position: fixed;
          bottom: 32px;
          right: 24px;
          z-index: 100;
          width: 220px;
        }
        .featured-card-inner {
          background: #fff;
          border: 1px solid var(--color-blush);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .featured-label {
          font-family: var(--font-grotesk);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        .featured-title {
          font-family: var(--font-beni);
          font-size: 24px;
          font-weight: 700;
          text-transform: uppercase;
          line-height: 0.85;
          color: var(--color-lipstick);
        }
        .featured-sub {
          font-family: var(--font-grotesk);
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        /* ─────────────────────────────────────────────────────────────── */
        /* SECTION 2 — Pink Banner                                          */
        /* ─────────────────────────────────────────────────────────────── */
        .pink-banner-section {
          background: var(--color-cotton);
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 80px 60px;
          gap: 40px;
          position: relative;
          overflow: hidden;
        }
        .pink-banner-headline {
          display: flex;
          flex-direction: column;
        }
        .pb-ghost {
          font-family: var(--font-beni);
          font-size: clamp(80px, 14vw, 160px);
          font-weight: 700;
          text-transform: uppercase;
          line-height: 0.75;
          color: rgba(255,248,246,0.4);
          letter-spacing: -0.01em;
        }
        .pb-loud {
          font-family: var(--font-beni);
          font-size: clamp(80px, 14vw, 160px);
          font-weight: 700;
          text-transform: uppercase;
          line-height: 0.75;
          color: var(--color-chalk);
          letter-spacing: -0.01em;
        }
        .pink-banner-photo {
          display: flex;
          justify-content: center;
        }
        .pink-banner-photo img {
          width: 360px;
          height: 540px;
          object-fit: cover;
          border-radius: 20px;
        }

        /* ─────────────────────────────────────────────────────────────── */
        /* SECTION 3 — Manifesto                                            */
        /* ─────────────────────────────────────────────────────────────── */
        .manifesto-section {
          background: var(--color-chalk);
          padding: var(--space-section) 60px;
        }
        .manifesto-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 80px;
        }

        .manifesto-opener {}
        .manifesto-small-label {
          font-family: var(--font-grotesk);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        .manifesto-hook {
          font-family: var(--font-grotesk);
          font-size: clamp(24px, 4vw, 46px);
          font-weight: 700;
          color: var(--color-forest);
          line-height: 1.2;
          max-width: 600px;
        }

        .manifesto-huge-block {
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow: hidden;
        }
        .manifesto-huge {
          font-size: clamp(50px, 10vw, 130px) !important;
          display: block;
          letter-spacing: -0.02em;
        }

        .manifesto-statement {}
        .manifesto-stat-line {
          font-family: var(--font-grotesk);
          font-size: clamp(20px, 3vw, 36px);
          font-weight: 700;
          color: var(--color-forest);
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .manifesto-stat-accent span {
          color: var(--color-lipstick);
        }

        /* ─────────────────────────────────────────────────────────────── */
        /* SECTION 4 — Features                                             */
        /* ─────────────────────────────────────────────────────────────── */
        .features-section {
          background: var(--color-chalk);
          padding: var(--space-section) 60px;
          border-top: 1px solid var(--color-blush);
        }
        .features-header {
          margin-bottom: 80px;
        }
        .features-headline {
          font-size: clamp(36px, 6vw, 80px) !important;
          max-width: 700px;
          line-height: 0.80 !important;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          perspective: 1200px;
        }
        .feature-item {
          background: #ffffff;
          border: 1px solid var(--color-blush);
          padding: 40px;
          border-radius: var(--radius-lg);
          transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        .feature-item:hover {
          border-color: var(--color-lipstick);
          box-shadow: 0 16px 40px rgba(0, 82, 45, 0.05);
        }

        .feature-num {
          display: block;
          font-size: 80px !important;
          line-height: 0.70 !important;
          margin-bottom: 16px;
        }
        .feature-title {
          font-family: var(--font-grotesk);
          font-size: 20px;
          font-weight: 700;
          color: var(--color-forest);
          margin-bottom: 12px;
          text-transform: none;
        }
        .feature-desc {
          font-size: 15px;
          max-width: 40ch;
        }

        /* ─────────────────────────────────────────────────────────────── */
        /* SECTION 5 — Method                                               */
        /* ─────────────────────────────────────────────────────────────── */
        .method-section {
          background: var(--color-chalk);
          padding: var(--space-section) 60px;
          border-top: 1px solid var(--color-blush);
        }
        .method-header {
          margin-bottom: 80px;
        }
        .method-headline {
          font-size: clamp(30px, 5vw, 60px) !important;
          line-height: 0.85 !important;
          max-width: 600px;
        }
        .method-steps {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .method-step {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: flex-start;
          padding: 60px 0;
          border-bottom: 1px solid var(--color-blush);
        }
        .method-step-left {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .method-num {
          display: block;
          font-size: 80px !important;
          line-height: 0.70 !important;
        }
        .method-verb {
          display: block;
          font-size: clamp(50px, 8vw, 94px) !important;
          line-height: 0.75 !important;
        }
        .method-desc {
          padding-top: 16px;
          font-size: 17px;
        }
        .method-submanifesto {
          margin-top: 60px;
          max-width: 600px;
        }
        .method-submanifesto p { font-size: 17px; }

        /* ─────────────────────────────────────────────────────────────── */
        /* SECTION 6 — FAQ                                                  */
        /* ─────────────────────────────────────────────────────────────── */
        .faq-section {
          background: var(--color-chalk);
          padding: var(--space-section) 60px;
          border-top: 1px solid var(--color-blush);
        }
        .faq-headline {
          font-size: clamp(36px, 6vw, 80px) !important;
          line-height: 0.80 !important;
          margin-bottom: 80px;
          max-width: 600px;
        }
        .faq-list {
          max-width: 800px;
        }
        .faq-item {
          border-bottom: 1px solid var(--color-blush);
        }
        .faq-summary {
          width: 100%;
          background: none;
          border: none;
          padding: 24px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          font-family: var(--font-grotesk);
          font-size: 18px;
          font-weight: 500;
          color: var(--color-forest);
          cursor: pointer;
          text-align: left;
          transition: color 0.2s ease;
        }
        .faq-summary:hover { color: var(--color-lipstick); }
        .faq-chevron {
          color: var(--color-lipstick);
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .faq-chevron.open { transform: rotate(180deg); }
        .faq-body {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                      opacity    0.35s ease;
        }
        .faq-body p {
          font-family: var(--font-grotesk);
          font-size: 16px;
          font-weight: 400;
          color: var(--color-forest);
          line-height: 1.6;
          max-width: 60ch;
          padding-bottom: 24px;
        }

        /* ─────────────────────────────────────────────────────────────── */
        /* SECTION 7 — CTA Footer                                          */
        /* ─────────────────────────────────────────────────────────────── */
        .cta-section {
          background: var(--color-chalk);
          padding: var(--space-section) 60px;
          border-top: 1px solid var(--color-blush);
        }
        .cta-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .cta-headline {
          font-size: clamp(80px, 14vw, 180px) !important;
          line-height: 0.70 !important;
          color: var(--color-forest);
        }
        .cta-sub {
          font-family: var(--font-grotesk);
          font-size: 20px;
          font-weight: 400;
          color: var(--text-body);
          max-width: 50ch;
        }
        .cta-actions {
          display: flex;
          align-items: center;
          gap: 28px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .cta-footer-row {
          margin-top: 80px;
          padding-top: 24px;
          border-top: 1px solid var(--color-blush);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          font-family: var(--font-grotesk);
          font-size: 12px;
          font-weight: 400;
          color: var(--text-muted);
          flex-wrap: wrap;
        }

        /* ─────────────────────────────────────────────────────────────── */
        /* Responsive                                                        */
        /* ─────────────────────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .hero-brand-title { font-size: clamp(80px, 15vw, 150px); }
        }

        @media (max-width: 768px) {
          .preloader-section { padding: 60px 24px; }
          .preloader-line { font-size: clamp(16px, 4vw, 24px); }

          .hero-section { padding: 80px 24px 80px; }
          .hero-brand-title { font-size: 80px; left: 24px; }
          .hero-body { grid-template-columns: 1fr; gap: 40px; padding-top: 160px; }
          .hero-photos { display: none; }

          .pink-banner-section { grid-template-columns: 1fr; padding: 60px 24px; min-height: auto; }
          .pink-banner-photo { display: none; }

          .manifesto-section { padding: var(--space-12) 24px; }
          .manifesto-inner { gap: 48px; }

          .features-section { padding: var(--space-12) 24px; }
          .features-grid { grid-template-columns: 1fr; gap: 20px; }
          .feature-item { padding: 24px; }


          .method-section { padding: var(--space-12) 24px; }
          .method-step { grid-template-columns: 1fr; gap: 20px; padding: 40px 0; }

          .faq-section { padding: var(--space-12) 24px; }

          .cta-section { padding: var(--space-12) 24px; }
          .cta-footer-row { flex-direction: column; align-items: flex-start; }

          .featured-card { display: none; }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
