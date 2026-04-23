import { useState } from 'react';
import ListingCard from './ListingCard.jsx';

export default function ListingList({ listings, origin, onEdit, onDelete, onRecalculate, tr, lang, distanceUnit }) {
  const [agentFilter, setAgentFilter] = useState('');

  const agents = [...new Set(listings.map(l => l.agent).filter(Boolean))].sort();
  const filtered = agentFilter ? listings.filter(l => l.agent === agentFilter) : listings;

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
      <div className="list-header">
        <h2 className="list-title">{tr('listingsTitle')}</h2>
        <span className="list-count">{filtered.length}{agentFilter ? `/${listings.length}` : ''}</span>
      </div>

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

      <div className="cards-grid">
        {filtered.map((listing, i) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            index={listings.indexOf(listing)}
            onEdit={onEdit}
            onDelete={onDelete}
            onRecalculate={onRecalculate}
            tr={tr}
            distanceUnit={distanceUnit}
          />
        ))}
      </div>
    </div>
  );
}
