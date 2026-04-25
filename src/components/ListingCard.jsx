import { useState } from 'react';
import { agentColor } from '../utils/colors.js';

const statusIcons = {
  pending: '⏳',
  geocoding: '🔍',
  routing: '🗺️',
  done: null,
  geocodeError: '⚠️',
};

function ArchiveIcon({ isArchived }) {
  return isArchived ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5" rx="1"/>
      <polyline points="10 14 12 12 14 14"/>
      <line x1="12" y1="12" x2="12" y2="17"/>
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5" rx="1"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  );
}

export default function ListingCard({ listing, index, isSelected, onSelect, onEdit, onDelete, onRecalculate, onArchive, tr, lang = 'zh', distanceUnit = 'km' }) {
  const { id, agent, address, type, price, priceMax, includesUtilities,
    moveInDate, distance, commute, status, geocodeError } = listing;
  const color = agentColor(agent);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleArchive = (e) => {
    e.stopPropagation();
    onArchive(id);
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
    <>
      <article
        className={`listing-card lc-card${isSelected ? ' listing-card--selected' : ''}`}
        onClick={() => onSelect(listing)}
      >
        {/* Stub */}
        <div
          className="lc-stub"
          style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` }}
        >
          <div className="lc-stub-top">
            <span>{tr('listing')}</span>
            <span>№ {idNum}</span>
          </div>
          {price != null && (
            <div className="lc-stub-price">
              {priceMax != null && priceMax !== price
                ? `${formatPrice(price)}–${formatPrice(priceMax)}`
                : formatPrice(price)}
              <span className="lc-stub-period"> {tr('perMonth')}</span>
            </div>
          )}
          <div className="lc-stub-agent-row">
            <span className="lc-stub-agent">{agent || '—'}</span>
            <div className="lc-stub-actions" onClick={e => e.stopPropagation()}>
              {isSelected && (
                <span className="lc-check">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
              <button className="lc-btn" onClick={() => onRecalculate(listing)} title={lang === 'zh' ? '重新定位' : 'Re-geocode'}>↻</button>
              <button className="lc-btn" onClick={() => onEdit(listing)} title={tr('edit')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              {onArchive && (
                <button
                  className={`lc-btn${listing.archived ? ' lc-btn--unarchive' : ''}`}
                  onClick={handleArchive}
                  title={listing.archived ? tr('unarchive') : tr('archive')}
                >
                  <ArchiveIcon isArchived={listing.archived} />
                </button>
              )}
              <button
                className="lc-btn lc-btn--danger"
                onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                title={tr('delete')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Perforation */}
        <div className="lc-perf" />

        {/* Body */}
        <div className="lc-body">
          <div className="lc-addr">{address || '—'}</div>

          <div className="lc-meta">
            {type && (
              <span className="lc-kv">
                <span className="lc-kv-label">{tr('type')}</span>
                <span className="lc-kv-value">{type}</span>
              </span>
            )}
            {displayDate && (
              <span className="lc-kv">
                <span className="lc-kv-label">{tr('moveIn')}</span>
                <span className="lc-kv-value">{displayDate}</span>
              </span>
            )}
            {!isProcessing && !geocodeError && distance != null && (
              <span className="lc-kv">
                <span className="lc-kv-label">{tr('distance')}</span>
                <span className="lc-kv-value">{formatDist(distance)}</span>
              </span>
            )}
            {includesUtilities && (
              <span className="lc-kv">
                <span className="lc-kv-label lc-kv-label--good">✓ {tr('includesUtilities')}</span>
              </span>
            )}
            {isProcessing && (
              <span className="lc-inline-spinner">{statusIcons[status]} {tr(status === 'geocoding' ? 'geocoding' : 'routing')}</span>
            )}
            {geocodeError && (
              <span className="lc-kv lc-kv--error">⚠️ {tr('geocodeError')}</span>
            )}
          </div>

          {!isProcessing && !geocodeError &&
            (safeWalk != null || commute?.transit != null || commute?.driving != null) && (
            <div className="lc-commute-row">
              {safeWalk != null && (
                <div className="lc-commute-cell">
                  <span className="lc-commute-ic">🚶</span>
                  <span className="lc-commute-val">{safeWalk}{tr('min')}</span>
                  <span className="lc-commute-label">{tr('walking')}</span>
                </div>
              )}
              {commute?.transit != null && (
                <div className="lc-commute-cell">
                  <span className="lc-commute-ic">🚌</span>
                  <span className="lc-commute-val">{commute.transit}{tr('min')}</span>
                  <span className="lc-commute-label">{tr('transit')}</span>
                </div>
              )}
              {commute?.driving != null && (
                <div className="lc-commute-cell">
                  <span className="lc-commute-ic">🚗</span>
                  <span className="lc-commute-val">{commute.driving}{tr('min')}</span>
                  <span className="lc-commute-label">{tr('driving')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </article>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="dc-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="dc-dialog" onClick={e => e.stopPropagation()}>
            <div className="dc-title">
              {lang === 'zh' ? '确认删除？' : 'Confirm delete?'}
            </div>
            <div className="dc-body">
              {lang === 'zh'
                ? '删除后不可恢复。如果你暂时对这个房源不感兴趣，可以选择归档，随时可以恢复：'
                : "This can't be undone. If you just lost interest, try archiving instead — you can restore it anytime:"}
            </div>
            {onArchive && (
              <div className="dc-archive-hint">
                <span
                  className="lc-btn lc-btn--demo"
                  style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` }}
                >
                  <ArchiveIcon isArchived={false} />
                </span>
                <span className="dc-hint-label">
                  {lang === 'zh' ? '此按钮可归档（可恢复）' : 'This button archives (reversible)'}
                </span>
              </div>
            )}
            <div className="dc-actions">
              <button className="dc-btn dc-btn--cancel" onClick={() => setShowDeleteConfirm(false)}>
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              {onArchive && (
                <button
                  className="dc-btn dc-btn--archive"
                  onClick={() => { setShowDeleteConfirm(false); onArchive(id); }}
                >
                  {tr('archive')}
                </button>
              )}
              <button
                className="dc-btn dc-btn--delete"
                onClick={() => { setShowDeleteConfirm(false); onDelete(id); }}
              >
                {tr('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
