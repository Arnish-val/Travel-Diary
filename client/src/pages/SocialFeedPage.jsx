import React, { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import * as api from '@/api/client';
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
          <h1 className="display-text display-pink" style={{ fontSize: '46px', margin: 0 }}>
            Travelers' Feed
          </h1>
          <p className="text-muted" style={{ marginTop: '4px', marginBottom: 'var(--space-8)' }}>
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
                    <strong className="creator-name">{trip.owner_name}</strong>
                    <p className="text-xs text-muted" style={{ marginTop: '2px' }}>
                      Shared {format(new Date(trip.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="feed-card-body">
                  <h3 className="feed-trip-title display-text" style={{ fontSize: '24px', margin: '0 0 4px', textTransform: 'none' }}>{trip.title}</h3>
                  <p className="text-xs text-muted" style={{ fontWeight: '700', marginBottom: 'var(--space-4)' }}>
                    📅 {format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy').toUpperCase()}
                  </p>
                  {trip.cover_photo_url && (
                    <div className="feed-cover-wrap">
                      <img src={trip.cover_photo_url} alt={trip.title} loading="lazy" />
                    </div>
                  )}
                  {trip.description && (
                    <p className="feed-trip-desc prose" style={{ color: 'var(--text-body)' }}>{trip.description}</p>
                  )}
                </div>

                <div className="feed-card-footer">
                  <span className="badge badge-ghost">📍 {trip.destination_count || 0} destinations</span>
                  <span className="badge badge-ghost">📸 {trip.media_count || 0} photos</span>
                </div>
              </div>
            ))}

            {feedItems.length === 0 && (
              <div className="empty-feed card">
                <p style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</p>
                <h3 className="display-text display-pink" style={{ fontSize: '24px', marginBottom: '8px' }}>Your feed is empty</h3>
                <p className="text-muted prose" style={{ margin: '0 auto' }}>
                  Follow other travelers using their User IDs to see their public itineraries and photos appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Panel: Connect / Follow */}
        <div className="social-sidebar-col">
          <div className="card connect-card">
            <h3 className="display-text" style={{ fontSize: '20px', marginBottom: '12px' }}>Connect</h3>
            <p className="text-sm prose" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              Follow using a traveler's account User ID to subscribe to their feed updates.
            </p>
            <form onSubmit={handleFollowUser} className="follow-form" id="follow-user-form">
              <div className="form-group">
                <input
                  id="follow-user-id-input"
                  type="text"
                  className="form-input"
                  placeholder="Paste User UUID here..."
                  value={followIdInput}
                  onChange={(e) => setFollowIdInput(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                id="follow-submit-btn"
                className="btn btn-primary w-full"
                disabled={followingUser}
              >
                {followingUser ? 'Following...' : 'Follow User'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .social-page { max-width: 1100px; margin: 0 auto; padding-top: var(--space-8); }
        .social-layout { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--space-10); }
        .social-feed-col { display: flex; flex-direction: column; }
        .feed-list { display: flex; flex-direction: column; gap: var(--space-8); }
        .feed-card { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); border: 1px solid var(--border-subtle); background: #fff; border-radius: var(--radius-lg); }
        .feed-card-header { display: flex; align-items: center; gap: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-4); }
        .creator-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--color-lipstick); display: flex; align-items: center; justify-content: center; font-family: var(--font-beni); font-size: 20px; font-weight: 700; color: white; overflow: hidden; }
        .creator-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .creator-name { font-family: var(--font-grotesk); font-size: 16px; font-weight: 700; color: var(--color-forest); }
        
        .feed-cover-wrap { width: 100%; height: 260px; overflow: hidden; margin-bottom: var(--space-4); border: 1px solid var(--border-subtle); }
        .feed-cover-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .feed-card-footer { display: flex; gap: var(--space-2); border-top: 1px solid var(--border-subtle); padding-top: var(--space-4); }
 
        .social-sidebar-col { display: flex; flex-direction: column; }
        .connect-card { padding: var(--space-6); background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        .follow-form { display: flex; flex-direction: column; gap: var(--space-4); }
        .empty-feed { text-align: center; padding: var(--space-16) var(--space-6); background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        @media (max-width: 768px) { .social-layout { grid-template-columns: 1fr; gap: 40px; } }
      `}</style>
    </div>
  );
};

export default SocialFeedPage;
