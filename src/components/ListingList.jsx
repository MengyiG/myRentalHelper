import { useState, useRef, useEffect } from 'react';
import ListingCard from './ListingCard.jsx';
import DetailPanel from './DetailPanel.jsx';

const ANIM_MS = 220;

export default function ListingList({ listings, origin, onEdit, onDelete, onRecalculate, onArchive, tr, lang, distanceUnit }) {
  const [agentFilter, setAgentFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [closingIds, setClosingIds] = useState(new Set());
  const [priceFilter, setPriceFilter] = useState('');
  const [sortOrder, setSortOrder] = useState(''); // '' | 'asc' | 'desc'
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeTimers = useRef({});
  const shareMenuRef = useRef(null);

  const activeListings = listings.filter(l => !l.archived);
  const archivedListings = listings.filter(l => l.archived);

  const agents = [...new Set(activeListings.map(l => l.agent).filter(Boolean))].sort();

  const agentFiltered = agentFilter ? activeListings.filter(l => l.agent === agentFilter) : activeListings;

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

  const handleSelectAll = () => {
    Object.values(closeTimers.current).forEach(clearTimeout);
    closeTimers.current = {};
    setClosingIds(new Set());
    setSelectedIds(filtered.map(l => l.id));
  };

  const handleUnselectAll = () => {
    Object.values(closeTimers.current).forEach(clearTimeout);
    closeTimers.current = {};
    setSelectedIds([]);
    setClosingIds(new Set());
  };

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

  useEffect(() => {
    if (!showShareMenu) return;
    const handler = (e) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showShareMenu]);

  const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  const getSelectedListings = () =>
    selectedIds.map(id => listings.find(l => l.id === id)).filter(Boolean);

  const formatListingsAsText = (selected) => {
    const header = lang === 'zh' ? '=== 我的租房比较 ===' : '=== My Rental Comparison ===';
    const footer = lang === 'zh'
      ? `共 ${selected.length} 个房源`
      : `Total: ${selected.length} listing${selected.length !== 1 ? 's' : ''}`;

    const items = selected.map((l, i) => {
      const distStr = l.distance != null
        ? (distanceUnit === 'mi' ? `${(l.distance * 0.621371).toFixed(1)} mi` : `${l.distance.toFixed(1)} km`)
        : null;
      const safeWalk = (() => {
        const w = l.commute?.walking;
        if (w == null || !l.distance) return w;
        return w >= Math.round(l.distance / 7 * 60) ? w : Math.round(l.distance / 4.5 * 60);
      })();

      const lines = [`${i + 1}. [${l.id}] ${l.address || '—'}`];
      if (l.agent) lines.push(`   ${lang === 'zh' ? '中介' : 'Agent'}: ${l.agent}`);
      if (l.price != null) {
        let p = `$${Number(l.price).toLocaleString()}`;
        if (l.priceMax != null && l.priceMax !== l.price) p += ` – $${Number(l.priceMax).toLocaleString()}`;
        p += `/${lang === 'zh' ? '月' : 'mo'}`;
        if (l.includesUtilities) p += ` (${lang === 'zh' ? '含水电' : 'utils incl.'})`;
        lines.push(`   ${lang === 'zh' ? '租金' : 'Price'}: ${p}`);
      }
      if (l.type) lines.push(`   ${lang === 'zh' ? '类型' : 'Type'}: ${l.type}`);
      if (distStr) lines.push(`   ${lang === 'zh' ? '距离' : 'Distance'}: ${distStr}`);
      const commuteParts = [];
      if (safeWalk != null) commuteParts.push(`🚶 ${safeWalk} min`);
      if (l.commute?.transit != null) commuteParts.push(`🚌 ~${l.commute.transit} min`);
      if (l.commute?.driving != null) commuteParts.push(`🚗 ${l.commute.driving} min`);
      if (commuteParts.length) lines.push(`   ${lang === 'zh' ? '通勤' : 'Commute'}: ${commuteParts.join(' | ')}`);
      if (l.amenities?.length) lines.push(`   ${lang === 'zh' ? '设施' : 'Amenities'}: ${l.amenities.join(', ')}`);
      if (l.pros?.length) lines.push(`   ✓ ${lang === 'zh' ? '优点' : 'Pros'}: ${l.pros.join(', ')}`);
      if (l.cons?.length) lines.push(`   ✗ ${lang === 'zh' ? '缺点' : 'Cons'}: ${l.cons.join(', ')}`);
      if (l.moveInDate) {
        const d = l.moveInDate.includes('T') ? l.moveInDate.split('T')[0] : l.moveInDate;
        lines.push(`   ${lang === 'zh' ? '入住日期' : 'Move-in'}: ${d}`);
      }
      if (l.description) lines.push(`   ${lang === 'zh' ? '备注' : 'Notes'}: ${l.description}`);
      return lines.join('\n');
    });

    return [header, '', ...items, '', footer].join('\n');
  };

  const buildPrintHTML = (selected) => {
    const formatDist = (d) => {
      if (d == null) return null;
      return distanceUnit === 'mi' ? `${(d * 0.621371).toFixed(1)} mi` : `${d.toFixed(1)} km`;
    };

    const listingsHTML = selected.map((l, i) => {
      const safeWalk = (() => {
        const w = l.commute?.walking;
        if (w == null || !l.distance) return w;
        return w >= Math.round(l.distance / 7 * 60) ? w : Math.round(l.distance / 4.5 * 60);
      })();
      const displayDate = l.moveInDate
        ? (l.moveInDate.includes('T') ? l.moveInDate.split('T')[0] : l.moveInDate)
        : null;
      const priceStr = l.price != null
        ? (l.priceMax != null && l.priceMax !== l.price
            ? `$${Number(l.price).toLocaleString()} – $${Number(l.priceMax).toLocaleString()}/mo`
            : `$${Number(l.price).toLocaleString()}/mo`)
        : null;

      return `<div class="listing">
        <div class="listing-header">
          <span class="listing-id">${escapeHtml(l.id || String(i + 1))}</span>
          ${l.agent ? `<span class="listing-agent">${escapeHtml(l.agent)}</span>` : ''}
        </div>
        <div class="listing-address">${escapeHtml(l.address || '—')}</div>
        <div class="listing-meta">
          ${priceStr ? `<span class="meta-price">${escapeHtml(priceStr)}${l.includesUtilities ? ' · utils incl.' : ''}</span>` : ''}
          ${l.type ? `<span class="meta-item">${escapeHtml(l.type)}</span>` : ''}
          ${displayDate ? `<span class="meta-item">Available: ${escapeHtml(displayDate)}</span>` : ''}
          ${l.distance != null ? `<span class="meta-item">${escapeHtml(formatDist(l.distance))} from origin</span>` : ''}
        </div>
        ${(safeWalk != null || l.commute?.transit != null || l.commute?.driving != null) ? `<div class="commute-row">
          ${safeWalk != null ? `<span class="commute-item">🚶 ${safeWalk} min</span>` : ''}
          ${l.commute?.transit != null ? `<span class="commute-item">🚌 ~${l.commute.transit} min</span>` : ''}
          ${l.commute?.driving != null ? `<span class="commute-item">🚗 ${l.commute.driving} min</span>` : ''}
        </div>` : ''}
        ${l.amenities?.length ? `<div class="amenities">${l.amenities.map(a => `<span class="tag">${escapeHtml(a)}</span>`).join('')}</div>` : ''}
        ${(l.pros?.length || l.cons?.length) ? `<div class="pros-cons">
          ${l.pros?.length ? `<div class="pros-col"><strong>✓ ${lang === 'zh' ? '优点' : 'Pros'}</strong><ul>${l.pros.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul></div>` : ''}
          ${l.cons?.length ? `<div class="cons-col"><strong>✗ ${lang === 'zh' ? '缺点' : 'Cons'}</strong><ul>${l.cons.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul></div>` : ''}
        </div>` : ''}
        ${l.description ? `<div class="description">${escapeHtml(l.description)}</div>` : ''}
      </div>`;
    }).join('');

    const title = lang === 'zh' ? '租房比较' : 'Rental Comparison';
    const subtitle = lang === 'zh'
      ? `${selected.length} 个房源 · ${new Date().toLocaleDateString('zh-CN')}`
      : `${selected.length} listing${selected.length !== 1 ? 's' : ''} · ${new Date().toLocaleDateString()}`;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:28px;color:#1a1a1a;background:#fff;max-width:860px;margin:0 auto}
      h1{font-size:22px;font-weight:700;margin-bottom:4px;color:#2c3e50}
      .subtitle{font-size:13px;color:#666;margin-bottom:20px}
      .listing{border:1px solid #e0e0e0;border-radius:10px;padding:16px 18px;margin-bottom:14px;page-break-inside:avoid}
      .listing-header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
      .listing-id{background:#4d6fa5;color:#fff;border-radius:5px;padding:2px 8px;font-size:12px;font-weight:700}
      .listing-agent{font-size:13px;font-weight:600;color:#4d6fa5}
      .listing-address{font-size:15px;font-weight:600;margin-bottom:8px}
      .listing-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
      .meta-item{background:#f4f4f4;border-radius:4px;padding:2px 8px;font-size:12px;color:#444}
      .meta-price{background:#e8f4e8;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600;color:#2a7a4a}
      .commute-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
      .commute-item{background:#f8f8f8;border:1px solid #eee;border-radius:4px;padding:2px 10px;font-size:12px}
      .amenities{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
      .tag{background:#eef0f8;border-radius:4px;padding:2px 8px;font-size:12px;color:#444}
      .pros-cons{display:flex;gap:16px;margin-top:6px}
      .pros-col,.cons-col{flex:1}
      .pros-col strong{color:#3a7c5c;font-size:12px;display:block;margin-bottom:4px}
      .cons-col strong{color:#b85c5c;font-size:12px;display:block;margin-bottom:4px}
      ul{padding-left:16px}
      li{font-size:12px;margin-bottom:2px;color:#333}
      .description{font-size:12px;color:#555;margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0;line-height:1.5}
      @media print{body{padding:12px}}
    </style></head><body>
      <h1>${title}</h1>
      <p class="subtitle">${subtitle}</p>
      ${listingsHTML}
    </body></html>`;
  };

  const handleCopyToClipboard = async () => {
    const text = formatListingsAsText(getSelectedListings());
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => { setCopied(false); setShowShareMenu(false); }, 1500);
  };

  const handleDownloadPDF = () => {
    const html = buildPrintHTML(getSelectedListings());
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
    setShowShareMenu(false);
  };

  if (activeListings.length === 0 && archivedListings.length === 0) {
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
          <span className="list-count">{filtered.length}{isFiltered ? `/${activeListings.length}` : ''}</span>
        </div>
        <div className="compare-header">
          <span className="compare-title">Select &amp; Compare</span>
          {selectedIds.length > 0 && (
            <span className="compare-count">{selectedIds.length}</span>
          )}
        </div>
      </div>

      <div className="agent-filter-bar">
        <div className="filter-bar-left">
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

        <div className="filter-bar-right">
          <button className="select-all-btn" onClick={handleSelectAll}>
            {lang === 'zh' ? '全选' : 'Select All'}
          </button>
          {selectedIds.length > 0 && (
            <div className="selection-actions">
              <div className="share-menu-wrap" ref={shareMenuRef}>
                <button className="share-btn" onClick={() => setShowShareMenu(v => !v)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  {lang === 'zh' ? '分享' : 'Share'}
                </button>
                {showShareMenu && (
                  <div className="share-dropdown">
                    <button className="share-option" onClick={handleCopyToClipboard}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      {copied
                        ? (lang === 'zh' ? '已复制!' : 'Copied!')
                        : (lang === 'zh' ? '复制到剪贴板' : 'Copy to Clipboard')}
                    </button>
                    <button className="share-option" onClick={handleDownloadPDF}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                      {lang === 'zh' ? '下载为 PDF' : 'Download as PDF'}
                    </button>
                  </div>
                )}
              </div>
              <button className="unselect-all-btn" onClick={handleUnselectAll}>
                {lang === 'zh' ? '取消全选' : 'Unselect All'}
              </button>
            </div>
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
                index={activeListings.indexOf(listing)}
                isSelected={selectedIds.includes(listing.id) && !closingIds.has(listing.id)}
                onSelect={handleSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onRecalculate={onRecalculate}
                onArchive={onArchive}
                tr={tr}
                lang={lang}
                distanceUnit={distanceUnit}
              />
            ))}
          </div>

          {archivedListings.length > 0 && (
            <div className="archive-section">
              <button
                className="archive-toggle"
                onClick={() => setArchiveOpen(v => !v)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8"/>
                  <rect x="1" y="3" width="22" height="5" rx="1"/>
                  <line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
                {tr('archiveSection')}
                <span className="archive-toggle-count">{archivedListings.length}</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={`archive-chevron${archiveOpen ? ' archive-chevron--open' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {archiveOpen && (
                <div className="cards-grid cards-grid--archived">
                  {archivedListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      index={-1}
                      isSelected={false}
                      onSelect={() => {}}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onRecalculate={onRecalculate}
                      onArchive={onArchive}
                      tr={tr}
                      lang={lang}
                      distanceUnit={distanceUnit}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="detail-panels-column">
          {selectedIds.length === 0 ? (
            <div className="detail-panels-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              <p>{lang === 'zh' ? '选择卡片查看详情或进行对比' : 'Select a card to view details or compare'}</p>
            </div>
          ) : selectedIds.map(id => {
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
      </div>
    </div>
  );
}
