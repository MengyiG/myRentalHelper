import { agentColor } from '../utils/colors.js';

const statusIcons = {
  pending: '⏳',
  geocoding: '🔍',
  routing: '🗺️',
  done: null,
  geocodeError: '⚠️',
};

export default function ListingCard({ listing, index, isSelected, onSelect, onEdit, onDelete, onRecalculate, tr, lang = 'zh', distanceUnit = 'km' }) {
  const { id, agent, address, type, price, priceMax, includesUtilities,
    amenities, moveInDate, distance, commute, status, geocodeError } = listing;
  const color = agentColor(agent);

  const handleDelete = (e) => {
    e.stopPropagation();
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
    <article
      className={`listing-card${isSelected ? ' listing-card--selected' : ''}`}
      onClick={() => onSelect(listing)}
      style={{ cursor: 'pointer' }}
    >
      {/* Hero */}
      <div
        className="card-hero"
        style={{ background: `linear-gradient(145deg, ${color} 0%, ${color}CC 100%)` }}
      >
        <div className="card-hero-top">
          {isSelected ? (
            <span className="card-check">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
          ) : <span />}
        </div>
        {price != null && (
          <div className="card-hero-price">
            {price != null && priceMax != null && priceMax !== price
              ? `${formatPrice(price)} – ${formatPrice(priceMax)}`
              : formatPrice(price)}
            <span className="card-hero-price-period">{tr('perMonth')}</span>
          </div>
        )}
        <div className="card-hero-agent-row">
          <span className="card-hero-agent">{agent || '—'}</span>
          <div className="card-hero-actions" onClick={e => e.stopPropagation()}>
            {!isProcessing && (
              <button className="hero-action-btn" onClick={() => onRecalculate(listing)} title={lang === 'zh' ? '重新定位' : 'Re-geocode'}>↻</button>
            )}
            <button className="hero-action-btn" onClick={() => onEdit(listing)} title={tr('edit')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className="hero-action-btn danger" onClick={handleDelete} title={tr('delete')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
        <span className="card-hero-watermark">{idNum}</span>
      </div>

      {/* Content */}
      <div className="card-content">
        {/* Address */}
        <div className="card-address-title">{address || '—'}</div>

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

      </div>
    </article>
  );
}
