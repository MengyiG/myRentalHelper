import { useState } from 'react';
import { markerColor } from '../utils/distance.js';

const statusIcons = {
  pending: '⏳',
  geocoding: '🔍',
  routing: '🗺️',
  done: null,
  geocodeError: '⚠️',
};

export default function ListingCard({ listing, index, onEdit, onDelete, onRecalculate, tr, distanceUnit = 'km' }) {
  const [expanded, setExpanded] = useState(false);

  const color = markerColor(index);
  const { id, agent, address, type, price, priceMax, includesUtilities,
    amenities, pros, cons, moveInDate, description, distance, commute, status, geocodeError, resolvedAddress } = listing;

  const handleDelete = () => {
    if (window.confirm(tr('confirmDelete'))) onDelete(id);
  };

  const formatDist = (d) => {
    if (d == null) return '—';
    if (distanceUnit === 'mi') return `${(d * 0.621371).toFixed(1)} ${tr('mi')}`;
    return `${d.toFixed(1)} ${tr('km')}`;
  };

  const formatPrice = (p) => p != null ? `$${Number(p).toLocaleString()}` : '—';

  const isProcessing = status === 'geocoding' || status === 'routing';

  const safeWalk = (() => {
    const w = commute?.walking;
    if (w == null || !distance) return w;
    const minExpected = Math.round(distance / 7 * 60);
    return w >= minExpected ? w : Math.round(distance / 4.5 * 60);
  })();

  const displayDate = moveInDate
    ? (moveInDate.includes('T') ? moveInDate.split('T')[0] : moveInDate)
    : null;

  const idNum = id.replace(/\D/g, '');

  return (
    <article className="listing-card" onClick={() => setExpanded(v => !v)} style={{ cursor: 'pointer' }}>
      {/* Hero */}
      <div
        className="card-hero"
        style={{ background: `linear-gradient(145deg, ${color} 0%, ${color}CC 100%)` }}
      >
        <span className="card-hero-agent">{agent || '—'}</span>
        <span className="card-hero-badge">{id}</span>
        <span className="card-hero-watermark">{idNum}</span>
      </div>

      {/* Content */}
      <div className="card-content">
        {/* Address + Price */}
        <div className="card-top-row">
          <div className="card-address-title">{address || '—'}</div>
          <div className="card-price-block">
            {price != null && priceMax != null && priceMax !== price ? (
              <>
                <span className="price-main-lg">{formatPrice(price)}</span>
                <span className="price-range-sep">–</span>
                <span className="price-main-lg">{formatPrice(priceMax)}</span>
              </>
            ) : price != null ? (
              <span className="price-main-lg">{formatPrice(price)}</span>
            ) : null}
            {price != null && <span className="price-period-sm">{tr('perMonth')}</span>}
          </div>
        </div>

        {/* Type + utilities + move-in + distance */}
        <div className="card-meta-row">
          {type && <span className="badge">{type}</span>}
          {includesUtilities && <span className="badge utility-badge">{tr('includesUtilities')}</span>}
          {displayDate && (
            <span className="card-movein">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {displayDate}
            </span>
          )}
          {!isProcessing && !geocodeError && distance != null && (
            <span className="card-distance">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
              </svg>
              {formatDist(distance)}
            </span>
          )}
          {isProcessing && (
            <span className="inline-spinner">{statusIcons[status]} {tr(status === 'geocoding' ? 'geocoding' : 'routing')}</span>
          )}
          {geocodeError && (
            <span className="card-distance error">⚠️ {tr('geocodeError')}</span>
          )}
        </div>

        {/* Commute pills */}
        {!isProcessing && !geocodeError && (safeWalk != null || commute?.transit != null || commute?.driving != null) && (
          <div className="commute-pills">
            {safeWalk != null && (
              <span className="commute-pill">
                <span className="commute-pill-icon">🚶</span>
                <span className="commute-pill-value">{safeWalk}</span>
                <span className="commute-pill-unit">{tr('min')}</span>
              </span>
            )}
            {commute?.transit != null && (
              <span className="commute-pill">
                <span className="commute-pill-icon">🚌</span>
                <span className="commute-pill-value">{commute.transit}</span>
                <span className="commute-pill-unit">{tr('min')}</span>
                <span className="commute-pill-est">{tr('transitNote')}</span>
              </span>
            )}
            {commute?.driving != null && (
              <span className="commute-pill">
                <span className="commute-pill-icon">🚗</span>
                <span className="commute-pill-value">{commute.driving}</span>
                <span className="commute-pill-unit">{tr('min')}</span>
              </span>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="card-footer" onClick={e => e.stopPropagation()}>
          {!isProcessing && (
            <button className="icon-btn small" onClick={() => onRecalculate(listing)} title="重新定位 / Re-geocode">↻</button>
          )}
          <button className="icon-btn small" onClick={() => onEdit(listing)} title={tr('edit')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className="icon-btn small danger" onClick={handleDelete} title={tr('delete')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
          <button className="expand-btn" onClick={() => setExpanded(v => !v)}>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="card-details">
          {resolvedAddress && (
            <div className="resolved-address-row">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="resolved-label">定位到：</span>
              <span className="resolved-text">{resolvedAddress.split(',').slice(0, 5).join(',')}</span>
            </div>
          )}

          {amenities?.length > 0 && (
            <div className="detail-section">
              <span className="detail-label">{tr('amenities')}</span>
              <div className="tag-list">
                {amenities.map((a, i) => <span key={i} className="tag">{a}</span>)}
              </div>
            </div>
          )}

          <div className="detail-two-col">
            {pros?.length > 0 && (
              <div className="detail-section">
                <span className="detail-label pros-label">✓ {tr('pros')}</span>
                <ul className="bullet-list pros">
                  {pros.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {cons?.length > 0 && (
              <div className="detail-section">
                <span className="detail-label cons-label">✗ {tr('cons')}</span>
                <ul className="bullet-list cons">
                  {cons.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>

          {description && (
            <div className="detail-section">
              <span className="detail-label">{tr('description')}</span>
              <p className="detail-desc">{description}</p>
            </div>
          )}

          {!geocodeError && (safeWalk != null || commute?.driving != null) && (
            <div className="detail-section">
              <span className="detail-label">{tr('commute')}</span>
              <div className="commute-detailed">
                <div className="commute-card">
                  <span className="commute-icon-big">🚶</span>
                  <span className="commute-mode">{tr('walking')}</span>
                  <span className="commute-time">{safeWalk ?? '—'} {tr('min')}</span>
                </div>
                <div className="commute-card">
                  <span className="commute-icon-big">🚌</span>
                  <span className="commute-mode">{tr('transit')}</span>
                  <span className="commute-time">{commute?.transit ?? '—'} {tr('min')}</span>
                  <span className="commute-est">{tr('transitNote')}</span>
                </div>
                <div className="commute-card">
                  <span className="commute-icon-big">🚗</span>
                  <span className="commute-mode">{tr('driving')}</span>
                  <span className="commute-time">{commute?.driving ?? '—'} {tr('min')}</span>
                </div>
              </div>
              <p className="commute-disclaimer">{tr('commuteDisclaimer')}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
