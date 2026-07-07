import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = await login(form);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-left">
        {/* Giant ghosted headline */}
        <p className="auth-ghost-title">SIGN<br/>IN</p>
      </div>

      <div className="auth-right">
        <div className="auth-header">
          <p className="auth-eyebrow">Travel Diary</p>
          <h1 className="auth-headline display-text display-pink">WELCOME<br/>BACK</h1>
          <p className="auth-subline">Sign in to continue your journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" id="login-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" id="login-register-link" className="auth-link">Create one →</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          background: var(--color-chalk);
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 80px 60px;
          gap: 60px;
          position: relative;
        }
        .auth-left {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .auth-ghost-title {
          font-family: var(--font-beni);
          font-size: clamp(100px, 16vw, 200px);
          font-weight: 700;
          text-transform: uppercase;
          line-height: 0.70;
          color: var(--color-blush);
          letter-spacing: -0.02em;
          user-select: none;
        }
        .auth-right {
          display: flex;
          flex-direction: column;
          gap: 32px;
          max-width: 420px;
        }
        .auth-eyebrow {
          font-family: var(--font-grotesk);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .auth-headline {
          font-size: clamp(60px, 8vw, 94px) !important;
          line-height: 0.75 !important;
          margin-bottom: 12px;
        }
        .auth-subline {
          font-family: var(--font-grotesk);
          font-size: 16px;
          color: var(--text-muted);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .auth-footer {
          font-family: var(--font-grotesk);
          font-size: 14px;
          color: var(--text-muted);
        }
        .auth-link {
          color: var(--color-lipstick);
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s ease;
        }
        .auth-link:hover { border-color: var(--color-lipstick); }
        .input-error { border-color: var(--color-lipstick) !important; }

        @media (max-width: 768px) {
          .auth-page { grid-template-columns: 1fr; padding: 80px 24px 40px; }
          .auth-left { display: none; }
          .auth-right { max-width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
