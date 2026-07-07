import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { useRequireAuth } from '@/hooks/useAuth';
import * as tripsApi from '@/api/trips.api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  useRequireAuth();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);

  const fetchTrips = async (nextCursor = null) => {
    try {
      const res = await tripsApi.getTrips({ cursor: nextCursor, limit: 9 });
      const newItems = res.items || [];
      setTrips((prev) => nextCursor ? [...prev, ...newItems] : newItems);
      setHasNext(res.meta?.hasNext || false);
      setCursor(res.meta?.nextCursor || null);
    } catch {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="dashboard animate-fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <p className="dashboard-greeting">{greeting()},</p>
          <h1 className="dashboard-title display-text">{user?.display_name} ✈</h1>
          {user?.home_location && (
            <p className="dashboard-location">📍 {user.home_location}</p>
          )}
        </div>
        <Link to="/trips/new" id="dashboard-new-trip-btn" className="btn btn-primary">
          + New Trip
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: '🗺', label: 'Trips', value: trips.length },
          { icon: '📸', label: 'Memories', value: trips.reduce((a, t) => a + (parseInt(t.media_count, 10) || 0), 0) },
          { icon: '🌍', label: 'Destinations', value: trips.reduce((a, t) => a + (parseInt(t.destination_count, 10) || 0), 0) },
        ].map((stat) => (
          <div key={stat.label} className="stat-card card">
            <span className="stat-icon">{stat.icon}</span>
            <div>
              <p className="stat-value">{stat.value}</p>
              <p className="stat-label">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trips grid */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">My Trips</h2>
          <Link to="/trips" className="btn btn-ghost btn-sm" id="view-all-trips-link">View all →</Link>
        </div>

        {trips.length === 0 ? (
          <div className="empty-state card">
            <p className="empty-icon">🧳</p>
            <h3>No trips yet</h3>
            <p className="text-muted">Start by logging your first adventure!</p>
            <Link to="/trips/new" id="empty-new-trip-btn" className="btn btn-primary mt-4">
              Log a trip
            </Link>
          </div>
        ) : (
          <>
            <div className="trips-grid">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
            {hasNext && (
              <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => fetchTrips(cursor)}
                  id="load-more-trips-btn"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .dashboard { max-width: 1100px; margin: 0 auto; }
        .dashboard-loading { display: flex; align-items: center; justify-content: center; height: 50vh; }
        .dashboard-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-8); flex-wrap: wrap; gap: var(--space-4); }
        .dashboard-greeting { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 4px; }
        .dashboard-title { font-size: 2rem; letter-spacing: -0.02em; }
        .dashboard-location { color: var(--text-muted); font-size: 0.9rem; margin-top: var(--space-2); }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-8); }
        .stat-card { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-5); }
        .stat-icon { font-size: 2rem; }
        .stat-value { font-size: 1.8rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
        .stat-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
        .dashboard-section {}
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); }
        .section-title { font-size: 1.2rem; font-weight: 600; }
        .trips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-5); }
        .empty-state { text-align: center; padding: var(--space-12); }
        .empty-icon { font-size: 3rem; margin-bottom: var(--space-4); }
        .empty-state h3 { font-size: 1.1rem; margin-bottom: var(--space-2); }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

const TripCard = ({ trip }) => (
  <Link to={`/trips/${trip.id}`} className="trip-card card animate-fade-in" id={`trip-card-${trip.id}`}>
    <div className="trip-card-cover">
      {trip.cover_photo_url ? (
        <img src={trip.cover_photo_url} alt={trip.title} />
      ) : (
        <div className="trip-card-cover-placeholder">
          <span>✈</span>
        </div>
      )}
      <span className={`trip-privacy badge ${trip.privacy === 'public' ? 'badge-teal' : 'badge-brand'}`}>
        {trip.privacy}
      </span>
    </div>
    <div className="trip-card-body">
      <h3 className="trip-card-title">{trip.title}</h3>
      <p className="trip-card-dates text-sm text-muted">
        {format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy')}
      </p>
      <div className="trip-card-meta">
        <span className="text-xs text-muted">📸 {trip.media_count || 0} photos</span>
        <span className="text-xs text-muted">📍 {trip.destination_count || 0} places</span>
      </div>
    </div>
    <style>{`
      .trip-card { display: flex; flex-direction: column; overflow: hidden; text-decoration: none; cursor: pointer; transition: transform var(--transition-fast), box-shadow var(--transition-fast); }
      .trip-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg), var(--shadow-glow); }
      .trip-card-cover { height: 160px; background: var(--color-bg-elevated); position: relative; overflow: hidden; }
      .trip-card-cover img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-slow); }
      .trip-card:hover .trip-card-cover img { transform: scale(1.05); }
      .trip-card-cover-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; background: linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-secondary)); }
      .trip-privacy { position: absolute; top: var(--space-2); right: var(--space-2); }
      .trip-card-body { padding: var(--space-4); }
      .trip-card-title { font-size: 1rem; font-weight: 600; margin-bottom: var(--space-2); }
      .trip-card-dates { margin-bottom: var(--space-3); }
      .trip-card-meta { display: flex; gap: var(--space-4); }
    `}</style>
  </Link>
);

export default DashboardPage;
