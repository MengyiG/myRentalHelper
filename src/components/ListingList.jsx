import ListingCard from './ListingCard.jsx';

export default function ListingList({ listings, origin, onEdit, onDelete, onRecalculate, tr, lang, distanceUnit }) {
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
        <span className="list-count">{listings.length}</span>
      </div>
      <div className="cards-grid">
        {listings.map((listing, i) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            index={i}
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
