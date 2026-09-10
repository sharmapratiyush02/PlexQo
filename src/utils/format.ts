// src/utils/format.ts
// Formatting helpers for duration, distance and pace

/**
 * Formats milliseconds into mm:ss or h:mm:ss for longer runs.
 */
export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Formats metres into a readable distance string.
 * Below 1 km: shows metres (e.g. "234 m")
 * 1 km and above: shows kilometres with 2 decimals (e.g. "2.34 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Formats pace as mm:ss /km.
 * Returns "--:-- /km" if insufficient data (too little distance or time).
 */
export function formatPace(meters: number, ms: number): string {
  // Need at least 10 metres and 5 seconds to compute a meaningful pace
  if (meters < 10 || ms < 5000) {
    return '--:-- /km';
  }
  const secondsPerMetre = ms / 1000 / meters;
  const secondsPerKm = secondsPerMetre * 1000;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} /km`;
}

/**
 * Calculates pace in seconds per km (for storage).
 */
export function paceSecPerKm(meters: number, ms: number): number {
  if (meters < 10) return 0;
  const secondsPerMetre = ms / 1000 / meters;
  return secondsPerMetre * 1000;
}
