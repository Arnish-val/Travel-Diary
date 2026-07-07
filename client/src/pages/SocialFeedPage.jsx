import React, { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import * as api from '@/api/client'; // Base client or standard axios requests
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SocialFeedPage = () => {
  useRequireAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followIdInput, setFollowIdInput] = useState('');
  const [followingUser, setFollowingUser] = useState(false);

  const fetchFeed = async () => {
    try {
      const res = await api.default.get('/social/feed');
      setFeedItems(res.items || []);
    } catch {
      toast.error('Failed to load social feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleFollowUser = async (e) => {
    e.preventDefault();
    if (!followIdInput.trim()) return;
    setFollowingUser(true);
    try {
      await api.default.post(`/social/follow/${followIdInput.trim()}`);
      toast.success('Successfully followed user!');
      setFollowIdInput('');
      fetchFeed();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to follow user');
    } finally {
      setFollowingUser(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-20)' }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="social-page animate-fade-in">
      <div className="social-layout">
        {/* Main Feed Column */}
        <div className="social-feed-col">
          <h1 className="display-text gradient-text" style={{ fontSize: '1.8rem', marginBottom: 'var(--space-1)' }}>
            Travelers' Feed
          </h1>
          <p className="text-muted" style={{ marginBottom: 'var(--space-8)' }}>
            Explore trips shared by creators you follow
          </p>

          <div className="feed-list">
            {feedItems.map((trip) => (
              <div key={trip.id} className="feed-card card">
                <div className="feed-card-header">
                  <div className="creator-avatar">
                    {trip.owner_avatar ? (
                      <img src={trip.owner_avatar} alt={trip.owner_name} />
                    ) : (
                      trip.owner_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <strong>{trip.owner_name}</strong>
                    <p className="text-xs text-muted">
                      Shared {format(new Date(trip.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="feed-card-body">
                  <h3 className="feed-trip-title">{trip.title}</h3>
                  <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
                    📅 {format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy')}
                  </p>
                  {trip.cover_photo_url && (
                    <div className="feed-cover-wrap">
                      <img src={trip.cover_photo_url} alt={trip.title} loading="lazy" />
                    </div>
                  )}
                  {trip.description && (
                    <p className="feed-trip-desc text-sm">{trip.description}</p>
                  )}
                </div>

                <div className="feed-card-footer text-xs text-muted">
                  <span>📍 {trip.destination_count || 0} destinations visited</span>
                  <span>📸 {trip.media_count || 0} photos uploaded</span>
                </div>
              </div>
            ))}

            {feedItems.length === 0 && (
              <div className="empty-feed card">
                <p style={{ fontSize: '3rem' }}>👥</p>
                <h3>Your feed is empty</h3>
                <p className="text-muted">
                  Follow other travelers to see their shared itineraries and photos appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Panel: Connect / Follow */}
        <div className="social-sidebar-col">
          <div className="card connect-card">
            <h3>Connect with Travelers</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
              Follow using a traveler's account User ID to subscribe to their feed.
            </p>
            <form onSubmit={handleFollowUser} className="follow-form" id="follow-user-form">
              <input
                id="follow-user-id-input"
                type="text"
                className="form-input form-input-sm"
                placeholder="Paste User UUID here..."
                value={followIdInput}
                onChange={(e) => setFollowIdInput(e.target.value)}
                required
              />
              <button
                type="submit"
                id="follow-submit-btn"
                className="btn btn-primary btn-sm w-full"
                disabled={followingUser}
              >
                {followingUser ? 'Following...' : 'Follow User'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .social-page { max-width: 1100px; margin: 0 auto; }
        .social-layout { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--space-8); }
        .social-feed-col { display: flex; flex-direction: column; }
        .feed-list { display: flex; flex-direction: column; gap: var(--space-6); }
        .feed-card { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
        .feed-card-header { display: flex; align-items: center; gap: var(--space-3); }
        .creator-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--color-brand-600), var(--color-accent-teal)); display: flex; align-items: center; justify-content: center; font-size: 1rem; fontWeight: 700; color: white; border: 1px solid var(--border-default); overflow: hidden; }
        .creator-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .feed-trip-title { font-size: 1.15rem; font-weight: 600; margin-bottom: 2px; }
        .feed-cover-wrap { width: 100%; height: 220px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: var(--space-4); border: 1px solid var(--border-subtle); }
        .feed-cover-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .feed-trip-desc { color: var(--text-secondary); line-height: 1.6; }
        .feed-card-footer { display: flex; gap: var(--space-6); border-top: 1px solid var(--border-subtle); padding-top: var(--space-3); font-weight: 500; }

        .social-sidebar-col { display: flex; flex-direction: column; }
        .connect-card { padding: var(--space-5); }
        .follow-form { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4); }
        .empty-feed { text-align: center; padding: var(--space-12); }
        @media (max-width: 768px) { .social-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default SocialFeedPage;
