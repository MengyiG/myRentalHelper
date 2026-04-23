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

