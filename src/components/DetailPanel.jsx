import { agentColor } from '../utils/colors.js';

export default function DetailPanel({ listing, index, onClose, tr, distanceUnit = 'km' }) {
  if (!listing) return null;

  const {
    id, agent, address, type, price, priceMax, includesUtilities,
    amenities, pros, cons, moveInDate, description, distance, commute,
    geocodeError, resolvedAddress,
  } = listing;
  const color = agentColor(agent);

  const formatDist = (d) => {
    if (d == null) return '—';
    if (distanceUnit === 'mi') return `${(d * 0.621371).toFixed(1)} ${tr('mi')}`;
    return `${d.toFixed(1)} ${tr('km')}`;
  };

  const formatPrice = (p) => p != null ? `$${Number(p).toLocaleString()}` : '—';

  const safeWalk = (() => {
    const w = commute?.walking;
    if (w == null || !distance) return w;
    const minExpected = Math.round(distance / 7 * 60);
    return w >= minExpected ? w : Math.round(distance / 4.5 * 60);
  })();

  const displayDate = moveInDate
    ? (moveInDate.includes('T') ? moveInDate.split('T')[0] : moveInDate)
    : null;

  return (
    <aside className="detail-panel">
      {/* Colored header */}
      <div className="dp-hero" style={{ background: `linear-gradient(145deg, ${color} 0%, ${color}CC 100%)` }}>
        <div className="dp-hero-top">
          <span className="dp-agent">{agent || '—'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="dp-badge">{id}</span>
            <button className="dp-close" onClick={onClose} title="关闭">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="dp-address">{address || '—'}</div>
        <div className="dp-price-row">
          {price != null && priceMax != null && priceMax !== price ? (
            <span className="dp-price">{formatPrice(price)} – {formatPrice(priceMax)}</span>
          ) : price != null ? (
            <span className="dp-price">{formatPrice(price)}</span>
          ) : null}
          {price != null && <span className="dp-price-period">{tr('perMonth')}</span>}
          {type && <span className="dp-type-badge">{type}</span>}
          {includesUtilities && <span className="dp-type-badge">{tr('includesUtilities')}</span>}
        </div>
        {displayDate && (
          <div className="dp-movein">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {displayDate}
            {distance != null && !geocodeError && (
              <span style={{ marginLeft: 8 }}>· {formatDist(distance)}</span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="dp-body">
        {resolvedAddress && (
          <div className="resolved-address-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="resolved-label">{tr('resolvedAs')}</span>
            <span className="resolved-text">{resolvedAddress.split(',').slice(0, 5).join(',')}</span>
          </div>
        )}

        {!geocodeError && (safeWalk != null || commute?.transit != null || commute?.driving != null) && (
          <div className="detail-section">
            <span className="detail-label">{tr('commute')}</span>
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
            <p className="commute-disclaimer">{tr('commuteDisclaimer')}</p>
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
      </div>
    </aside>
  );
}
