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
    <div className="auth-page">
      <div className="auth-container animate-scale-in">
        <div className="auth-header">
          <div className="auth-logo">🌍</div>
          <h1 className="auth-title display-text">Start your journey</h1>
          <p className="auth-subtitle">Create your Travel Diary account</p>
        </div>

        <form onSubmit={handleSubmit} id="register-form" className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Your name</label>
            <input id="reg-name" type="text" name="display_name" autoComplete="name"
              className={`form-input ${errors.display_name ? 'input-error' : ''}`}
              placeholder="Jane Doe" value={form.display_name} onChange={handleChange} />
            {errors.display_name && <span className="form-error">{errors.display_name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <input id="reg-email" type="email" name="email" autoComplete="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com" value={form.email} onChange={handleChange} />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" name="password" autoComplete="new-password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="At least 8 characters" value={form.password} onChange={handleChange} />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-location">Home city <span className="text-muted">(optional)</span></label>
            <input id="reg-location" type="text" name="home_location"
              className="form-input" placeholder="London, UK"
              value={form.home_location} onChange={handleChange} />
          </div>

          <button type="submit" id="register-submit-btn" className="btn btn-primary w-full" disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" id="register-login-link" className="auth-link">Sign in</Link></p>
        </div>
      </div>

      <div className="auth-bg">
        {['🌏', '🏕', '🚂', '🛳', '🌋'].map((emoji, i) => (
          <span key={i} className="bg-emoji" style={{ '--delay': `${i * 0.6}s`, '--x': `${10 + i * 20}%` }}>{emoji}</span>
        ))}
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: var(--space-6); background: radial-gradient(ellipse at 70% 30%, rgba(99,102,241,0.12) 0%, transparent 60%); }
        .auth-container { width: 100%; max-width: 420px; background: var(--color-bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-xl); padding: var(--space-8); box-shadow: var(--shadow-xl); position: relative; z-index: 1; }
        .auth-header { text-align: center; margin-bottom: var(--space-6); }
        .auth-logo { font-size: 2.5rem; margin-bottom: var(--space-3); display: block; }
        .auth-title { font-size: 1.8rem; margin-bottom: var(--space-2); }
        .auth-subtitle { color: var(--text-muted); font-size: 0.9rem; }
        .auth-form { display: flex; flex-direction: column; gap: var(--space-4); }
        .auth-footer { text-align: center; margin-top: var(--space-5); color: var(--text-muted); font-size: 0.9rem; }
        .auth-link { color: var(--color-brand-400); font-weight: 500; }
        .auth-link:hover { text-decoration: underline; }
        .input-error { border-color: var(--color-accent-coral) !important; }
        .auth-bg { position: absolute; inset: 0; pointer-events: none; }
        .bg-emoji { position: absolute; font-size: 4rem; opacity: 0.06; top: 50%; left: var(--x); animation: floatEmoji 8s ease-in-out infinite; animation-delay: var(--delay); transform: translateY(-50%); }
        @keyframes floatEmoji { 0%,100%{transform:translateY(-50%)}50%{transform:translateY(calc(-50% - 30px))} }
      `}</style>
    </div>
  );
};

export default RegisterPage;
