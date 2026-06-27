// OpenRouteService integration — used specifically for DELAY complaints
// to estimate ground-leg distance/time between origin and destination
// (e.g. airport-to-warehouse last mile) and flag unusually long routes
// as a contributing factor. This is a genuine, narrow use of the API,
// not a forced integration.

const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car';

export async function estimateRouteDelayFactor({ originLat, originLng, destLat, destLng }) {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey || apiKey.startsWith('replace_with')) {
    return { available: false, reason: 'OpenRouteService not configured' };
  }
  if ([originLat, originLng, destLat, destLng].some((v) => typeof v !== 'number')) {
    return { available: false, reason: 'Missing coordinates for route estimation' };
  }

  try {
    const url = `${ORS_BASE}?api_key=${apiKey}&start=${originLng},${originLat}&end=${destLng},${destLat}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { available: false, reason: `ORS responded ${res.status}` };
    }
    const data = await res.json();
    const summary = data.features?.[0]?.properties?.summary;
    if (!summary) return { available: false, reason: 'No route found' };

    const distanceKm = Math.round(summary.distance / 100) / 10;
    const durationMin = Math.round(summary.duration / 60);

    return {
      available: true,
      distanceKm,
      durationMin,
      flaggedLongRoute: durationMin > 120, // >2h ground leg is a plausible delay contributor
    };
  } catch (err) {
    return { available: false, reason: err.message };
  }
}
