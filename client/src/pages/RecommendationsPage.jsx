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
          <h1 className="display-text gradient-text">Recommended Destinations</h1>
          <p className="text-muted">Personalized destination suggestions matching your travel interests and ratings</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchRecommendations(true)}
          disabled={refreshing}
          id="refresh-recs-btn"
        >
          {refreshing ? 'Recalculating...' : '🔄 Refresh Suggestions'}
        </button>
      </div>

      {recommendations.length > 0 ? (
        <div className="recs-grid">
          {recommendations.map((rec) => (
            <div key={rec.id} className="rec-card card" id={`rec-card-${rec.destination_id}`}>
              <div className="rec-card-body">
                <div className="rec-badge-row">
                  <span className="badge badge-teal">
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
                <h2 className="rec-card-title">{rec.name}</h2>
                <p className="rec-card-country text-sm text-muted">📍 {rec.country}</p>
                {rec.description && <p className="rec-card-desc text-sm">{rec.description}</p>}
                <div className="rec-card-reason">
                  <span className="reason-icon">💡</span>
                  <p className="reason-text text-xs text-accent">{rec.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-recs card">
          <p className="empty-icon">🔮</p>
          <h2>No suggestions yet</h2>
          <p className="text-muted">
            We generate recommendations based on the tags and ratings of destinations you visit.
            Rate a few places in your trips to start seeing personalized suggestions!
          </p>
        </div>
      )}

      <style>{`
        .recs-page { max-width: 1100px; margin: 0 auto; }
        .recs-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-8); flex-wrap: wrap; gap: var(--space-4); }
        .recs-header h1 { font-size: 1.8rem; margin-bottom: var(--space-1); }
        .recs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-6); }
        .rec-card { border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; transition: transform var(--transition-fast), box-shadow var(--transition-fast); }
        .rec-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg), var(--shadow-glow); }
        .rec-card-body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); height: 100%; }
        .rec-badge-row { display: flex; justify-content: space-between; align-items: center; }
        .dismiss-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.9rem; padding: 4px; border-radius: 50%; }
        .dismiss-btn:hover { color: var(--text-primary); background: var(--glass-bg); }
        .rec-card-title { font-size: 1.25rem; font-weight: 600; }
        .rec-card-desc { color: var(--text-secondary); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .rec-card-reason { margin-top: auto; padding: var(--space-3); background: rgba(99, 102, 241, 0.08); border-left: 3px solid var(--color-brand-400); border-radius: 0 var(--radius-md) var(--radius-md) 0; display: flex; gap: var(--space-2); align-items: flex-start; }
        .reason-icon { font-size: 0.95rem; }
        .reason-text { line-height: 1.4; font-weight: 500; }
        .empty-recs { text-align: center; padding: var(--space-16); }
        .empty-icon { font-size: 4rem; margin-bottom: var(--space-4); }
        .empty-recs h2 { margin-bottom: var(--space-2); }
      `}</style>
    </div>
  );
};

export default RecommendationsPage;
