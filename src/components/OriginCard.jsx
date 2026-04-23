import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function OriginCard({ origin, tr }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!origin?.lat || !mapRef.current) return;

    // Destroy previous instance if coordinates changed
    if (instanceRef.current) {
      instanceRef.current.remove();
      instanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [origin.lat, origin.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    L.circleMarker([origin.lat, origin.lng], {
      radius: 9,
      fillColor: '#4D6FA5',
      fillOpacity: 1,
      color: '#ffffff',
      weight: 2.5,
    }).addTo(map);

    instanceRef.current = map;

    return () => {
      map.remove();
      instanceRef.current = null;
    };
  }, [origin?.lat, origin?.lng]);

  if (!origin?.lat) return null;

  return (
    <div className="origin-card">
      <div className="origin-card-map" ref={mapRef} />
      <div className="origin-card-overlay">
        <span className="origin-card-badge">📍 {tr('originMarker')}</span>
      </div>
      <div className="origin-card-info">
        <p className="origin-card-address">{origin.address}</p>
      </div>
    </div>
  );
}
