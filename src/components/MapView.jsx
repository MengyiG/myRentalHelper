import { useEffect, useRef, useMemo, useState } from 'react';
import { markerColor } from '../utils/colors.js';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function createNumberedIcon(label, color) {
  return L.divIcon({
    html: `<div style="
      background:${color};color:#fff;border-radius:50%;
      width:30px;height:30px;display:flex;align-items:center;
      justify-content:center;font-weight:700;font-size:11px;
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);
      font-family:system-ui,sans-serif;
    ">${label}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function createOriginIcon() {
  return L.divIcon({
    html: `<div style="
      background:#e53935;color:#fff;border-radius:50%;
      width:32px;height:32px;display:flex;align-items:center;
      justify-content:center;font-size:16px;
      border:3px solid white;box-shadow:0 2px 8px rgba(229,57,53,0.5);
    ">★</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

function buildPopupHtml(listing, tr) {
  const fmt = (p) => p != null ? `$${Number(p).toLocaleString()}` : '—';
  const fmtDist = (d) => d != null ? `${d.toFixed(1)} km` : '—';
  return `
    <div style="min-width:200px;font-family:system-ui,sans-serif;font-size:13px;line-height:1.6">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">${listing.id} · ${listing.type || ''}</div>
      <div style="color:#555;margin-bottom:6px">${listing.address}</div>
      <div style="margin-bottom:4px">
        <strong>${listing.agent || ''}</strong>
        ${listing.price ? `&nbsp;·&nbsp;<span style="color:#4D6FA5;font-weight:600">${fmt(listing.price)}${listing.priceMax && listing.priceMax !== listing.price ? ` – ${fmt(listing.priceMax)}` : ''}/mo</span>` : ''}
      </div>
      ${listing.distance != null ? `<div>📍 ${fmtDist(listing.distance)}</div>` : ''}
      ${listing.commute?.walking != null ? `<div style="margin-top:4px">🚶 ${listing.commute.walking}min &nbsp; 🚌 ${listing.commute.transit ?? '—'}min &nbsp; 🚗 ${listing.commute.driving ?? '—'}min</div>` : ''}
      ${listing.moveInDate ? `<div style="color:#888;font-size:11px;margin-top:4px">${listing.moveInDate}</div>` : ''}
    </div>
  `;
}

export default function MapView({ listings, origin, tr, lang }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const linesRef = useRef([]);
  const [agentFilter, setAgentFilter] = useState('');

  const agents = useMemo(
    () => [...new Set(listings.map(l => l.agent).filter(Boolean))].sort(),
    [listings]
  );

  const geocodedListings = useMemo(
    () => listings.filter(l => l.lat != null && l.lng != null && (!agentFilter || l.agent === agentFilter)),
    [listings, agentFilter]
  );

  useEffect(() => {
    if (!origin) return;

    let isMounted = true;

    function initMap() {
      if (!isMounted || !mapRef.current) return;
      // eslint-disable-next-line no-shadow

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [origin.lat, origin.lng],
          zoom: 13,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;

      // Clear old markers and lines
      markersRef.current.forEach(m => m.remove());
      linesRef.current.forEach(l => l.remove());
      markersRef.current = [];
      linesRef.current = [];

      // Origin marker
      const originMarker = L.marker([origin.lat, origin.lng], { icon: createOriginIcon(), zIndexOffset: 1000 })
        .bindPopup(`<strong>${tr('originMarker')}</strong><br/>${origin.address}`)
        .addTo(map);
      markersRef.current.push(originMarker);

      // Listing markers and lines
      geocodedListings.forEach((listing, i) => {
        const color = markerColor(i);
        const marker = L.marker([listing.lat, listing.lng], { icon: createNumberedIcon(listing.id, color) })
          .bindPopup(buildPopupHtml(listing, tr), { maxWidth: 280 })
          .addTo(map);
        markersRef.current.push(marker);

        // White outline underneath for contrast
        const lineOutline = L.polyline(
          [[origin.lat, origin.lng], [listing.lat, listing.lng]],
          { color: '#ffffff', weight: 5, opacity: 0.7, dashArray: '8 5' }
        ).addTo(map);
        linesRef.current.push(lineOutline);

        const line = L.polyline(
          [[origin.lat, origin.lng], [listing.lat, listing.lng]],
          { color, weight: 3, dashArray: '8 5', opacity: 0.92 }
        ).addTo(map);
        linesRef.current.push(line);
      });

      // Fit bounds
      const allPoints = [
        [origin.lat, origin.lng],
        ...geocodedListings.map(l => [l.lat, l.lng])
      ];
      if (allPoints.length > 1) {
        map.fitBounds(allPoints, { padding: [40, 40] });
      } else {
        map.setView([origin.lat, origin.lng], 13);
      }
    }

    initMap();

    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, geocodedListings, tr]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (!origin) {
    return (
      <div className="map-placeholder">
        <div className="empty-icon">🗺️</div>
        <p>{tr('noOrigin')}</p>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      {agents.length > 1 && (
        <div className="agent-filter-bar">
          <button
            className={`agent-pill ${agentFilter === '' ? 'active' : ''}`}
            onClick={() => setAgentFilter('')}
          >
            {lang === 'zh' ? '全部' : 'All'}
          </button>
          {agents.map(name => (
            <button
              key={name}
              className={`agent-pill ${agentFilter === name ? 'active' : ''}`}
              onClick={() => setAgentFilter(a => a === name ? '' : name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div ref={mapRef} className="map-container" />

      {/* Legend */}
      {geocodedListings.length > 0 && (
        <div className="map-legend">
          <div className="legend-title">{tr('legend')}</div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#e53935' }} />
            <span>{tr('originMarker')}: {origin.address}</span>
          </div>
          {geocodedListings.map((l, i) => (
            <div key={l.id} className="legend-item">
              <span className="legend-dot" style={{ background: markerColor(i) }} />
              <span><strong>{l.id}</strong> {l.address}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
