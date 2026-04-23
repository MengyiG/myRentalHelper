const OSRM = 'https://router.project-osrm.org/route/v1';

async function fetchRoute(profile, fromLng, fromLat, toLng, toLat) {
  const url = `${OSRM}/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) return null;
  return Math.round(data.routes[0].duration / 60);
}

export async function getCommuteTimes(originLat, originLng, destLat, destLng) {
  const [walking, driving] = await Promise.allSettled([
    fetchRoute('foot', originLng, originLat, destLng, destLat),
    fetchRoute('driving', originLng, originLat, destLng, destLat),
  ]);
  return {
    walking: walking.status === 'fulfilled' ? walking.value : null,
    driving: driving.status === 'fulfilled' ? driving.value : null,
  };
}
