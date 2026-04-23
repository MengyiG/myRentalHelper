import { useState } from 'react';

export default function InputPanel({
  chatText, onChatTextChange,
  originInput, onOriginInputChange,
  origin, onGeocodeOrigin,
  onExtract, onManualAdd,
  extracting, extractError, tr
}) {
  const [locating, setLocating] = useState(false);

  const handleGeocodeClick = async () => {
    if (!originInput.trim()) return;
    setLocating(true);
    await onGeocodeOrigin(originInput);
    setLocating(false);
  };

  return (
    <div className="input-panel-sidebar">
      <div className="sidebar-section-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {tr('chatInputLabel')}
      </div>

      <textarea
        className="chat-textarea"
        value={chatText}
        onChange={e => onChatTextChange(e.target.value)}
        placeholder={tr('chatInputPlaceholder')}
        rows={10}
      />

      <div className="sidebar-section-title" style={{ marginTop: 12 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {tr('originLabel')}
      </div>

      <div className="origin-input-row">
        <input
          type="text"
          className={`text-input ${origin ? 'has-value' : ''}`}
          value={originInput}
          onChange={e => onOriginInputChange(e.target.value)}
          placeholder={tr('originPlaceholder')}
          onKeyDown={e => e.key === 'Enter' && handleGeocodeClick()}
        />
        <button
          className="btn-secondary small"
          onClick={handleGeocodeClick}
          disabled={locating || !originInput.trim()}
          title={tr('geocodeOriginBtn')}
        >
          {locating ? (
            <span className="spinner-sm dark" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          )}
        </button>
      </div>

      {origin && (
        <p className="origin-confirmed">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ color: 'var(--pros-color)', flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {origin.address}
        </p>
      )}

      <div className="sidebar-actions">
        <button className="btn-primary full-width" onClick={onExtract} disabled={extracting}>
          {extracting ? (
            <><span className="spinner" />{tr('extracting')}</>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10"/><path d="M22 2 11 13"/><path d="M15 2h7v7"/>
              </svg>
              {tr('extractBtn')}
            </>
          )}
        </button>

        <button className="btn-secondary full-width" onClick={onManualAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {tr('manualAddBtn')}
        </button>
      </div>

      {extractError && <div className="error-msg">{extractError}</div>}
    </div>
  );
}
