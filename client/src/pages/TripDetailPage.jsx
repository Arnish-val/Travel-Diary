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
      style: 'mapbox://styles/mapbox/light-v11',
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
        width: 16px; height: 16px;
        background: #db3c8a;
        border: 2px solid white;
        border-radius: 50%;
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
            'line-color': '#db3c8a',
            'line-width': 2.5,
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
      <div className="trip-hero">
        {trip.cover_photo_url ? (
          <img className="trip-hero-img" src={trip.cover_photo_url} alt={trip.title} />
        ) : (
          <div className="trip-hero-placeholder">🏕</div>
        )}
        <div className="trip-hero-overlay">
          <div className="trip-hero-content">
            <span className="badge badge-pink">
              {trip.privacy}
            </span>
            <h1 className="trip-title display-text display-white">{trip.title}</h1>
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
            <h3 className="display-text" style={{ fontSize: '24px', marginBottom: '12px' }}>Diary Notes</h3>
            <p className="trip-notes-text prose">
              {trip.description || <em className="text-muted">No diary entries or notes written for this trip yet. Click Edit to add some!</em>}
            </p>
          </div>

          {/* Destinations Section */}
          <div className="card dest-list-card">
            <div className="dest-list-header">
              <h3 className="display-text" style={{ fontSize: '24px', margin: 0 }}>Destinations visited</h3>
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
                        className="btn btn-ghost btn-sm text-forest"
                        style={{ fontWeight: 'bold' }}
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
              <h3 className="display-text" style={{ fontSize: '24px', margin: 0 }}>Trip Gallery</h3>
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
                <div key={photo.id} className="photo-item">
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
            <h3 className="display-text" style={{ fontSize: '24px', marginBottom: '12px' }}>Trip Map</h3>
            <div className="trip-map-container" ref={mapContainer} />
          </div>
        </div>
      </div>

      {/* Experience Rating Modal */}
      {activeDestForRating && (
        <div className="modal-overlay">
          <div className="modal-content card animate-scale-in">
            <button className="modal-close" onClick={() => setActiveDestForRating(null)}>✕</button>
            <h3 className="display-text" style={{ fontSize: '30px', marginBottom: '20px' }}>Rate {activeDestForRating.name}</h3>
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
        .trip-hero { position: relative; height: 320px; overflow: hidden; display: flex; align-items: flex-end; margin-bottom: var(--space-8); }
        .trip-hero-img { width: 100%; height: 100%; object-fit: cover; }
        .trip-hero-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 5rem; background: var(--color-blush); color: var(--color-forest); }
        .trip-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,82,45,0.7) 0%, rgba(0,82,45,0.2) 70%, transparent 100%); display: flex; justify-content: space-between; align-items: flex-end; padding: var(--space-6); }
        .trip-title { font-size: clamp(30px, 5vw, 56px); margin: 0; line-height: 0.85; }
        .trip-dates { color: var(--color-blush); margin-top: 8px; font-weight: 500; }
        .trip-hero-actions { display: flex; gap: var(--space-2); }
        .trip-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--space-10); }
        .trip-main { display: flex; flex-direction: column; gap: var(--space-8); }
        .trip-sidebar { display: flex; flex-direction: column; }
        
        .text-card { padding: var(--space-6); background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        .trip-notes-text { line-height: 1.7; white-space: pre-wrap; font-size: 16px; color: var(--color-forest); }
        
        .dest-list-card { padding: var(--space-6); background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        .dest-list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-2); }
        .dest-search-wrap { position: relative; }
        .dest-autocomplete-box { position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); z-index: 100; min-width: 220px; display: flex; flex-direction: column; max-height: 200px; overflow-y: auto; }
        .dest-autocomplete-box button { background: none; border: none; padding: var(--space-3) var(--space-4); text-align: left; color: var(--color-forest); font-size: 13px; font-weight: 500; cursor: pointer; border-bottom: 1px solid var(--border-subtle); }
        .dest-autocomplete-box button:hover { background: var(--color-blush); }
        .destinations-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .dest-item { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-5); background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); }
        .dest-number { margin-right: var(--space-2); }
        .dest-item-actions { display: flex; gap: var(--space-2); }
        
        .media-card { padding: var(--space-6); background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        .media-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); }
        .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--space-4); }
        .photo-item { position: relative; height: 130px; overflow: hidden; border: 1px solid var(--border-subtle); }
        .photo-item img { width: 100%; height: 100%; object-fit: cover; }
        .photo-delete { position: absolute; top: var(--space-2); right: var(--space-2); border-radius: 50%; width: 26px; height: 26px; background: rgba(0,0,0,0.65); border: none; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; cursor: pointer; }
        .photo-caption { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.65); color: #fff; padding: 4px var(--space-2); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; text-align: center; }
        .empty-photos { grid-column: 1 / -1; text-align: center; padding: var(--space-8) 0; }
        
        .map-card { padding: var(--space-6); height: fit-content; background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        .trip-map-container { height: 380px; border-radius: var(--radius-md); margin-top: var(--space-4); border: 1px solid var(--border-subtle); }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,82,45,0.25); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: var(--space-4); }
        .modal-content { max-width: 460px; width: 100%; padding: var(--space-8); position: relative; background: #fff; border: 1px solid var(--border-default); border-radius: var(--radius-xl); }
        .modal-close { position: absolute; top: var(--space-4); right: var(--space-4); background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
        .modal-form { display: flex; flex-direction: column; gap: var(--space-5); margin-top: var(--space-5); }
        .modal-tags { display: flex; gap: var(--space-2); flex-wrap: wrap; }
        
        .tag-chip { border: 1px solid var(--border-subtle); background: #fff; color: var(--color-forest); font-family: var(--font-grotesk); font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: var(--radius-full); cursor: pointer; transition: all var(--transition-fast); }
        .tag-chip.active { background: var(--color-lipstick); color: #fff; border-color: var(--color-lipstick); }
        .tag-chip:hover { border-color: var(--color-lipstick); }

        @media (max-width: 768px) {
          .trip-grid { grid-template-columns: 1fr; gap: 40px; }
          .trip-hero { height: 240px; }
        }
      `}</style>
    </div>
  );
};

export default TripDetailPage;
