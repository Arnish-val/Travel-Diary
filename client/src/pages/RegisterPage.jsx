import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', display_name: '', home_location: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.display_name.trim()) errs.display_name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const result = await register(form);
    if (result.success) {
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-left">
        {/* Giant ghosted headline */}
        <p className="auth-ghost-title">JOIN<br/>US</p>
      </div>

      <div className="auth-right">
        <div className="auth-header">
          <p className="auth-eyebrow">Travel Diary</p>
          <h1 className="auth-headline display-text display-pink">JOIN THE<br/>JOURNEY</h1>
          <p className="auth-subline">Create your account to start logging adventures.</p>
        </div>

        <form onSubmit={handleSubmit} id="register-form" className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Your name</label>
            <input
              id="reg-name"
              type="text"
              name="display_name"
              autoComplete="name"
              className={`form-input ${errors.display_name ? 'input-error' : ''}`}
              placeholder="Jane Doe"
              value={form.display_name}
              onChange={handleChange}
            />
            {errors.display_name && <span className="form-error">{errors.display_name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <input
              id="reg-email"
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
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              name="password"
              autoComplete="new-password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-location">Home city <span className="text-muted">(optional)</span></label>
            <input
              id="reg-location"
              type="text"
              name="home_location"
              className="form-input"
              placeholder="London, UK"
              value={form.home_location}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner" /> : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" id="register-login-link" className="auth-link">Sign in →</Link>
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

export default RegisterPage;
