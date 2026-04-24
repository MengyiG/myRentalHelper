import { useState, useRef, useEffect } from 'react';
import ListingCard from './ListingCard.jsx';
import DetailPanel from './DetailPanel.jsx';

const ANIM_MS = 220;

export default function ListingList({ listings, origin, onEdit, onDelete, onRecalculate, tr, lang, distanceUnit }) {
  const [agentFilter, setAgentFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [closingIds, setClosingIds] = useState(new Set());
  const [priceFilter, setPriceFilter] = useState('');
  const [sortOrder, setSortOrder] = useState(''); // '' | 'asc' | 'desc'
  const closeTimers = useRef({});

  const agents = [...new Set(listings.map(l => l.agent).filter(Boolean))].sort();

  const agentFiltered = agentFilter ? listings.filter(l => l.agent === agentFilter) : listings;

  const priceNum = priceFilter !== '' ? Number(priceFilter) : null;
  const priceFiltered = (priceNum != null && !isNaN(priceNum))
    ? agentFiltered.filter(l => l.price == null || l.price <= priceNum)
    : agentFiltered;

  const filtered = sortOrder === 'asc'
    ? [...priceFiltered].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    : sortOrder === 'desc'
      ? [...priceFiltered].sort((a, b) => (b.distance ?? -Infinity) - (a.distance ?? -Infinity))
      : priceFiltered;

  const isFiltered = agentFilter || (priceNum != null && !isNaN(priceNum));

  const cycleSortOrder = () => setSortOrder(o => o === '' ? 'asc' : o === 'asc' ? 'desc' : '');

  const closePanel = (id) => {
    setClosingIds(prev => new Set([...prev, id]));
    closeTimers.current[id] = setTimeout(() => {
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      setClosingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      delete closeTimers.current[id];
    }, ANIM_MS);
  };

  const handleSelect = (listing) => {
    const { id } = listing;
    if (closeTimers.current[id]) clearTimeout(closeTimers.current[id]);

    if (selectedIds.includes(id)) {
      if (closingIds.has(id)) {
        // was closing — reopen
        setClosingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      } else {
        closePanel(id);
      }
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  useEffect(() => {
    const timers = closeTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  if (listings.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏠</div>
        <p>{tr('noListings')}</p>
      </div>
    );
  }

  return (
    <div className="listing-list">
      <div className="listing-top-row">
        <div className="list-header">
          <h2 className="list-title">{tr('listingsTitle')}</h2>
          <span className="list-count">{filtered.length}{isFiltered ? `/${listings.length}` : ''}</span>
        </div>
        {selectedIds.length > 0 && (
          <div className="compare-header">
            <span className="compare-title">Select &amp; Compare</span>
            <span className="compare-count">{selectedIds.length}</span>
          </div>
        )}
      </div>

      <div className="agent-filter-bar">
        {agents.length > 1 && (
          <>
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
          </>
        )}

        <button
          className={`sort-btn${sortOrder ? ' sort-btn--active' : ''}`}
          onClick={cycleSortOrder}
          title={lang === 'zh' ? '按距离排序' : 'Sort by distance'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          </svg>
          {sortOrder === 'asc'
            ? (lang === 'zh' ? '近 → 远' : 'Near → Far')
            : sortOrder === 'desc'
              ? (lang === 'zh' ? '远 → 近' : 'Far → Near')
              : (lang === 'zh' ? '距离排序' : 'By Distance')}
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ opacity: sortOrder ? 1 : 0.45, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>

        <div className="price-filter-wrap">
          <span className="price-filter-prefix">≤ $</span>
          <input
            type="number"
            className="price-filter-input"
            placeholder={lang === 'zh' ? '最高租金' : 'Max price'}
            value={priceFilter}
            onChange={e => setPriceFilter(e.target.value)}
            min="0"
          />
          {priceFilter && (
            <button className="price-filter-clear" onClick={() => setPriceFilter('')}>×</button>
          )}
        </div>
      </div>

      <div className="listing-list-layout">
        <div className="listing-list-main">
          <div className="cards-grid">
            {filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                index={listings.indexOf(listing)}
                isSelected={selectedIds.includes(listing.id) && !closingIds.has(listing.id)}
                onSelect={handleSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onRecalculate={onRecalculate}
                tr={tr}
                distanceUnit={distanceUnit}
              />
            ))}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="detail-panels-column">
            {selectedIds.map(id => {
              const listing = listings.find(l => l.id === id);
              if (!listing) return null;
              return (
                <div
                  key={id}
                  className={`detail-panel-wrap${closingIds.has(id) ? ' detail-panel-wrap--closing' : ''}`}
                >
                  <DetailPanel
                    listing={listing}
                    index={listings.indexOf(listing)}
                    onClose={() => closePanel(id)}
                    tr={tr}
                    distanceUnit={distanceUnit}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
