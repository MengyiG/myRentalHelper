const COLS = [
  'id','agent','address','type','price','priceDiscounted','includesUtilities',
  'amenities','pros','cons','moveInDate','description','lat','lng',
  'resolvedAddress','distance','commute_walking','commute_transit','commute_driving',
  'status','geocodeError',
];

function listingToRow(l) {
  return COLS.map(h => {
    if (['amenities','pros','cons'].includes(h))
      return JSON.stringify(Array.isArray(l[h]) ? l[h] : []);
    if (h === 'commute_walking') return l.commute?.walking ?? '';
    if (h === 'commute_transit') return l.commute?.transit ?? '';
    if (h === 'commute_driving') return l.commute?.driving ?? '';
    const v = l[h];
    return v == null ? '' : String(v);
  });
}

function rowToListing(obj) {
  const l = {};
  COLS.forEach(h => { l[h] = obj[h] ?? ''; });
  ['amenities','pros','cons'].forEach(k => {
    try { l[k] = JSON.parse(l[k]); } catch { l[k] = []; }
  });
  l.commute = {
    walking: l.commute_walking !== '' ? Number(l.commute_walking) : null,
    transit: l.commute_transit !== '' ? Number(l.commute_transit) : null,
    driving: l.commute_driving !== '' ? Number(l.commute_driving) : null,
  };
  delete l.commute_walking;
  delete l.commute_transit;
  delete l.commute_driving;
  ['price','priceDiscounted','lat','lng','distance'].forEach(k => {
    l[k] = l[k] !== '' && l[k] != null ? Number(l[k]) : null;
  });
  l.includesUtilities = l.includesUtilities === 'true' || l.includesUtilities === true;
  l.geocodeError = l.geocodeError === 'true' || l.geocodeError === true;
  return l;
}

async function apiFetch(scriptUrl, params) {
  const url = new URL(scriptUrl);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(scriptUrl, data) {
  const res = await fetch(scriptUrl, {
    method: 'POST',
    body: new URLSearchParams({ data: JSON.stringify(data) }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function fetchListings(scriptUrl) {
  const data = await apiFetch(scriptUrl, { action: 'getListings' });
  if (!Array.isArray(data)) return [];
  return data.map(rowToListing);
}

export async function saveListings(scriptUrl, listings) {
  await apiPost(scriptUrl, {
    action: 'saveListings',
    headers: COLS,
    rows: listings.map(listingToRow),
  });
}

export async function fetchSettings(scriptUrl) {
  return apiFetch(scriptUrl, { action: 'getSettings' });
}

export async function saveSettings(scriptUrl, settings) {
  await apiPost(scriptUrl, { action: 'saveSettings', settings });
}
