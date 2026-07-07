import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useRequireAuth } from '@/hooks/useAuth';
import * as tripsApi from '@/api/trips.api';

// Note: Set your Mapbox public token in .env as VITE_MAPBOX_TOKEN
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MapExplorerPage = () => {
  useRequireAuth();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await tripsApi.getTrips({ limit: 50 });
        setTrips(res.items || []);
      } catch (err) {
        console.error('Failed to load trips for map', err);
      }
    };
    fetchTrips();
  }, []);

  useEffect(() => {
    if (map.current) return; // Only init once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 1.8,
      projection: 'globe',
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Atmospheric glow on globe
    map.current.on('style.load', () => {
      map.current.setFog({
        color: 'rgb(10, 10, 15)',
        'high-color': 'rgb(30, 30, 50)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(5, 5, 15)',
        'star-intensity': 0.6,
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers when trips change
  useEffect(() => {
    if (!map.current || !trips.length) return;

    trips.forEach((trip) => {
      if (!trip.destinations) return;
      const dests = Array.isArray(trip.destinations) ? trip.destinations : [];

      dests.forEach((dest) => {
        if (!dest?.latitude || !dest?.longitude) return;

        const el = document.createElement('div');
        el.className = 'map-marker';
        el.innerHTML = '✈';
        el.style.cssText = `
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; cursor: pointer;
          box-shadow: 0 0 20px rgba(99,102,241,0.5);
          transition: transform 150ms ease;
        `;

        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.3)'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
        el.addEventListener('click', () => setSelectedTrip(trip));

        new mapboxgl.Marker(el)
          .setLngLat([dest.longitude, dest.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 20, className: 'map-popup' })
              .setHTML(`
                <div style="padding: 8px; color: #f1f5f9; background: #16161f; border-radius: 8px; min-width: 150px;">
                  <strong>${trip.title}</strong><br/>
                  <small style="color: #94a3b8;">${dest.name}, ${dest.country}</small>
                </div>
              `)
          )
          .addTo(map.current);
      });
    });
  }, [trips]);

  return (
    <div className="map-page">
      <div className="map-header">
        <h1 className="map-title">
          <span className="gradient-text display-text">World Map</span>
        </h1>
        <p className="map-subtitle text-muted">{trips.length} trips plotted</p>
      </div>

      <div className="map-container" id="map-container" ref={mapContainer} />

      {selectedTrip && (
        <div className="map-trip-panel card animate-slide-in">
          <button
            className="panel-close"
            onClick={() => setSelectedTrip(null)}
            id="map-panel-close-btn"
          >✕</button>
          <h3>{selectedTrip.title}</h3>
          <p className="text-sm text-muted">
            {new Date(selectedTrip.start_date).toLocaleDateString()} –{' '}
            {new Date(selectedTrip.end_date).toLocaleDateString()}
          </p>
          {selectedTrip.description && (
            <p className="text-sm mt-4">{selectedTrip.description}</p>
          )}
        </div>
      )}

      <style>{`
        .map-page { height: calc(100vh - var(--navbar-height)); display: flex; flex-direction: column; margin: calc(-1 * var(--space-8)); }
        .map-header { padding: var(--space-6) var(--space-8) var(--space-4); }
        .map-title { font-size: 1.8rem; margin-bottom: var(--space-1); }
        .map-container { flex: 1; border-radius: 0; border-top: 1px solid var(--border-subtle); }
        .map-trip-panel { position: absolute; bottom: var(--space-8); left: 50%; transform: translateX(-50%); min-width: 280px; padding: var(--space-5); z-index: 10; }
        .panel-close { position: absolute; top: var(--space-3); right: var(--space-3); background: none; border: none; color: var(--text-muted); font-size: 1rem; cursor: pointer; }
        .panel-close:hover { color: var(--text-primary); }
      `}</style>
    </div>
  );
};

export default MapExplorerPage;
