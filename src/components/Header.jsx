import { useState } from 'react';

export default function Header({ lang, theme, view, apiKey, scriptUrl, distanceUnit, onLangChange, onThemeChange, onViewChange, onApiKeyChange, onScriptUrlChange, onUnitChange, tr }) {
  const [showApiInput, setShowApiInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState(apiKey);
  const [showGsInput, setShowGsInput] = useState(false);
  const [gsDraft, setGsDraft] = useState(scriptUrl);

  const handleSaveKey = () => {
    onApiKeyChange(keyDraft.trim());
    setShowApiInput(false);
  };

  const handleSaveGs = () => {
    onScriptUrlChange(gsDraft.trim());
    setShowGsInput(false);
  };

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-logo">🏡</span>
        <div>
          <h1 className="header-title">{tr('appTitle')}</h1>
          <p className="header-subtitle">{tr('appSubtitle')}</p>
        </div>
      </div>

      <div className="header-right">
        {/* View toggle */}
        <div className="toggle-group">
          <button
            className={`toggle-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => onViewChange('list')}
            title={tr('viewList')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>{tr('viewList')}</span>
          </button>
          <button
            className={`toggle-btn ${view === 'map' ? 'active' : ''}`}
            onClick={() => onViewChange('map')}
            title={tr('viewMap')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            <span>{tr('viewMap')}</span>
          </button>
        </div>

        {/* Theme toggle */}
        <button
          className="icon-btn"
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          title={theme === 'light' ? tr('themeDark') : tr('themeLight')}
        >
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        {/* Distance unit toggle */}
        <div className="toggle-group">
          <button
            className={`toggle-btn ${distanceUnit === 'km' ? 'active' : ''}`}
            onClick={() => onUnitChange('km')}
          >km</button>
          <button
            className={`toggle-btn ${distanceUnit === 'mi' ? 'active' : ''}`}
            onClick={() => onUnitChange('mi')}
          >mi</button>
        </div>

        {/* Language toggle */}
        <button
          className="icon-btn lang-btn"
          onClick={() => onLangChange(lang === 'zh' ? 'en' : 'zh')}
        >
          {tr('langToggle')}
        </button>

        {/* Google Sheets sync */}
        <div className="api-key-wrapper">
          <button
            className={`icon-btn api-key-btn ${scriptUrl ? 'has-key' : 'no-key'}`}
            onClick={() => { setGsDraft(scriptUrl); setShowGsInput(v => !v); setShowApiInput(false); }}
            title={tr('gsUrlLabel')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="9" x2="9" y2="21"/>
            </svg>
            <span className="api-key-dot" />
          </button>

          {showGsInput && (
            <div className="api-key-dropdown" style={{ minWidth: '340px' }}>
              <label className="api-label">{tr('gsUrlLabel')}</label>
              <div className="api-input-row">
                <input
                  type="text"
                  className="api-input"
                  value={gsDraft}
                  onChange={e => setGsDraft(e.target.value)}
                  placeholder={tr('gsUrlPlaceholder')}
                  onKeyDown={e => e.key === 'Enter' && handleSaveGs()}
                  autoFocus
                />
                <button className="btn-primary small" onClick={handleSaveGs}>{tr('gsUrlSave')}</button>
              </div>
              <p className="api-hint">{tr('gsUrlHint')}</p>
            </div>
          )}
        </div>

        {/* API Key */}
        <div className="api-key-wrapper">
          <button
            className={`icon-btn api-key-btn ${apiKey ? 'has-key' : 'no-key'}`}
            onClick={() => { setKeyDraft(apiKey); setShowApiInput(v => !v); setShowGsInput(false); }}
            title={tr('apiKeyLabel')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
            <span className="api-key-dot" />
          </button>

          {showApiInput && (
            <div className="api-key-dropdown">
              <label className="api-label">{tr('apiKeyLabel')}</label>
              <div className="api-input-row">
                <input
                  type="password"
                  className="api-input"
                  value={keyDraft}
                  onChange={e => setKeyDraft(e.target.value)}
                  placeholder={tr('apiKeyPlaceholder')}
                  onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                  autoFocus
                />
                <button className="btn-primary small" onClick={handleSaveKey}>{tr('apiKeySave')}</button>
              </div>
              <p className="api-hint">{tr('apiKeyHint')}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
