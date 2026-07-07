import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useRequireAuth } from '@/hooks/useAuth';
import * as tripsApi from '@/api/trips.api';

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
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 20],
      zoom: 1.8,
      projection: 'globe',
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Atmospheric warm chalk glow on globe
    map.current.on('style.load', () => {
      map.current.setFog({
        color: '#fff8f6',
        'high-color': '#fce5df',
        'horizon-blend': 0.04,
        'space-color': '#fff8f6',
        'star-intensity': 0.0,
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
          background: #db3c8a;
          color: #fff;
          border: 2px solid white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; cursor: pointer;
          transition: transform 150ms ease;
        `;

        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
        el.addEventListener('click', () => setSelectedTrip(trip));

        new mapboxgl.Marker(el)
          .setLngLat([dest.longitude, dest.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 20, className: 'map-popup' })
              .setHTML(`
                <div style="padding: 10px; color: #00522d; background: #fff; border: 1px solid #fce5df; border-radius: 12px; min-width: 150px; font-family: sans-serif;">
                  <strong style="display: block; font-size: 14px; margin-bottom: 2px;">${trip.title}</strong>
                  <span style="color: rgba(0, 82, 45, 0.6); font-size: 12px;">${dest.name}, ${dest.country}</span>
                </div>
              `)
          )
          .addTo(map.current);
      });
    });
  }, [trips]);

  return (
    <div className="map-page animate-fade-in">
      <div className="map-header">
        <h1 className="map-title display-text display-pink" style={{ fontSize: '46px', margin: 0 }}>
          World Map
        </h1>
        <p className="map-subtitle text-muted" style={{ fontStyle: 'normal', fontWeight: '700', letterSpacing: '0.04em', fontSize: '12px', marginTop: '4px' }}>
          {trips.length.toString().toUpperCase()} TRIPS PLOTTED
        </p>
      </div>

      <div className="map-container" id="map-container" ref={mapContainer} />

      {selectedTrip && (
        <div className="map-trip-panel card animate-slide-in">
          <button
            className="panel-close"
            onClick={() => setSelectedTrip(null)}
            id="map-panel-close-btn"
          >✕</button>
          <h3 className="display-text display-pink" style={{ fontSize: '24px', margin: 0 }}>{selectedTrip.title}</h3>
          <p className="text-xs text-muted" style={{ marginTop: '2px', fontWeight: '700' }}>
            {new Date(selectedTrip.start_date).toLocaleDateString()} –{' '}
            {new Date(selectedTrip.end_date).toLocaleDateString()}
          </p>
          {selectedTrip.description && (
            <p className="text-sm prose mt-4" style={{ color: 'var(--text-muted)' }}>{selectedTrip.description}</p>
          )}
        </div>
      )}

      <style>{`
        .map-page { height: calc(100vh - 40px); display: flex; flex-direction: column; margin: calc(-1 * var(--space-8)); position: relative; }
        .map-header { padding: var(--space-6) var(--space-8) var(--space-4); background: var(--color-chalk); border-bottom: 1px solid var(--border-subtle); z-index: 10; }
        .map-container { flex: 1; width: 100%; }
        .map-trip-panel { position: absolute; bottom: var(--space-8); left: 50%; transform: translateX(-50%); min-width: 320px; max-width: 480px; padding: var(--space-6); z-index: 10; background: #fff; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); }
        .panel-close { position: absolute; top: var(--space-4); right: var(--space-4); background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; }
        .panel-close:hover { color: var(--color-lipstick); }
      `}</style>
    </div>
  );
};

export default MapExplorerPage;
