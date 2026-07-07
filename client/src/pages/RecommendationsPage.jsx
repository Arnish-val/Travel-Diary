import React, { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import * as recApi from '@/api/recommendations.api';
import toast from 'react-hot-toast';

const RecommendationsPage = () => {
  useRequireAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = forceRefresh
        ? await recApi.refreshRecommendations()
        : await recApi.getRecommendations();
      setRecommendations(res.data.items || []);
      if (forceRefresh) toast.success('Suggestions updated!');
    } catch (err) {
      toast.error('Failed to retrieve suggestions. Try logging some trip reviews first!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleDismiss = async (id) => {
    try {
      await recApi.dismissRecommendation(id);
      setRecommendations((prev) => prev.filter((item) => item.id !== id));
      toast.success('Recommendation dismissed');
    } catch {
      toast.error('Failed to dismiss item');
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
    <div className="recs-page animate-fade-in">
      <div className="recs-header">
        <div>
          <h1 className="display-text display-pink" style={{ fontSize: '46px', margin: 0 }}>
            Recommended Destinations
          </h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>
            Personalized destination suggestions matching your travel interests and ratings
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchRecommendations(true)}
          disabled={refreshing}
          id="refresh-recs-btn"
        >
          {refreshing ? 'Recalculating...' : 'Refresh Suggestions'}
        </button>
      </div>

      {recommendations.length > 0 ? (
        <div className="recs-grid">
          {recommendations.map((rec) => (
            <div key={rec.id} className="rec-card card" id={`rec-card-${rec.destination_id}`}>
              <div className="rec-card-body">
                <div className="rec-badge-row">
                  <span className="badge badge-brand">
                    {Math.round(parseFloat(rec.score) * 20)}% Match Profile
                  </span>
                  <button
                    className="dismiss-btn"
                    onClick={() => handleDismiss(rec.id)}
                    aria-label="Dismiss recommendation"
                    id={`dismiss-rec-btn-${rec.destination_id}`}
                  >
                    ✕
                  </button>
                </div>
                <h2 className="display-text display-pink" style={{ fontSize: '24px', margin: '8px 0 0' }}>{rec.name}</h2>
                <p className="rec-card-country text-xs text-muted">📍 {rec.country.toUpperCase()}</p>
                {rec.description && <p className="rec-card-desc text-sm prose" style={{ color: 'var(--text-muted)' }}>{rec.description}</p>}
                <div className="rec-card-reason">
                  <span className="reason-icon">💡</span>
                  <p className="reason-text text-xs">{rec.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-recs card">
          <p className="empty-icon">🔮</p>
          <h2 className="display-text display-pink" style={{ fontSize: '24px', marginBottom: '8px' }}>No suggestions yet</h2>
          <p className="text-muted prose" style={{ margin: '0 auto' }}>
            We generate recommendations based on the tags and ratings of destinations you visit.
            Rate a few places in your trips to start seeing personalized suggestions!
          </p>
        </div>
      )}

      <style>{`
        .recs-page { max-width: 1100px; margin: 0 auto; padding-top: var(--space-8); }
        .recs-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-10); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4); }
        .recs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-8); }
        .rec-card { border: 1px solid var(--border-subtle); background: #fff; border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; }
        .rec-card-body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); height: 100%; }
        .rec-badge-row { display: flex; justify-content: space-between; align-items: center; }
        .dismiss-btn { background: none; border: none; color: var(--color-forest); cursor: pointer; font-size: 13px; font-weight: 700; padding: 4px; }
        .dismiss-btn:hover { color: var(--color-lipstick); }
        .rec-card-country { margin-bottom: var(--space-1); letter-spacing: 0.04em; font-weight: 700; }
        .rec-card-desc { color: var(--text-secondary); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .rec-card-reason { margin-top: auto; padding: var(--space-4); background: var(--color-blush); border-left: 4px solid var(--color-lipstick); display: flex; gap: var(--space-3); align-items: flex-start; }
        .reason-icon { font-size: 15px; }
        .reason-text { line-height: 1.5; font-family: var(--font-grotesk); color: var(--color-forest); font-weight: 700; margin: 0; }
        .empty-recs { text-align: center; padding: var(--space-16) var(--space-6); background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        .empty-icon { font-size: 4rem; margin-bottom: var(--space-4); }
      `}</style>
    </div>
  );
};

export default RecommendationsPage;
