import { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import InputPanel from './components/InputPanel.jsx';
import ListingList from './components/ListingList.jsx';
import MapView from './components/MapView.jsx';
import ManualAddForm from './components/ManualAddForm.jsx';
import { useT } from './i18n.js';
import { extractListings } from './services/anthropic.js';
import { geocodeAddress } from './services/geocoding.js';
import { getCommuteTimes } from './services/routing.js';
import { haversineDistance, estimateTransitTime } from './utils/distance.js';
import { fetchListings, saveListings, fetchSettings, saveSettings } from './services/googleSheets.js';

function generateId(existingListings) {
  const usedIds = new Set(existingListings.map(l => l.id));
  for (let i = 1; i <= 99; i++) {
    const id = `L${i}`;
    if (!usedIds.has(id)) return id;
  }
  return `L${Date.now()}`;
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('rh_lang') || 'zh');
  const [theme, setTheme] = useState(() => localStorage.getItem('rh_theme') || 'light');
  const [distanceUnit, setDistanceUnit] = useState(() => localStorage.getItem('rh_unit') || 'km');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('rh_apikey') || '');
  const [scriptUrl, setScriptUrl] = useState(() => localStorage.getItem('rh_script_url') || '');
  const [view, setView] = useState('list');
  const [listings, setListings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rh_listings') || '[]'); } catch { return []; }
  });
  const [origin, setOrigin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rh_origin') || 'null'); } catch { return null; }
  });
  const [originInput, setOriginInput] = useState(() => localStorage.getItem('rh_origin_input') || '');
  const [chatText, setChatText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // true after initial data load (GS or localStorage) — prevents saving before load finishes
  const gsReadyRef = useRef(false);

  const tr = useT(lang);

  const showNotif = useCallback((msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Device preferences → always localStorage
  useEffect(() => { localStorage.setItem('rh_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('rh_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('rh_unit', distanceUnit); }, [distanceUnit]);
  useEffect(() => { localStorage.setItem('rh_apikey', apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem('rh_script_url', scriptUrl); }, [scriptUrl]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // On mount: load from Google Sheets if configured.
  // If GS is empty but localStorage has data, keep local state (and let persistence effects upload it).
  useEffect(() => {
    if (!scriptUrl) {
      gsReadyRef.current = true;
      return;
    }
    Promise.all([fetchListings(scriptUrl), fetchSettings(scriptUrl)])
      .then(([lists, settings]) => {
        const localListings = (() => {
          try { return JSON.parse(localStorage.getItem('rh_listings') || '[]'); } catch { return []; }
        })();
        if (lists.length === 0 && localListings.length > 0) {
          // GS is empty but local has data — keep the localStorage-initialized state,
          // the persistence effects will upload it to GS once gsReadyRef is true.
        } else {
          setListings(lists);
          if ('origin' in settings) setOrigin(settings.origin);
          if ('originInput' in settings) setOriginInput(settings.originInput || '');
        }
      })
      .catch(() => {
        // Keep localStorage fallback data already in state
      })
      .finally(() => { gsReadyRef.current = true; });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist listings → GS (debounced) or localStorage
  useEffect(() => {
    if (!gsReadyRef.current) return;
    if (scriptUrl) {
      const timer = setTimeout(() => {
        saveListings(scriptUrl, listings).catch(console.error);
      }, 1500);
      return () => clearTimeout(timer);
    }
    localStorage.setItem('rh_listings', JSON.stringify(listings));
  }, [listings, scriptUrl]);

  // Persist origin + originInput → GS (debounced) or localStorage
  useEffect(() => {
    if (!gsReadyRef.current) return;
    if (scriptUrl) {
      const timer = setTimeout(() => {
        saveSettings(scriptUrl, { origin, originInput }).catch(console.error);
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (origin) localStorage.setItem('rh_origin', JSON.stringify(origin));
    localStorage.setItem('rh_origin_input', originInput);
  }, [origin, originInput, scriptUrl]);

  // Called when user sets a new script URL.
  // If GS is empty but localStorage has data, migrate local data to GS.
  const handleScriptUrlChange = useCallback(async (url) => {
    setScriptUrl(url);
    if (!url) return;
    gsReadyRef.current = false;
    try {
      const [gsList, gsSettings] = await Promise.all([fetchListings(url), fetchSettings(url)]);

      const localListings = (() => {
        try { return JSON.parse(localStorage.getItem('rh_listings') || '[]'); } catch { return []; }
      })();

      if (gsList.length === 0 && localListings.length > 0) {
        // GS is empty but we have local data — migrate it
        setListings(localListings);
        if (!('origin' in gsSettings)) {
          const localOrigin = (() => {
            try { return JSON.parse(localStorage.getItem('rh_origin') || 'null'); } catch { return null; }
          })();
          if (localOrigin) setOrigin(localOrigin);
          setOriginInput(localStorage.getItem('rh_origin_input') || '');
        }
        setNotification({ msg: lang === 'zh' ? '本地数据已迁移到 Google Sheets' : 'Local data migrated to Google Sheets', type: 'success' });
      } else {
        setListings(gsList);
        if ('origin' in gsSettings) setOrigin(gsSettings.origin);
        if ('originInput' in gsSettings) setOriginInput(gsSettings.originInput || '');
        setNotification({ msg: lang === 'zh' ? '已从 Google Sheets 加载数据' : 'Loaded from Google Sheets', type: 'success' });
      }
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      setNotification({ msg: (lang === 'zh' ? 'Google Sheets 加载失败: ' : 'Failed to load: ') + err.message, type: 'error' });
      setTimeout(() => setNotification(null), 3500);
    } finally {
      gsReadyRef.current = true;
    }
  }, [lang]);

  const handleGeocodeOrigin = useCallback(async (address) => {
    if (!address.trim()) return;
    try {
      const result = await geocodeAddress(address);
      setOrigin({ address, lat: result.lat, lng: result.lng });
      setOriginInput(address);
      showNotif(lang === 'zh' ? '原点定位成功' : 'Origin located');
      return result;
    } catch {
      showNotif(lang === 'zh' ? '原点地址未找到' : 'Origin address not found', 'error');
      return null;
    }
  }, [lang, showNotif]);

  const processListing = useCallback(async (listing, originData) => {
    const orig = originData || origin;
    let updated = { ...listing };

    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: 'geocoding' } : l));
    try {
      const geo = (listing.lat && listing.lng)
        ? { lat: listing.lat, lng: listing.lng }
        : await geocodeAddress(listing.address);
      updated = { ...updated, lat: geo.lat, lng: geo.lng, geocodeError: false, resolvedAddress: geo.displayName || null };

      if (orig) {
        const dist = haversineDistance(orig.lat, orig.lng, geo.lat, geo.lng);
        updated.distance = dist;

        setListings(prev => prev.map(l => l.id === listing.id ? { ...l, ...updated, status: 'routing' } : l));
        const times = await getCommuteTimes(orig.lat, orig.lng, geo.lat, geo.lng);

        const minWalkMin = Math.round(dist / 7 * 60);
        const walkTime = (times.walking != null && times.walking >= minWalkMin)
          ? times.walking
          : (dist > 0.2 ? Math.round(dist / 4.5 * 60) : times.walking);

        updated.commute = {
          walking: walkTime,
          driving: times.driving,
          transit: estimateTransitTime(dist),
        };
      }
      updated.status = 'done';
    } catch {
      updated.status = 'geocodeError';
      updated.geocodeError = true;
    }

    setListings(prev => prev.map(l => l.id === listing.id ? updated : l));
    return updated;
  }, [origin]);

  const handleExtract = useCallback(async () => {
    if (!apiKey.trim()) { setExtractError(tr('noApiKey')); return; }
    if (!chatText.trim()) { setExtractError(tr('noChatText')); return; }
    setExtractError('');
    setExtracting(true);

    let originData = origin;
    if (originInput.trim() && !origin) {
      originData = await handleGeocodeOrigin(originInput);
    }

    try {
      const raw = await extractListings(apiKey, chatText);
      const newListings = raw.map((l, i) => ({
        ...l,
        id: l.id || generateId([...listings, ...raw.slice(0, i)]),
        status: 'pending',
        lat: null, lng: null, distance: null,
        commute: { walking: null, transit: null, driving: null },
        geocodeError: false,
      }));

      setListings(prev => {
        const ids = new Set(prev.map(p => p.id));
        const deduped = newListings.map(l => ids.has(l.id) ? { ...l, id: l.id + '_' + Date.now() } : l);
        return [...prev, ...deduped];
      });

      showNotif(tr('extractSuccess', { n: newListings.length }));
      setChatText('');

      for (const listing of newListings) {
        processListing(listing, originData);
      }
    } catch (e) {
      setExtractError(tr('extractError') + ': ' + e.message);
    } finally {
      setExtracting(false);
    }
  }, [apiKey, chatText, listings, origin, originInput, tr, handleGeocodeOrigin, processListing, showNotif]);

  const handleSaveListing = useCallback((data) => {
    if (editingListing) {
      const addressChanged = data.address !== editingListing.address;
      const coordsChanged = (data.lat != null && data.lat !== editingListing.lat)
                         || (data.lng != null && data.lng !== editingListing.lng);

      const processData = (addressChanged && !data.lat)
        ? { ...data, lat: null, lng: null, resolvedAddress: null }
        : { ...data, resolvedAddress: null };

      setListings(prev => prev.map(l => l.id === editingListing.id ? { ...l, ...processData } : l));

      if (addressChanged || coordsChanged) {
        processListing({ ...editingListing, ...processData, status: 'pending' }, null);
      }
      setEditingListing(null);
    } else {
      const newListing = {
        ...data,
        id: generateId(listings),
        status: 'pending',
        lat: null, lng: null, distance: null,
        commute: { walking: null, transit: null, driving: null },
        geocodeError: false,
      };
      setListings(prev => [...prev, newListing]);
      processListing(newListing, null);
    }
    setShowManualForm(false);
  }, [editingListing, listings, processListing]);

  const handleDelete = useCallback((id) => {
    setListings(prev => prev.filter(l => l.id !== id));
  }, []);

  const handleEdit = useCallback((listing) => {
    setEditingListing(listing);
    setShowManualForm(true);
  }, []);

  const handleRecalculate = useCallback((listing) => {
    processListing({ ...listing, status: 'pending', lat: null, lng: null, resolvedAddress: null }, null);
  }, [processListing]);

  return (
    <div className="app">
      <Header
        lang={lang} theme={theme}
        view={view}
        apiKey={apiKey}
        scriptUrl={scriptUrl}
        distanceUnit={distanceUnit}
        onLangChange={l => setLang(l)}
        onThemeChange={t => setTheme(t)}
        onViewChange={v => setView(v)}
        onApiKeyChange={k => setApiKey(k)}
        onScriptUrlChange={handleScriptUrlChange}
        onUnitChange={u => setDistanceUnit(u)}
        tr={tr}
      />

      <div className="workspace">
        <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
          <div className="sidebar-inner">
            <InputPanel
              chatText={chatText}
              onChatTextChange={setChatText}
              originInput={originInput}
              onOriginInputChange={setOriginInput}
              origin={origin}
              onGeocodeOrigin={handleGeocodeOrigin}
              onExtract={handleExtract}
              onManualAdd={() => { setEditingListing(null); setShowManualForm(true); }}
              extracting={extracting}
              extractError={extractError}
              tr={tr}
            />
          </div>
        </aside>

        <button
          className="sidebar-toggle-tab"
          onClick={() => setSidebarOpen(v => !v)}
          title={sidebarOpen ? '收起面板' : '展开面板'}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <main className="content-area">
          {view === 'list' ? (
            <ListingList
              listings={listings}
              origin={origin}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRecalculate={handleRecalculate}
              tr={tr}
              lang={lang}
              distanceUnit={distanceUnit}
            />
          ) : (
            <MapView
              listings={listings}
              origin={origin}
              tr={tr}
              lang={lang}
            />
          )}
        </main>
      </div>

      {showManualForm && (
        <ManualAddForm
          initial={editingListing}
          apiKey={apiKey}
          origin={origin}
          knownAgents={[...new Set(listings.map(l => l.agent).filter(Boolean))]}
          onSave={handleSaveListing}
          onCancel={() => { setShowManualForm(false); setEditingListing(null); }}
          tr={tr}
        />
      )}

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}
