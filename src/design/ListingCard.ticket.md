# Ticket-style ListingCard — Handoff

Goal: redesign `src/components/ListingCard.jsx` to the **Ticket** variant — a torn-stub metaphor where the colored agent header reads like a ticket stub, separated from the white content body by a dashed perforation with tiny round cutouts on the sides.

## Visual spec

```
┌──────────────────────────┐
│ LISTING        № L01     │ ← colored stub (agent color)
│ $2,100 /mo               │    - uppercase micro labels
│ Wang Ming                │    - big price
○──── - - - - - - - - ────○ ← perforation + cutout circles
│ 123 Beacon St, Boston    │ ← white body
│ TYPE Studio  MOVE-IN …   │    - KV pairs (uppercase label + value)
│ DIST 1.2km  ✓ Utils      │
│ ─────────────────────    │
│ 🚶       🚌       🚗      │ ← 3-column commute block
│ 15m      8m       6m     │    - bold value, tiny uppercase label
│ WALK    TRANSIT  DRIVE   │
└──────────────────────────┘
```

Key moves vs the current hero-heavy card:
1. Stub has tiny semi-circle **cutouts** on both sides (`::before` + `::after` circles colored to match the page bg `#EEF2F8`) — sell the "torn ticket" effect
2. **Dashed perforation** uses `radial-gradient` dots, not a border
3. Commute pills become a **3-column block** with labels under the values (Walk / Transit / Drive)
4. Metadata becomes **KV pairs** with tiny uppercase grey labels

## Integration notes for the existing code

Your `ListingCard.jsx` already has the right data shape (agent, address, price/priceMax, type, includesUtilities, moveInDate, distance, commute, status, geocodeError, id). **Keep** the existing:
- `agentColor(agent)` for the stub background
- `formatPrice`, `formatDist`, `displayDate`, `safeWalk` logic
- `statusIcons`, `isProcessing`, `geocodeError` handling
- Click → `onSelect`, action buttons → `onEdit`/`onDelete`/`onRecalculate`
- `listing-card--selected` class for selected state
- All `tr(...)` translations and the `lang`/`distanceUnit` props

**Replace** the JSX structure and the card CSS classes (`.card-hero`, `.card-content`, `.commute-pills`, etc.) with the ones below. The new classes are all prefixed `lc-*` so they won't collide with anything else in `App.css`.

The page background in the listings grid is `#EEF2F8` in this mock — if your app uses a different color, change the two cutout-circle `background` values in `.lc-stub::before/::after` to match. Otherwise you'll see grey half-moons instead of clean bites.

## JSX (drop-in replacement for the `<article>` body)

```jsx
<article
  className={`listing-card lc-card${isSelected ? ' listing-card--selected' : ''}`}
  onClick={() => onSelect(listing)}
>
  {/* Stub (ticket header) */}
  <div
    className="lc-stub"
    style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` }}
  >
    <div className="lc-stub-top">
      <span>{tr('listing') /* or hardcode "LISTING" */}</span>
      <span>№ L{idNum}</span>
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
        {!isProcessing && (
          <button className="lc-btn" onClick={() => onRecalculate(listing)} title={lang === 'zh' ? '重新定位' : 'Re-geocode'}>↻</button>
        )}
        <button className="lc-btn" onClick={() => onEdit(listing)} title={tr('edit')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="lc-btn lc-btn--danger" onClick={handleDelete} title={tr('delete')}>
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
          <span className="lc-kv-label">{tr('type') || 'TYPE'}</span>
          <span className="lc-kv-value">{type}</span>
        </span>
      )}
      {displayDate && (
        <span className="lc-kv">
          <span className="lc-kv-label">{tr('moveIn') || 'MOVE-IN'}</span>
          <span className="lc-kv-value">{displayDate}</span>
        </span>
      )}
      {!isProcessing && !geocodeError && distance != null && (
        <span className="lc-kv">
          <span className="lc-kv-label">{tr('distance') || 'DIST'}</span>
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
            <span className="lc-commute-val">{safeWalk}{tr('minShort') || 'm'}</span>
            <span className="lc-commute-label">{tr('walk') || 'WALK'}</span>
          </div>
        )}
        {commute?.transit != null && (
          <div className="lc-commute-cell">
            <span className="lc-commute-ic">🚌</span>
            <span className="lc-commute-val">{commute.transit}{tr('minShort') || 'm'}</span>
            <span className="lc-commute-label">{tr('transit') || 'TRANSIT'}</span>
          </div>
        )}
        {commute?.driving != null && (
          <div className="lc-commute-cell">
            <span className="lc-commute-ic">🚗</span>
            <span className="lc-commute-val">{commute.driving}{tr('minShort') || 'm'}</span>
            <span className="lc-commute-label">{tr('drive') || 'DRIVE'}</span>
          </div>
        )}
      </div>
    )}
  </div>
</article>
```

## CSS (paste into `App.css`)

See `ListingCard.ticket.css` in this folder. Remove or override your existing `.card-hero*`, `.card-content`, `.card-meta-row`, `.commute-pills`, `.commute-pill*`, `.card-address-title`, `.card-movein`, `.card-distance`, `.card-hero-watermark` rules — they're no longer used.

## Things to double-check

1. **Page background color** — the cutout circles in `.lc-stub::before/::after` use `background: #EEF2F8`. If the listings grid lives on a different colored surface, update those two values or you'll see grey half-moons. If the color is a CSS variable, use `var(--listings-bg)` or similar.
2. **Translation keys** — I reference `tr('listing')`, `tr('type')`, `tr('moveIn')`, `tr('distance')`, `tr('walk')`, `tr('transit')`, `tr('drive')`, `tr('minShort')`. Add them to your translation file, or replace the `tr(...) || 'FALLBACK'` calls with hardcoded strings if you don't want them translated (they're short uppercase labels; hardcoding is fine).
3. **Dark mode** — your existing `[data-theme="dark"] .listing-card` rule still applies because `.lc-card` coexists with `.listing-card`. You may want to add a `[data-theme="dark"] .lc-stub::before/::after` override so the cutouts blend with the dark surface.
4. **Selected state** — I kept the `listing-card--selected` hook, so your existing selected border/glow CSS still works. I moved the check icon from a separate top-bar into the actions row; if you prefer it stays top-right on its own, let me know.
