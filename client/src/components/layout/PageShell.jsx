import React from 'react';
import Navbar from './Navbar';

const PageShell = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <style>{`
        .main-content {
          min-height: 100vh;
          width: 100%;
          padding: var(--space-16) var(--space-8) var(--space-8);
        }
        @media (max-width: 768px) {
          .main-content {
            padding: var(--space-12) var(--space-4) var(--space-4);
          }
        }
      `}</style>
    </>
  );
};

export default PageShell;
