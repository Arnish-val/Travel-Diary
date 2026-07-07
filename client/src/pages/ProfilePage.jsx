import React, { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import useAuth from '@/hooks/useAuth';
import * as mediaApi from '@/api/media.api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  useRequireAuth();
  const { user, updateProfile } = useAuth();

  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    home_location: user?.home_location || '',
  });

  const [storage, setStorage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStorageUsage = async () => {
    try {
      const res = await mediaApi.getStorageUsage();
      setStorage(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStorageUsage();
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.display_name.trim()) {
      toast.error('Display name is required');
      return;
    }
    setSubmitting(true);
    const result = await updateProfile(form);
    if (result.success) {
      toast.success('Profile updated successfully');
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
    setSubmitting(false);
  };

  return (
    <div className="profile-page animate-fade-in">
      <div className="profile-layout">
        {/* Profile Card & Editing */}
        <div className="card profile-card">
          <div className="profile-user-info">
            <div className="profile-avatar">
              {user?.display_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="display-text">{user?.display_name}</h2>
              <p className="text-muted text-sm">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form" id="profile-edit-form">
            <div className="form-group">
              <label className="form-label" htmlFor="profile-display-name">Display Name</label>
              <input
                id="profile-display-name"
                type="text"
                name="display_name"
                className="form-input"
                value={form.display_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-home-location">Home Location</label>
              <input
                id="profile-home-location"
                type="text"
                name="home_location"
                className="form-input"
                placeholder="e.g. San Francisco, CA"
                value={form.home_location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio"
                name="bio"
                className="form-input"
                style={{ height: '90px', resize: 'vertical' }}
                placeholder="Tell us about your traveling style (e.g. solo backpacker, luxury resort lover)..."
                value={form.bio}
                onChange={handleChange}
              />
            </div>

            <button type="submit" id="profile-save-btn" className="btn btn-primary btn-sm w-full" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Quota & Stats Sidebar */}
        <div className="profile-sidebar">
          {storage && (
            <div className="card quota-card">
              <h3>Storage Quota</h3>
              <p className="text-muted text-xs">Used for travel images & uploads</p>
              <div className="quota-bar-wrap">
                <div
                  className="quota-bar-fill"
                  style={{ width: `${Math.min(parseFloat(storage.percent), 100)}%` }}
                />
              </div>
              <div className="quota-stats text-sm">
                <span>{storage.used_gb} GB used</span>
                <span>of {storage.quota_gb} GB</span>
              </div>
              <p className="quota-percent text-xs text-accent">
                {storage.percent}% of storage used
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .profile-page { max-width: 900px; margin: 0 auto; }
        .profile-layout { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--space-6); }
        .profile-card { padding: var(--space-8); }
        .profile-user-info { display: flex; align-items: center; gap: var(--space-5); margin-bottom: var(--space-6); }
        .profile-avatar { width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, var(--color-brand-600), var(--color-accent-teal)); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 700; color: white; border: 2px solid var(--border-default); }
        .profile-form { display: flex; flex-direction: column; gap: var(--space-4); }
        .profile-sidebar { display: flex; flex-direction: column; gap: var(--space-6); }
        .quota-card { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
        .quota-bar-wrap { width: 100%; height: 8px; background: var(--color-bg-elevated); border-radius: var(--radius-full); overflow: hidden; border: 1px solid var(--border-subtle); margin-top: var(--space-1); }
        .quota-bar-fill { height: 100%; background: linear-gradient(to right, var(--color-brand-400), var(--color-accent-teal)); border-radius: var(--radius-full); }
        .quota-stats { display: flex; justify-content: space-between; font-weight: 500; }
        .quota-percent { font-weight: 600; text-align: right; }
        @media (max-width: 768px) { .profile-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default ProfilePage;
