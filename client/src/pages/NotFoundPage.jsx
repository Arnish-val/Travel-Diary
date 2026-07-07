import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="not-found-page animate-fade-in">
    <div className="not-found-container">
      {/* Huge echo title */}
      <div className="not-found-ghost display-text display-ghost">404</div>
      <div className="not-found-content">
        <p className="not-found-eyebrow">Lost? We can help.</p>
        <h1 className="not-found-headline display-text display-pink">PAGE NOT FOUND</h1>
        <p className="not-found-desc prose">
          Looks like you've wandered off the map. The page you are looking for doesn't exist or has been moved to a new destination.
        </p>
        <div className="not-found-actions">
          <Link to="/" id="not-found-home-link" className="btn btn-primary btn-lg">
            Return home
          </Link>
        </div>
      </div>
    </div>

    <style>{`
      .not-found-page {
        min-height: 80vh;
        background: var(--color-chalk);
        display: flex;
        align-items: center;
        padding: 80px 60px;
        position: relative;
        overflow: hidden;
      }
      .not-found-container {
        position: relative;
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
      }
      .not-found-ghost {
        font-size: clamp(120px, 25vw, 280px) !important;
        position: absolute;
        top: -60px;
        left: -10px;
        z-index: 0;
        user-select: none;
        pointer-events: none;
        letter-spacing: -0.04em;
        opacity: 0.8;
      }
      .not-found-content {
        position: relative;
        z-index: 1;
        padding-top: clamp(80px, 15vw, 180px);
        display: flex;
        flex-direction: column;
        gap: 20px;
        text-align: left;
      }
      .not-found-eyebrow {
        font-family: var(--font-grotesk);
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
      }
      .not-found-headline {
        font-size: clamp(46px, 8vw, 94px) !important;
        line-height: 0.75 !important;
      }
      .not-found-desc {
        font-size: 18px;
        line-height: 1.5;
        margin-top: 8px;
      }
      .not-found-actions {
        margin-top: 16px;
      }

      @media (max-width: 768px) {
        .not-found-page { padding: 80px 24px; }
        .not-found-ghost { font-size: 150px !important; top: -30px; }
        .not-found-content { padding-top: 100px; }
      }
    `}</style>
  </div>
);

export default NotFoundPage;
