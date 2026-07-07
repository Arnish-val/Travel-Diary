import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import useUIStore from '@/store/uiStore';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Home'       },
  { to: '/trips',      label: 'My Trips'   },
  { to: '/feed',       label: 'Social Feed' },
  { to: '/map',        label: 'Map Explorer'},
  { to: '/search',     label: 'Explore'    },
  { to: '/discover',   label: 'Suggestions'},
  { to: '/plan',       label: 'Plan'       },
  { to: '/profile',    label: 'Profile'    },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lock scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleNavClick = () => setMenuOpen(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <>
      {/* ── Top-Left Pink Circle — Menu Trigger ─────────────────────── */}
      <button
        className="nav-circle nav-circle-left"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation menu"
        id="nav-menu-btn"
      >
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <rect y="0"  width="16" height="2" rx="1" fill="currentColor" />
          <rect y="5"  width="11" height="2" rx="1" fill="currentColor" />
          <rect y="10" width="16" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>

      {/* ── Top-Right Pink Circle — Brand / Home ────────────────────── */}
      <Link
        to={isAuthenticated ? '/dashboard' : '/'}
        className="nav-circle nav-circle-right"
        aria-label="Travel Diary home"
        id="nav-brand-btn"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor" opacity="0" />
          <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" fill="currentColor" />
        </svg>
      </Link>

      {/* ── Full-Screen Menu Overlay ─────────────────────────────────── */}
      <div
        className={`nav-overlay ${menuOpen ? 'nav-overlay-open' : ''}`}
        aria-hidden={!menuOpen}
        ref={menuRef}
      >
        {/* Close button (replaces the menu circle) */}
        <button
          className="nav-circle nav-circle-left nav-circle-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
          id="nav-close-btn"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="nav-overlay-inner">
          {/* Left: Nav links */}
          <nav className="nav-links" aria-label="Main menu">
            {isAuthenticated ? (
              NAV_ITEMS.map((item, i) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                  id={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  style={{ animationDelay: menuOpen ? `${i * 0.06}s` : '0s' }}
                >
                  {item.label}
                </NavLink>
              ))
            ) : (
              <>
                <Link to="/"          onClick={handleNavClick} className="nav-link">Home</Link>
                <Link to="/login"     onClick={handleNavClick} className="nav-link">Sign In</Link>
                <Link to="/register"  onClick={handleNavClick} className="nav-link">Get Started</Link>
              </>
            )}
          </nav>

          {/* Right: CTA / User info */}
          <div className="nav-overlay-cta">
            {isAuthenticated ? (
              <div className="nav-user-block">
                <p className="nav-user-greeting">
                  Hey, {user?.display_name?.split(' ')[0] || 'Explorer'} ✈
                </p>
                <p className="nav-user-email">{user?.email}</p>
                <button
                  className="btn btn-secondary"
                  onClick={handleLogout}
                  id="menu-logout-btn"
                  style={{ marginTop: '2rem' }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="nav-auth-block">
                <p className="nav-cta-headline">START YOUR JOURNEY</p>
                <p className="nav-cta-body">Log every adventure. Remember every moment.</p>
                <Link
                  to="/register"
                  onClick={handleNavClick}
                  className="btn btn-primary"
                  style={{ marginTop: '1.5rem' }}
                  id="menu-register-btn"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Social row */}
        <div className="nav-overlay-footer">
          <span className="nav-footer-copy">© 2024 Travel Diary</span>
        </div>
      </div>

      <style>{`
        /* ── Floating Pink Circles ──────────────────────────────────── */
        .nav-circle {
          position: fixed;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--color-blush);
          color: var(--color-forest);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          cursor: pointer;
          transition: background var(--transition-fast), transform var(--transition-fast);
          top: 24px;
          text-decoration: none;
        }
        .nav-circle:hover {
          background: var(--color-bubblegum);
          transform: scale(1.05);
        }
        .nav-circle-left  { left:  24px; }
        .nav-circle-right { right: 24px; }

        /* Close circle uses same position as menu */
        .nav-circle-close {
          position: fixed;
          background: rgba(255,248,246,0.15);
          color: var(--color-chalk);
        }
        .nav-circle-close:hover {
          background: rgba(255,248,246,0.25);
          transform: scale(1.05);
        }

        /* ── Full-Screen Menu Overlay ──────────────────────────────── */
        .nav-overlay {
          position: fixed;
          inset: 0;
          background: var(--color-forest);
          z-index: 1900;
          display: flex;
          flex-direction: column;
          padding: 24px;
          transform: translateX(-100%);
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
          overflow: hidden;
        }
        .nav-overlay-open {
          transform: translateX(0);
        }

        .nav-overlay-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: flex-start;
          padding-top: 100px;
          flex: 1;
        }

        /* ── Nav Links ─────────────────────────────────────────────── */
        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-link {
          font-family: var(--font-beni);
          font-size: clamp(48px, 7vw, 80px);
          font-weight: 700;
          line-height: 0.90;
          text-transform: uppercase;
          color: var(--color-chalk);
          text-decoration: none;
          letter-spacing: -0.01em;
          padding: 4px 0;
          transition: color 0.2s ease;
          animation: menuLinkReveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .nav-link:hover { color: var(--color-lipstick); }
        .nav-link-active { color: var(--color-lipstick); }

        @keyframes menuLinkReveal {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Overlay CTA (right column) ────────────────────────────── */
        .nav-overlay-cta {
          padding-top: 20px;
        }

        .nav-user-greeting {
          font-family: var(--font-beni);
          font-size: 30px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-chalk);
          line-height: 0.85;
          margin-bottom: 8px;
        }
        .nav-user-email {
          font-family: var(--font-grotesk);
          font-size: 14px;
          color: rgba(255,248,246,0.55);
        }

        .nav-cta-headline {
          font-family: var(--font-beni);
          font-size: 46px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-lipstick);
          line-height: 0.85;
          margin-bottom: 12px;
        }
        .nav-cta-body {
          font-family: var(--font-grotesk);
          font-size: 16px;
          color: rgba(255,248,246,0.7);
          line-height: 1.5;
          max-width: 40ch;
        }

        /* ── Overlay Footer ────────────────────────────────────────── */
        .nav-overlay-footer {
          padding-top: 40px;
          border-top: 1px solid rgba(255,248,246,0.12);
        }
        .nav-footer-copy {
          font-family: var(--font-grotesk);
          font-size: 12px;
          color: rgba(255,248,246,0.35);
        }

        @media (max-width: 768px) {
          .nav-overlay-inner { grid-template-columns: 1fr; gap: 40px; padding-top: 80px; }
          .nav-link { font-size: clamp(36px, 10vw, 56px); }
          .nav-cta-headline { font-size: 30px; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
