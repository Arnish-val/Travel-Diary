import React, { useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import * as destApi from '@/api/destinations.api';
import useDebounce from '@/hooks/useDebounce';
import { useEffect } from 'react';

const TAGS = [
  { id: 1, name: 'food', icon: '🍜' },
  { id: 2, name: 'scenery', icon: '🏔' },
  { id: 3, name: 'culture', icon: '🎭' },
  { id: 4, name: 'nightlife', icon: '🌃' },
  { id: 5, name: 'adventure', icon: '🧗' },
  { id: 6, name: 'budget-friendly', icon: '💰' },
  { id: 7, name: 'relaxation', icon: '🧘' },
  { id: 8, name: 'history', icon: '🏛' },
  { id: 9, name: 'wildlife', icon: '🦁' },
  { id: 10, name: 'beaches', icon: '🏖' },
];

const SearchPage = () => {
  useRequireAuth();
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [minRating, setMinRating] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 400);

  const toggleTag = (id) =>
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  useEffect(() => {
    const doSearch = async () => {
      setLoading(true);
      try {
        const res = await destApi.search({
          q: debouncedQuery,
          tags: selectedTags.join(','),
          minRating: minRating || undefined,
          limit: 20,
        });
        setResults(res.items || []);
        setTotal(res.meta?.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [debouncedQuery, selectedTags, minRating]);

  return (
    <div className="search-page animate-fade-in">
      <div className="search-header">
        <h1 className="display-text display-pink" style={{ fontSize: '46px', marginBottom: '8px' }}>
          Explore Destinations
        </h1>
        <p className="text-muted">Discover places, read reviews, and find your next adventure.</p>
      </div>

      <div className="search-controls">
        <div className="search-bar-wrap">
          <input
            id="destination-search-input"
            type="search"
            className="form-input search-input"
            placeholder="Search cities, countries, landmarks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search destinations"
          />
        </div>

        <div className="filter-row">
          <div className="tag-filters">
            {TAGS.map((tag) => (
              <button
                key={tag.id}
                id={`tag-filter-${tag.name}`}
                className={`tag-chip ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.icon} {tag.name}
              </button>
            ))}
          </div>

          <select
            id="rating-filter"
            className="form-input rating-select"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            aria-label="Minimum rating"
          >
            <option value="">Any rating</option>
            {[4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r}★ and above</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <span className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : (
        <>
          <p className="results-count text-muted text-xs">
            {total} DESTINATION{total !== 1 ? 'S' : ''} FOUND
          </p>
          <div className="results-grid">
            {results.map((dest) => (
              <DestinationCard key={dest.id} dest={dest} />
            ))}
          </div>
          {results.length === 0 && !loading && (
            <div className="empty-state card" style={{ padding: 'var(--space-12)', textAlign: 'center', background: '#fff', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🌐</p>
              <h3 className="display-text display-pink" style={{ fontSize: '24px', marginBottom: '8px' }}>No destinations found</h3>
              <p className="text-muted prose" style={{ margin: '0 auto' }}>Try a different search query or clear some filters.</p>
            </div>
          )}
        </>
      )}

      <style>{`
        .search-page { max-width: 1100px; margin: 0 auto; padding-top: var(--space-8); }
        .search-header { border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-6); margin-bottom: var(--space-8); }
        .search-controls { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-8); }
        .search-bar-wrap { width: 100%; }
        .search-input { font-size: 1rem; }
        .filter-row { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; }
        .tag-filters { display: flex; gap: var(--space-2); flex-wrap: wrap; flex: 1; }
        
        .tag-chip { padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--border-subtle); background: var(--color-blush); color: var(--color-forest); font-family: var(--font-grotesk); font-size: 13px; font-weight: 500; cursor: pointer; transition: all var(--transition-fast); }
        .tag-chip:hover { border-color: var(--color-lipstick); }
        .tag-chip.active { background: var(--color-lipstick); border-color: var(--color-lipstick); color: #fff; }
        
        .rating-select { width: auto; min-width: 160px; padding: 10px var(--space-4); font-size: 14px; background: #fff; border: 1px solid var(--border-subtle); cursor: pointer; }
        .results-count { margin-bottom: var(--space-4); font-weight: 700; letter-spacing: 0.04em; }
        .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-6); }
      `}</style>
    </div>
  );
};

const DestinationCard = ({ dest }) => (
  <div className="dest-card card" id={`dest-card-${dest.id}`}>
    <div className="dest-card-header">
      <div>
        <h3 className="dest-card-name display-text" style={{ fontSize: '20px', margin: 0, textTransform: 'none' }}>{dest.name}</h3>
        <p className="dest-card-country text-xs text-muted" style={{ marginTop: '2px' }}>{dest.country}</p>
      </div>
      <div className="dest-rating">
        <span className="rating-star">⭐</span>
        <span className="rating-value">{parseFloat(dest.avg_rating || 0).toFixed(1)}</span>
        <span className="rating-count text-xs text-muted">({dest.rating_count || 0})</span>
      </div>
    </div>
    {dest.description && (
      <p className="dest-desc text-sm prose" style={{ margin: 0, color: 'var(--text-muted)' }}>{dest.description}</p>
    )}
    <style>{`
      .dest-card { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); border: 1px solid var(--border-subtle); background: #fff; border-radius: var(--radius-lg); }
      .dest-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
      .dest-rating { display: flex; align-items: center; gap: 4px; font-family: var(--font-grotesk); font-size: 14px; font-weight: 700; color: var(--color-forest); }
      .dest-desc { line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    `}</style>
  </div>
);

export default SearchPage;
