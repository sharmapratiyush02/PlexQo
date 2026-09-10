// src/storage/runStorage.ts
// Persist and retrieve run history via AsyncStorage.
// Stores up to MAX_HISTORY runs; supports ghost-run use-case with full coords.

import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@plexqo_run_history';
const LEGACY_KEY  = '@plexqo_run_last';   // migrated on first read
const MAX_HISTORY = 50;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RunRecord {
  id: string;
  date: string;               // ISO date string
  distanceMeters: number;
  elapsedMs: number;
  avgPaceSecPerKm: number;
  coords: { lat: number; lng: number }[];
  pauseCount: number;         // number of times runner paused
  startHour: number;          // 0-23, hour of day the run started (for badges)
  isGhostRun?: boolean;       // true if this was a ghost-run session
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadHistory(): Promise<RunRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as RunRecord[];

    // ── Migrate legacy single-run key ──────────────────────────────────────
    const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as RunRecord;
      // Back-fill optional fields added later
      if (legacy.pauseCount === undefined) legacy.pauseCount = 0;
      if (legacy.startHour  === undefined) legacy.startHour  = new Date(legacy.date).getHours();
      const history = [legacy];
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      await AsyncStorage.removeItem(LEGACY_KEY);
      return history;
    }

    return [];
  } catch (err) {
    console.warn('runStorage: failed to load history', err);
    return [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Saves a completed run record, prepended to the history list.
 * Trims history to MAX_HISTORY entries.
 */
export async function saveRun(record: RunRecord): Promise<void> {
  try {
    const history = await loadHistory();
    const updated  = [record, ...history].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('runStorage: failed to save run', err);
  }
}

/**
 * Returns all stored runs, newest first.
 */
export async function getAllRuns(): Promise<RunRecord[]> {
  return loadHistory();
}

/**
 * Returns the most recently completed run, or null.
 */
export async function getLastRun(): Promise<RunRecord | null> {
  const history = await loadHistory();
  return history[0] ?? null;
}

/**
 * Returns the N most recent runs (default 10), newest first.
 */
export async function getRunHistory(n = 10): Promise<RunRecord[]> {
  const history = await loadHistory();
  return history.slice(0, n);
}

/**
 * Clears all stored runs.
 */
export async function clearAllRuns(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
    await AsyncStorage.removeItem(LEGACY_KEY);
  } catch (err) {
    console.warn('runStorage: failed to clear runs', err);
  }
}
