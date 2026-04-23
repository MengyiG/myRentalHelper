const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

// Rate-limit: Nominatim allows 1 req/s
let lastGeocode = 0;
async function rateLimit() {
  const now = Date.now();
  const wait = 1100 - (now - lastGeocode);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastGeocode = Date.now();
}

function buildShortLabel(r) {
  const a = r.address || {};
  const primary = a.amenity || a.tourism || a.office || a.building || '';
  const road = a.road || a.pedestrian || a.footway || '';
  const num = a.house_number || '';
  const city = a.city || a.town || a.village || a.municipality || '';
  const postcode = a.postcode || '';
  const parts = [];
  if (primary) parts.push(primary);
  if (num && road) parts.push(`${num} ${road}`);
  else if (road) parts.push(road);
  if (city) parts.push(city);
  if (postcode) parts.push(postcode);
  return parts.length ? parts.join(', ') : r.display_name.split(',').slice(0, 3).join(',').trim();
}

export async function searchAddress(query) {
  if (!query || query.trim().length < 3) return [];
  const url = `${NOMINATIM}?q=${encodeURIComponent(query.trim())}&format=json&limit=6&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RentalHelper/1.0 (personal-local-tool)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(r => ({
      shortLabel: buildShortLabel(r),
      state: r.address?.state || r.address?.province || r.address?.region || '',
      country: r.address?.country || '',
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}

// Parse "123 Main St, City, ST 12345" into structured parts for better Nominatim accuracy
function parseAddressParts(address) {
  // Match: house_number + street, then optional city/state/zip
  const m = address.match(/^(\d+)\s+(.+?),\s*(.+?)(?:,\s*([A-Z]{2})\s*(\d{5})?)?$/);
  if (!m) return null;
  return {
    street: `${m[1]} ${m[2].trim()}`,
    city: m[3]?.trim() || '',
    state: m[4]?.trim() || '',
    postalcode: m[5]?.trim() || '',
  };
}

async function nominatimFetch(params) {
  await rateLimit();
  const qs = new URLSearchParams({ format: 'json', limit: '1', addressdetails: '1', ...params });
  const res = await fetch(`${NOMINATIM}?${qs}`, {
    headers: { 'User-Agent': 'RentalHelper/1.0 (personal-local-tool)' }
  });
  if (!res.ok) return [];
  return res.json();
}

export async function geocodeAddress(address) {
  let data = [];

  // Try structured query first (more accurate for street addresses)
  const parts = parseAddressParts(address);
  if (parts) {
    const params = { street: parts.street };
    if (parts.city) params.city = parts.city;
    if (parts.state) params.state = parts.state;
    if (parts.postalcode) params.postalcode = parts.postalcode;
    data = await nominatimFetch(params);
  }

  // Fallback: free-text query
  if (!data.length) {
    data = await nominatimFetch({ q: address });
  }

  if (!data.length) throw new Error('Address not found');
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}
