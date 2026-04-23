import { useState, useRef, useEffect, useCallback } from 'react';
import { parseClipboardListing } from '../services/anthropic.js';
import { searchAddress } from '../services/geocoding.js';
import { haversineDistance } from '../utils/distance.js';

function parseList(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

function toFormState(data) {
  data = data || {};
  return {
    agent: data.agent || '',
    address: data.address || '',
    _lat: data.lat || null,
    _lng: data.lng || null,
    type: data.type || '',
    price: data.price ?? '',
    priceDiscounted: data.priceDiscounted ?? '',
    includesUtilities: data.includesUtilities || false,
    amenities: Array.isArray(data.amenities) ? data.amenities.join(', ') : (data.amenities || ''),
    pros: Array.isArray(data.pros) ? data.pros.join(', ') : (data.pros || ''),
    cons: Array.isArray(data.cons) ? data.cons.join(', ') : (data.cons || ''),
    moveInDate: data.moveInDate || '',
    description: data.description || '',
  };
}

export default function ManualAddForm({ initial, apiKey, origin, knownAgents = [], onSave, onCancel, tr }) {
  const [form, setForm] = useState(toFormState(initial));
  const [clipState, setClipState] = useState('idle');
  const [clipError, setClipError] = useState('');
  const [clipPreview, setClipPreview] = useState('');

  // Address autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);
  const addressWrapperRef = useRef(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (query) => {
    if (query.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    setSearching(true);
    try {
      let results = await searchAddress(query);
      // Attach distance from origin and sort closest first
      if (origin && results.length > 1) {
        results = results
          .map(r => ({ ...r, distance: haversineDistance(origin.lat, origin.lng, r.lat, r.lng) }))
          .sort((a, b) => a.distance - b.distance);
      }
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setActiveSuggestion(-1);
    } finally {
      setSearching(false);
    }
  }, [origin]);

  const handleAddressChange = (e) => {
    const val = e.target.value;
    set('address', val);
    set('_lat', null);
    set('_lng', null);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 500);
  };

  const selectSuggestion = (s) => {
    setForm(f => ({ ...f, address: s.shortLabel, _lat: s.lat, _lng: s.lng }));
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };

  const handleAddressKeyDown = (e) => {
    if (!showSuggestions || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Clipboard
  const handleClipboard = async () => {
    setClipError('');
    setClipState('reading');
    let text = '';
    try {
      text = await navigator.clipboard.readText();
      if (!text.trim()) throw new Error(tr('clipEmpty'));
    } catch (e) {
      setClipError(tr('clipReadError') + e.message);
      setClipState('error');
      return;
    }
    if (!apiKey) {
      setClipPreview(text);
      setClipState('idle');
      return;
    }
    setClipState('parsing');
    try {
      const parsed = await parseClipboardListing(apiKey, text);
      setForm(prev => ({
        agent: prev.agent || parsed.agent || '',
        address: prev.address || parsed.address || '',
        _lat: prev._lat, _lng: prev._lng,
        type: prev.type || parsed.type || '',
        price: prev.price !== '' ? prev.price : (parsed.price ?? ''),
        priceDiscounted: prev.priceDiscounted !== '' ? prev.priceDiscounted : (parsed.priceDiscounted ?? ''),
        includesUtilities: prev.includesUtilities || parsed.includesUtilities || false,
        amenities: prev.amenities || (parsed.amenities?.join(', ') ?? ''),
        pros: prev.pros || (parsed.pros?.join(', ') ?? ''),
        cons: prev.cons || (parsed.cons?.join(', ') ?? ''),
        moveInDate: prev.moveInDate || parsed.moveInDate || '',
        description: prev.description || parsed.description || '',
      }));
      setClipState('idle');
    } catch (e) {
      setClipError(tr('clipParseError') + e.message);
      setClipState('error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.address.trim()) return;
    onSave({
      agent: form.agent.trim(),
      address: form.address.trim(),
      lat: form._lat || null,
      lng: form._lng || null,
      type: form.type.trim(),
      price: form.price !== '' ? Number(form.price) : null,
      priceDiscounted: form.priceDiscounted !== '' ? Number(form.priceDiscounted) : null,
      includesUtilities: form.includesUtilities,
      amenities: parseList(form.amenities),
      pros: parseList(form.pros),
      cons: parseList(form.cons),
      moveInDate: form.moveInDate.trim(),
      description: form.description.trim(),
    });
  };

  const isLoading = clipState === 'reading' || clipState === 'parsing';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">{initial ? tr('editFormTitle') : tr('manualFormTitle')}</h2>
          <button className="icon-btn" onClick={onCancel}>✕</button>
        </div>

        {/* Clipboard bar */}
        <div className="clipboard-bar">
          <button
            type="button"
            className={`btn-clipboard ${isLoading ? 'loading' : ''}`}
            onClick={handleClipboard}
            disabled={isLoading}
          >
            {isLoading
              ? <span className="spinner-sm" />
              : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
              )
            }
            <span>
              {clipState === 'reading' ? tr('clipReading')
                : clipState === 'parsing' ? tr('clipParsing')
                : apiKey ? tr('clipReadAndParse')
                : tr('clipRead')}
            </span>
          </button>
          {!apiKey && <span className="clip-hint">{tr('clipNoKeyHint')}</span>}
          {clipError && <span className="clip-error">{clipError}</span>}
        </div>

        {clipPreview && !apiKey && (
          <div className="clip-reference">
            <div className="clip-reference-label">
              {tr('clipPreviewLabel')}
              <button type="button" className="clip-clear" onClick={() => setClipPreview('')}>✕</button>
            </div>
            <pre className="clip-reference-text">{clipPreview}</pre>
          </div>
        )}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label>{tr('formAgent')}</label>
              <input
                type="text"
                list="agent-suggestions"
                value={form.agent}
                onChange={e => set('agent', e.target.value)}
                placeholder="e.g. John"
              />
              {knownAgents.length > 0 && (
                <datalist id="agent-suggestions">
                  {knownAgents.map(name => <option key={name} value={name} />)}
                </datalist>
              )}
            </div>

            {/* Address with autocomplete */}
            <div className="form-field full-width" ref={addressWrapperRef} style={{ position: 'relative' }}>
              <label>
                {tr('formAddress')} <span className="required">*</span>
                {form._lat && (
                  <span className="address-confirmed">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {tr('addressConfirmed')}
                  </span>
                )}
              </label>
              <div className="address-input-row">
                <input
                  type="text"
                  value={form.address}
                  onChange={handleAddressChange}
                  onKeyDown={handleAddressKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="e.g. 123 Main St, Chicago, IL"
                  required
                  autoComplete="off"
                />
                {searching && <span className="address-searching">
                  <span className="spinner-sm dark" />
                </span>}
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className={`suggestion-item ${i === activeSuggestion ? 'active' : ''}`}
                      onMouseDown={e => { e.preventDefault(); selectSuggestion(s); }}
                      onMouseEnter={() => setActiveSuggestion(i)}
                    >
                      <div className="suggestion-main">{s.shortLabel}</div>
                      <div className="suggestion-meta">
                        {[s.state, s.country].filter(Boolean).join(' · ')}
                        {s.distance != null && (
                          <span className="suggestion-dist">
                            {s.distance < 1
                              ? `${Math.round(s.distance * 1000)} m`
                              : `${s.distance.toFixed(1)} km`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-field">
              <label>{tr('formType')}</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="">—</option>
                <option value="Studio">Studio</option>
                <option value="1B1B">1B1B</option>
                <option value="1B2B">1B2B</option>
                <option value="2B1B">2B1B</option>
                <option value="2B2B">2B2B</option>
                <option value="3B2B">3B2B</option>
                <option value="3B3B">3B3B</option>
              </select>
            </div>

            <div className="form-field">
              <label>{tr('formPrice')}</label>
              <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="2000" />
            </div>

            <div className="form-field">
              <label>{tr('formPriceDiscounted')}</label>
              <input type="number" min="0" value={form.priceDiscounted} onChange={e => set('priceDiscounted', e.target.value)} placeholder="1800" />
            </div>

            <div className="form-field checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.includesUtilities}
                  onChange={e => set('includesUtilities', e.target.checked)}
                />
                {tr('formIncludesUtilities')}
              </label>
            </div>

            <div className="form-field">
              <label>{tr('formMoveIn')}</label>
              <input type="text" value={form.moveInDate} onChange={e => set('moveInDate', e.target.value)} placeholder="2024-06-01 / ASAP" />
            </div>

            <div className="form-field full-width">
              <label>{tr('formAmenities')}</label>
              <input
                type="text" value={form.amenities}
                onChange={e => set('amenities', e.target.value)}
                placeholder="In-unit W/D, Gym, Doorman, Parking"
              />
            </div>

            <div className="form-field">
              <label>{tr('formPros')}</label>
              <textarea value={form.pros} onChange={e => set('pros', e.target.value)} rows={3} placeholder="Near transit, Renovated kitchen" />
            </div>

            <div className="form-field">
              <label>{tr('formCons')}</label>
              <textarea value={form.cons} onChange={e => set('cons', e.target.value)} rows={3} placeholder="No parking, Noisy street" />
            </div>

            <div className="form-field full-width">
              <label>{tr('formDescription')}</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description..." />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>{tr('formCancel')}</button>
            <button type="submit" className="btn-primary">{tr('formSave')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
