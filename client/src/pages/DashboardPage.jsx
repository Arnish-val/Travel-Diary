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
    if (hr < 12) return 'GOOD MORNING';
    if (hr < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
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
          <p className="dashboard-greeting eyebrow">{greeting()},</p>
          <h1 className="dashboard-title display-text display-pink">{user?.display_name} ✈</h1>
          {user?.home_location && (
            <p className="dashboard-location text-muted">📍 {user.home_location}</p>
          )}
        </div>
        <Link to="/trips/new" id="dashboard-new-trip-btn" className="btn btn-primary">
          + New Trip
        </Link>
      </div>

      {/* Stats - flat typographical layout, no cards, simple dividers */}
      <div className="stats-row">
        {[
          { label: 'Trips logged', value: trips.length },
          { label: 'Photos uploaded', value: trips.reduce((a, t) => a + (parseInt(t.media_count, 10) || 0), 0) },
          { label: 'Places visited', value: trips.reduce((a, t) => a + (parseInt(t.destination_count, 10) || 0), 0) },
        ].map((stat, i) => (
          <div key={stat.label} className="stat-item">
            <p className="stat-value display-text display-pink">{stat.value}</p>
            <p className="stat-label-text">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Trips grid */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title display-text" style={{ fontSize: '30px', margin: 0 }}>My Trips</h2>
          <Link to="/trips" className="btn btn-ghost btn-sm" id="view-all-trips-link">View all →</Link>
        </div>

        {trips.length === 0 ? (
          <div className="empty-state card">
            <p className="empty-icon">🧳</p>
            <h3 className="display-text display-pink" style={{ fontSize: '24px', marginBottom: '8px' }}>No trips yet</h3>
            <p className="text-muted prose" style={{ margin: '0 auto' }}>Start by logging your first adventure! Document destinations, photos, and ratings.</p>
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
              <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
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
        .dashboard { max-width: 1100px; margin: 0 auto; padding-top: var(--space-8); }
        .dashboard-loading { display: flex; align-items: center; justify-content: center; height: 50vh; }
        .dashboard-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: var(--space-10); flex-wrap: wrap; gap: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-6); }
        .dashboard-greeting { font-size: var(--text-xs2); font-weight: 700; color: var(--text-muted); margin-bottom: 6px; letter-spacing: 0.08em; }
        .dashboard-title { font-size: clamp(36px, 6vw, 56px); line-height: 0.8; }
        .dashboard-location { font-family: var(--font-grotesk); font-size: 14px; margin-top: var(--space-3); }
        
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6); margin-bottom: var(--space-12); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-8); }
        .stat-item { display: flex; flex-direction: column; gap: 4px; }
        .stat-value { font-size: clamp(46px, 8vw, 80px); line-height: 0.70; }
        .stat-label-text { font-family: var(--font-grotesk); font-size: 13px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        
        .dashboard-section { margin-top: var(--space-6); }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-8); }
        .trips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-8); }
        .empty-state { text-align: center; padding: var(--space-12) var(--space-6); background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        .empty-icon { font-size: 3rem; margin-bottom: var(--space-4); }
        @media (max-width: 768px) {
          .stats-row { grid-template-columns: 1fr; gap: var(--space-6); }
          .dashboard-header { flex-direction: column; align-items: flex-start; gap: 20px; }
        }
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
      <span className="trip-privacy badge badge-brand">
        {trip.privacy}
      </span>
    </div>
    <div className="trip-card-body">
      <h3 className="trip-card-title">{trip.title}</h3>
      <p className="trip-card-dates text-xs text-muted">
        {format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy')}
      </p>
      <div className="trip-card-meta">
        <span className="badge badge-ghost">📸 {trip.media_count || 0} photos</span>
        <span className="badge badge-ghost">📍 {trip.destination_count || 0} places</span>
      </div>
    </div>
    <style>{`
      .trip-card { display: flex; flex-direction: column; overflow: hidden; text-decoration: none; cursor: pointer; border: 1px solid var(--border-subtle); background: #fff; border-radius: var(--radius-lg); }
      .trip-card-cover { height: 180px; position: relative; overflow: hidden; }
      .trip-card-cover img { width: 100%; height: 100%; object-fit: cover; }
      .trip-card-cover-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; background: var(--color-blush); color: var(--color-forest); }
      .trip-privacy { position: absolute; top: var(--space-3); right: var(--space-3); }
      .trip-card-body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); }
      .trip-card-title { font-family: var(--font-grotesk); font-size: 18px; font-weight: 700; color: var(--color-forest); line-height: 1.2; text-transform: none; }
      .trip-card-dates { margin-bottom: 2px; }
      .trip-card-meta { display: flex; gap: var(--space-2); margin-top: 4px; }
    `}</style>
  </Link>
);

export default DashboardPage;
