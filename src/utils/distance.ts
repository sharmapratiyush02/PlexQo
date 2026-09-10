// src/utils/distance.ts
// Haversine formula — calculates great-circle distance between two GPS coords

const EARTH_RADIUS_M = 6371000; // metres

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Returns the distance in metres between two GPS coordinates.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}
