export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Estimate transit time based on distance (urban assumption)
export function estimateTransitTime(distanceKm) {
  if (!distanceKm || distanceKm < 0) return null;
  if (distanceKm < 0.5) return 5;
  if (distanceKm < 1.5) return 12;
  if (distanceKm < 4) return Math.round(15 + (distanceKm - 1.5) * 4);
  if (distanceKm < 12) return Math.round(25 + (distanceKm - 4) * 2.5);
  return Math.round(45 + (distanceKm - 12) * 2);
}

// Generate a deterministic color from index
export const MARKER_COLORS = [
  '#4D6FA5', '#2E5FA3', '#7B9FD4', '#385490',
  '#5B7FBD', '#3A5A8A', '#6C8EC8', '#2D4E80',
  '#8AAACE', '#1E3A6E'
];

export function markerColor(index) {
  return MARKER_COLORS[index % MARKER_COLORS.length];
}

export function agentColor(agentName) {
  if (!agentName) return MARKER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < agentName.length; i++) {
    hash = (hash * 31 + agentName.charCodeAt(i)) >>> 0;
  }
  return MARKER_COLORS[hash % MARKER_COLORS.length];
}
