import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRequireAuth } from '@/hooks/useAuth';
import * as tripsApi from '@/api/trips.api';
import * as mediaApi from '@/api/media.api';
import * as destApi from '@/api/destinations.api';
import { format } from 'date-fns';
import mapboxgl from 'mapbox-gl';
import toast from 'react-hot-toast';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const TripDetailPage = () => {
  useRequireAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [trip, setTrip] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [destQuery, setDestQuery] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);

  // Modal / Rating State
  const [activeDestForRating, setActiveDestForRating] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState('');
  const [ratingTags, setRatingTags] = useState([]);

  const fetchTripData = async () => {
    try {
      const tripData = await tripsApi.getTrip(id);
      setTrip(tripData.data.trip);

      const mediaData = await mediaApi.getTripMedia(id, { limit: 50 });
      setMedia(mediaData.items || []);
    } catch (err) {
      toast.error('Failed to load trip details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, [id]);

  // Init Mapbox once map container is ready and destinations exist
  useEffect(() => {
    if (!trip || !trip.destinations || !trip.destinations.length || map.current) return;

    const validDests = trip.destinations.filter(d => d.latitude && d.longitude);
    if (!validDests.length) return;

    // Center on first destination
    const first = validDests[0];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [first.longitude, first.latitude],
      zoom: 4,
    });

    // Add markers and build bounding box
    const bounds = new mapboxgl.LngLatBounds();
    const coordinates = [];

    validDests.forEach((dest) => {
      const el = document.createElement('div');
      el.className = 'marker-dot';
      el.style.cssText = `
        width: 14px; height: 14px;
        background: #818cf8;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(99,102,241,0.8);
      `;

      new mapboxgl.Marker(el)
        .setLngLat([dest.longitude, dest.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 10 }).setHTML(`<strong>${dest.name}</strong>`))
        .addTo(map.current);

      bounds.extend([dest.longitude, dest.latitude]);
      coordinates.push([dest.longitude, dest.latitude]);
    });

    // Draw route line if multiple destinations
    if (coordinates.length > 1) {
      map.current.on('load', () => {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          },
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#6366f1',
            'line-width': 3,
            'line-dasharray': [2, 2],
          },
        });
      });
    }

    if (validDests.length > 1) {
      map.current.fitBounds(bounds, { padding: 40 });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [trip]);

  // Image Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    setUploading(true);
    try {
      const res = await mediaApi.uploadMedia(id, formData);
      toast.success('Photo uploaded successfully');
      setMedia((prev) => [res.data.media, ...prev]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await mediaApi.deleteMedia(photoId);
      toast.success('Photo deleted');
      setMedia((prev) => prev.filter((m) => m.id !== photoId));
    } catch {
      toast.error('Failed to delete photo');
    }
  };

  // Add Destination to Trip
  const handleSearchDestinations = async (val) => {
    setDestQuery(val);
    if (val.length < 2) {
      setDestSuggestions([]);
      return;
    }
    try {
      const res = await destApi.autocomplete(val);
      setDestSuggestions(res.data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDest = async (dest) => {
    try {
      await tripsApi.addDestination(id, {
        destination_id: dest.id,
        visit_order: (trip.destinations?.length || 0) + 1,
      });
      toast.success(`${dest.name} added to trip!`);
      setDestQuery('');
      setDestSuggestions([]);
      fetchTripData();
    } catch (err) {
      toast.error('Failed to add destination');
    }
  };

  const handleRemoveDest = async (destId) => {
    if (!window.confirm('Remove destination from trip?')) return;
    try {
      await tripsApi.removeDestination(id, destId);
      toast.success('Destination removed');
      fetchTripData();
    } catch {
      toast.error('Failed to remove destination');
    }
  };

  // Star Rating Submission
  const handleOpenRatingModal = (dest) => {
    setActiveDestForRating(dest);
    setRatingScore(5);
    setRatingReview('');
    setRatingTags([]);
  };

  const handleTagToggle = (tagId) => {
    setRatingTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await destApi.createRating(activeDestForRating.id, {
        score: ratingScore,
        review: ratingReview,
        tagIds: ratingTags,
      });
      toast.success('Rating submitted successfully!');
      setActiveDestForRating(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this entire trip and all its photos?')) return;
    try {
      await tripsApi.deleteTrip(id);
      toast.success('Trip deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete trip');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-20)' }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const formattedDates = trip
    ? `${format(new Date(trip.start_date), 'MMM d, yyyy')} – ${format(new Date(trip.end_date), 'MMM d, yyyy')}`
    : '';

  return (
    <div className="trip-detail animate-fade-in">
      {/* Header Banner */}
      <div className="trip-hero card">
        {trip.cover_photo_url ? (
          <img className="trip-hero-img" src={trip.cover_photo_url} alt={trip.title} />
        ) : (
          <div className="trip-hero-placeholder">🏕</div>
        )}
        <div className="trip-hero-overlay">
          <div className="trip-hero-content">
            <span className={`badge ${trip.privacy === 'public' ? 'badge-teal' : 'badge-brand'}`}>
              {trip.privacy}
            </span>
            <h1 className="trip-title display-text">{trip.title}</h1>
            <p className="trip-dates text-sm">{formattedDates}</p>
          </div>
          <div className="trip-hero-actions">
            <Link to={`/trips/${trip.id}/edit`} id="edit-trip-btn" className="btn btn-secondary btn-sm">
              ✏️ Edit
            </Link>
            <button onClick={handleDeleteTrip} id="delete-trip-btn" className="btn btn-danger btn-sm">
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Info + Map on Right */}
      <div className="trip-grid">
        <div className="trip-main">
          {/* Notes / Description */}
          <div className="card text-card">
            <h3>Diary Notes</h3>
            <p className="trip-notes-text">
              {trip.description || <em className="text-muted">No diary entries or notes written for this trip yet. Click Edit to add some!</em>}
            </p>
          </div>

          {/* Destinations Section */}
          <div className="card dest-list-card">
            <div className="dest-list-header">
              <h3>Destinations visited</h3>
              <div className="dest-search-wrap">
                <input
                  id="add-dest-search"
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Add a city/destination..."
                  value={destQuery}
                  onChange={(e) => handleSearchDestinations(e.target.value)}
                />
                {destSuggestions.length > 0 && (
                  <div className="dest-autocomplete-box">
                    {destSuggestions.map((dest) => (
                      <button key={dest.id} onClick={() => handleAddDest(dest)}>
                        {dest.name}, {dest.country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="destinations-list">
              {trip.destinations?.length > 0 ? (
                trip.destinations.map((dest) => (
                  <div key={dest.id} className="dest-item">
                    <div>
                      <span className="dest-number">📍</span>
                      <strong>{dest.name}</strong> <span className="text-muted text-sm">{dest.country}</span>
                    </div>
                    <div className="dest-item-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenRatingModal(dest)}
                        id={`rate-dest-btn-${dest.name.toLowerCase().replace(' ', '-')}`}
                      >
                        ⭐ Rate
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-coral"
                        onClick={() => handleRemoveDest(dest.id)}
                        id={`remove-dest-btn-${dest.name.toLowerCase().replace(' ', '-')}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted text-sm">No destinations added to this trip yet.</p>
              )}
            </div>
          </div>

          {/* Media / Photos Section */}
          <div className="card media-card">
            <div className="media-header">
              <h3>Trip Gallery</h3>
              <label className="btn btn-primary btn-sm btn-upload" id="upload-photo-label">
                {uploading ? 'Uploading...' : '📷 Add Photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div className="photos-grid">
              {media.map((photo) => (
                <div key={photo.id} className="photo-item card">
                  <img src={photo.thumbnail_url || photo.url} alt={photo.caption || 'Trip memory'} loading="lazy" />
                  <button className="photo-delete" onClick={() => handleDeletePhoto(photo.id)}>
                    ✕
                  </button>
                  {photo.caption && <div className="photo-caption text-xs">{photo.caption}</div>}
                </div>
              ))}
              {media.length === 0 && (
                <div className="empty-photos text-muted text-sm">
                  Upload some photos to preserve your visual memories.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Map */}
        <div className="trip-sidebar">
          <div className="card map-card">
            <h3>Trip Map</h3>
            <div className="trip-map-container" ref={mapContainer} />
          </div>
        </div>
      </div>

      {/* Experience Rating Modal */}
      {activeDestForRating && (
        <div className="modal-overlay">
          <div className="modal-content card animate-scale-in">
            <button className="modal-close" onClick={() => setActiveDestForRating(null)}>✕</button>
            <h3 className="display-text">Rate {activeDestForRating.name}</h3>
            <form onSubmit={handleSubmitRating} className="modal-form">
              <div className="form-group">
                <label className="form-label">Score (1-5 Stars)</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${ratingScore >= star ? 'active' : ''}`}
                      onClick={() => setRatingScore(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review / Experience notes</label>
                <textarea
                  className="form-input"
                  style={{ height: '80px', resize: 'vertical' }}
                  placeholder="Share details about the culture, food, views, or budget..."
                  value={ratingReview}
                  onChange={(e) => setRatingReview(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select Tags</label>
                <div className="modal-tags">
                  {[
                    { id: 1, name: 'food' },
                    { id: 2, name: 'scenery' },
                    { id: 3, name: 'culture' },
                    { id: 4, name: 'nightlife' },
                    { id: 5, name: 'adventure' },
                    { id: 6, name: 'budget-friendly' },
                    { id: 7, name: 'relaxation' },
                    { id: 8, name: 'history' },
                    { id: 9, name: 'wildlife' },
                    { id: 10, name: 'beaches' },
                  ].map((tag) => (
                    <button
                      type="button"
                      key={tag.id}
                      className={`tag-chip ${ratingTags.includes(tag.id) ? 'active' : ''}`}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" id="submit-rating-btn">
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .trip-hero { position: relative; height: 280px; overflow: hidden; display: flex; align-items: flex-end; margin-bottom: var(--space-6); border-radius: var(--radius-xl); }
        .trip-hero-img { width: 100%; height: 100%; object-fit: cover; }
        .trip-hero-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 5rem; background: linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-secondary)); }
        .trip-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,10,15,0.9) 0%, rgba(10,10,15,0.3) 70%, transparent 100%); display: flex; justify-content: space-between; align-items: flex-end; padding: var(--space-6); }
        .trip-title { font-size: 2.2rem; margin-top: var(--space-2); text-shadow: var(--shadow-sm); }
        .trip-dates { color: var(--text-secondary); margin-top: 4px; }
        .trip-hero-actions { display: flex; gap: var(--space-2); }
        .trip-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--space-6); }
        .trip-main { display: flex; flex-direction: column; gap: var(--space-6); }
        .trip-sidebar { display: flex; flex-direction: column; }
        .text-card { padding: var(--space-6); }
        .trip-notes-text { line-height: 1.7; white-space: pre-wrap; font-size: 0.95rem; color: var(--text-secondary); }
        .dest-list-card { padding: var(--space-6); }
        .dest-list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
        .dest-search-wrap { position: relative; }
        .dest-autocomplete-box { position: absolute; top: 100%; right: 0; background: var(--color-bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 100; min-width: 200px; display: flex; flex-direction: column; max-height: 200px; overflow-y: auto; }
        .dest-autocomplete-box button { background: none; border: none; padding: var(--space-3) var(--space-4); text-align: left; color: var(--text-primary); font-size: 0.85rem; cursor: pointer; border-bottom: 1px solid var(--border-subtle); }
        .dest-autocomplete-box button:hover { background: var(--glass-bg); }
        .destinations-list { display: flex; flex-direction: column; gap: var(--space-2); }
        .dest-item { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); background: var(--color-bg-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); }
        .dest-number { margin-right: var(--space-2); }
        .dest-item-actions { display: flex; gap: var(--space-1); }
        .text-coral { color: var(--color-accent-coral) !important; }
        .media-card { padding: var(--space-6); }
        .media-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
        .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: var(--space-3); }
        .photo-item { position: relative; height: 110px; overflow: hidden; border-radius: var(--radius-md); }
        .photo-item img { width: 100%; height: 100%; object-fit: cover; }
        .photo-delete { position: absolute; top: var(--space-1); right: var(--space-1); border-radius: 50%; width: 22px; height: 22px; background: rgba(0,0,0,0.6); border: none; color: white; display: flex; align-items: center; justify-content: center; font-size: 9px; cursor: pointer; }
        .photo-caption { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.65); padding: 2px var(--space-2); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; text-align: center; }
        .empty-photos { grid-column: 1 / -1; text-align: center; padding: var(--space-8) 0; }
        .map-card { padding: var(--space-5); height: fit-content; }
        .trip-map-container { height: 350px; border-radius: var(--radius-md); margin-top: var(--space-3); border: 1px solid var(--border-subtle); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: var(--space-4); }
        .modal-content { max-width: 440px; width: 100%; padding: var(--space-8); position: relative; }
        .modal-close { position: absolute; top: var(--space-4); right: var(--space-4); background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; }
        .modal-close:hover { color: var(--text-primary); }
        .modal-form { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
        .modal-tags { display: flex; gap: var(--space-2); flex-wrap: wrap; }
        @media (max-width: 768px) {
          .trip-grid { grid-template-columns: 1fr; }
          .trip-hero { height: 200px; }
          .trip-title { font-size: 1.6rem; }
        }
      `}</style>
    </div>
  );
};

export default TripDetailPage;
