// src/storage/gamificationStorage.ts
// Persist and retrieve the GamificationProfile via AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@plexqo_gamification_profile';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonalBests {
  longestDistanceM: number;
  fastestPaceSecPerKm: number;   // lower is better; 0 = not set
  longestDurationMs: number;
  longestStreak: number;
  earliestStartHour: number;     // 0-23; 24 = not set
}

export interface Challenge {
  id: string;
  desc: string;
  targetValue: number;
  unit: string;          // 'km' | 'runs' | 'minutes'
  currentValue: number;
  completed: boolean;
  expiresAt: string;     // ISO date (end of day/week)
}

export interface PendingReward {
  xpBonus: number;
  label: string;         // e.g. "🎲 Lucky Run!"
}

export interface GamificationProfile {
  xp: number;
  level: number;
  streak: number;
  lastRunDate: string;         // 'YYYY-MM-DD' or ''
  streakFreezes: number;       // grace days remaining this calendar month
  streakFreezeMonth: string;   // 'YYYY-MM' — used to reset freezes monthly
  personalBests: PersonalBests;
  unlockedBadges: string[];    // badge IDs
  weeklyGoalKm: number;
  monthlyGoalRuns: number;
  weeklyDistanceSoFarM: number;
  weeklyRunCount: number;
  weekStartDate: string;       // 'YYYY-MM-DD' Monday of current week
  lifetimeDistanceM: number;
  totalRuns: number;
  archetype: string;
  theme: string;               // unlockable theme key (default: 'dark')
  dailyChallenge: Challenge | null;
  weeklyChallenge: Challenge | null;
  pendingReward: PendingReward | null;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export function defaultProfile(): GamificationProfile {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastRunDate: '',
    streakFreezes: 2,
    streakFreezeMonth: '',
    personalBests: {
      longestDistanceM: 0,
      fastestPaceSecPerKm: 0,
      longestDurationMs: 0,
      longestStreak: 0,
      earliestStartHour: 24,
    },
    unlockedBadges: [],
    weeklyGoalKm: 20,
    monthlyGoalRuns: 12,
    weeklyDistanceSoFarM: 0,
    weeklyRunCount: 0,
    weekStartDate: '',
    lifetimeDistanceM: 0,
    totalRuns: 0,
    archetype: 'Newcomer',
    theme: 'dark',
    dailyChallenge: null,
    weeklyChallenge: null,
    pendingReward: null,
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function loadProfile(): Promise<GamificationProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();
    // Merge with defaults so new fields are available after app updates
    return { ...defaultProfile(), ...(JSON.parse(raw) as GamificationProfile) };
  } catch (err) {
    console.warn('gamificationStorage: failed to load profile', err);
    return defaultProfile();
  }
}

export async function saveProfile(profile: GamificationProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('gamificationStorage: failed to save profile', err);
  }
}

export async function clearProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
  } catch (err) {
    console.warn('gamificationStorage: failed to clear profile', err);
  }
}
