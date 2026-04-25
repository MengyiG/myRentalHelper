export default function NavRail({ view, onViewChange, listCount }) {
  return (
    <nav className="nav-rail">
      <button
        className={`nav-rail-item${view === 'list' ? ' active' : ''}`}
        onClick={() => onViewChange('list')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2"/>
          <path d="M9 2v4h6V2"/>
          <line x1="9" y1="11" x2="15" y2="11"/>
          <line x1="9" y1="15" x2="13" y2="15"/>
        </svg>
        <span className="nav-rail-label">LIST</span>
        {listCount > 0 && <span className="nav-rail-count">{listCount}</span>}
      </button>

      <button
        className={`nav-rail-item${view === 'map' ? ' active' : ''}`}
        onClick={() => onViewChange('map')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
          <line x1="8" y1="2" x2="8" y2="18"/>
          <line x1="16" y1="6" x2="16" y2="22"/>
        </svg>
        <span className="nav-rail-label">MAP</span>
      </button>

      <button
        className={`nav-rail-item${view === 'sheets' ? ' active' : ''}`}
        onClick={() => onViewChange('sheets')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="9" x2="9" y2="21"/>
        </svg>
        <span className="nav-rail-label">SHEETS</span>
      </button>
    </nav>
  );
}
