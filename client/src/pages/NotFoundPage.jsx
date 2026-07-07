import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div style={{ textAlign: 'center', padding: 'var(--space-20)', maxWidth: 400, margin: '0 auto' }}>
    <p style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🗺</p>
    <h1 className="display-text" style={{ fontSize: '1.8rem', marginBottom: 'var(--space-3)' }}>
      Page not found
    </h1>
    <p className="text-muted" style={{ marginBottom: 'var(--space-8)' }}>
      Looks like you've wandered off the map.
    </p>
    <Link to="/" id="not-found-home-link" className="btn btn-primary">Go home</Link>
  </div>
);

export default NotFoundPage;
