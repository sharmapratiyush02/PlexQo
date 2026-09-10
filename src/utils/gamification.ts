// src/utils/gamification.ts
// Pure gamification logic — no side-effects, no storage access.
// All functions take explicit inputs and return plain values.

import type { RunRecord } from '../storage/runStorage';
import type {
  GamificationProfile,
  PersonalBests,
  Challenge,
  PendingReward,
} from '../storage/gamificationStorage';

// ─── XP Formula ───────────────────────────────────────────────────────────────

/**
 * Calculate XP earned for a single run.
 * Rewards distance, duration, and consistency (penalises pauses slightly).
 */
export function xpForRun(
  distanceM: number,
  elapsedMs: number,
  pauseCount: number,
): number {
  const km       = distanceM / 1000;
  const minutes  = elapsedMs / 60_000;

  // Base XP: 10 per km + 2 per minute active
  const base = km * 10 + minutes * 2;

  // Consistency bonus: no pauses ×1.15, 1 pause ×1.0, 2+ pauses ×0.9
  const consistencyMult = pauseCount === 0 ? 1.15 : pauseCount === 1 ? 1.0 : 0.9;

  // Minimum 5 XP even for very short runs
  return Math.max(5, Math.round(base * consistencyMult));
}

// ─── Levels ───────────────────────────────────────────────────────────────────

/** XP required to reach a given level (1-indexed). */
export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  // Quadratic curve: level 2 = 100 XP, level 10 = ~2,000, level 50 = ~100k
  return Math.round(100 * Math.pow(level - 1, 1.8));
}

/** XP required to complete the given level (i.e. gap between level and level+1). */
export function xpForLevel(level: number): number {
  return xpToReachLevel(level + 1) - xpToReachLevel(level);
}

/** Compute current level from total accumulated XP. */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpToReachLevel(level + 1) <= totalXp) level++;
  return Math.min(level, 50);
}

/** Progress [0..1] within the current level. */
export function levelProgress(totalXp: number): number {
  const level     = levelFromXp(totalXp);
  const levelBase = xpToReachLevel(level);
  const levelCap  = xpToReachLevel(level + 1);
  if (levelCap === levelBase) return 1;
  return (totalXp - levelBase) / (levelCap - levelBase);
}

// ─── Streaks ──────────────────────────────────────────────────────────────────

/** Format Date as 'YYYY-MM-DD' in local time. */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM' of a date. */
export function toMonthStr(d: Date): string {
  return toDateStr(d).slice(0, 7);
}

/** Day difference between two 'YYYY-MM-DD' strings. */
function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export interface StreakResult {
  newStreak: number;
  newFreezes: number;
  streakBroken: boolean;
  freezeUsed: boolean;
}

/**
 * Computes updated streak after a run.
 *
 * Rules:
 *  - Same-day run: streak unchanged (already ran today).
 *  - Yesterday's run: streak + 1.
 *  - 2 days ago + freeze available: use freeze, streak maintained.
 *  - More than 2 days / no freeze: streak resets to 1.
 */
export function updateStreak(
  lastRunDate: string,
  currentStreak: number,
  streakFreezes: number,
  today: string,
): StreakResult {
  if (!lastRunDate) {
    return { newStreak: 1, newFreezes: streakFreezes, streakBroken: false, freezeUsed: false };
  }

  const gap = daysBetween(lastRunDate, today);

  if (gap === 0) {
    // Already ran today — no change
    return { newStreak: currentStreak, newFreezes: streakFreezes, streakBroken: false, freezeUsed: false };
  }

  if (gap === 1) {
    // Consecutive day
    return { newStreak: currentStreak + 1, newFreezes: streakFreezes, streakBroken: false, freezeUsed: false };
  }

  if (gap === 2 && streakFreezes > 0) {
    // Use a freeze to bridge the gap
    return { newStreak: currentStreak + 1, newFreezes: streakFreezes - 1, streakBroken: false, freezeUsed: true };
  }

  // Streak broken
  return { newStreak: 1, newFreezes: streakFreezes, streakBroken: true, freezeUsed: false };
}

/** Reset streak freezes to 2 when the calendar month rolls over. */
export function refreshFreezesIfNeeded(
  freezes: number,
  lastFreezeMonth: string,
  today: string,
): { freezes: number; month: string } {
  const thisMonth = today.slice(0, 7);
  if (lastFreezeMonth !== thisMonth) {
    return { freezes: 2, month: thisMonth };
  }
  return { freezes, month: lastFreezeMonth };
}

// ─── Weekly Goals ─────────────────────────────────────────────────────────────

/** Get the Monday date (YYYY-MM-DD) of the week containing `date`. */
export function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

/** Check if week has rolled over; reset weekly counters if so. */
export function refreshWeeklyIfNeeded(
  weekStartDate: string,
  weeklyDistanceM: number,
  weeklyRunCount: number,
  today: string,
): { weekStartDate: string; weeklyDistanceM: number; weeklyRunCount: number; reset: boolean } {
  const currentMonday = getMondayOfWeek(new Date(today));
  if (weekStartDate !== currentMonday) {
    return { weekStartDate: currentMonday, weeklyDistanceM: 0, weeklyRunCount: 0, reset: true };
  }
  return { weekStartDate, weeklyDistanceM, weeklyRunCount, reset: false };
}

// ─── Personal Bests ───────────────────────────────────────────────────────────

export interface PBUpdates {
  longestDistance: boolean;
  fastestPace: boolean;
  longestDuration: boolean;
  longestStreak: boolean;
  earliestStart: boolean;
}

export function detectPersonalBests(
  bests: PersonalBests,
  run: RunRecord,
  newStreak: number,
): PBUpdates {
  return {
    longestDistance : run.distanceMeters  > bests.longestDistanceM,
    fastestPace     : run.avgPaceSecPerKm > 0 &&
                      (bests.fastestPaceSecPerKm === 0 || run.avgPaceSecPerKm < bests.fastestPaceSecPerKm),
    longestDuration : run.elapsedMs       > bests.longestDurationMs,
    longestStreak   : newStreak           > bests.longestStreak,
    earliestStart   : run.startHour       < bests.earliestStartHour,
  };
}

export function applyPersonalBests(
  bests: PersonalBests,
  run: RunRecord,
  newStreak: number,
  updates: PBUpdates,
): PersonalBests {
  return {
    longestDistanceM  : updates.longestDistance  ? run.distanceMeters      : bests.longestDistanceM,
    fastestPaceSecPerKm: updates.fastestPace     ? run.avgPaceSecPerKm     : bests.fastestPaceSecPerKm,
    longestDurationMs : updates.longestDuration  ? run.elapsedMs           : bests.longestDurationMs,
    longestStreak     : updates.longestStreak    ? newStreak                : bests.longestStreak,
    earliestStartHour : updates.earliestStart    ? run.startHour            : bests.earliestStartHour,
  };
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const BADGE_CATALOGUE: BadgeDef[] = [
  { id: 'first_run',      name: 'First Steps',       icon: '👟', desc: 'Complete your first run' },
  { id: 'run_10',         name: 'On a Roll',          icon: '🔄', desc: 'Complete 10 total runs' },
  { id: 'run_50',         name: 'Dedicated',          icon: '💪', desc: 'Complete 50 total runs' },
  { id: 'dist_5k',        name: '5K Club',            icon: '🏃', desc: 'Run 5km in a single session' },
  { id: 'dist_10k',       name: '10K Club',           icon: '🎽', desc: 'Run 10km in a single session' },
  { id: 'dist_hm',        name: 'Half-Marathoner',    icon: '🥈', desc: 'Run 21.1km in a single session' },
  { id: 'lifetime_100k',  name: 'Century Club',       icon: '💯', desc: '100km total lifetime distance' },
  { id: 'streak_3',       name: 'Hat-Trick',          icon: '🎩', desc: '3-day running streak' },
  { id: 'streak_7',       name: 'Week Warrior',       icon: '🔥', desc: '7-day running streak' },
  { id: 'streak_30',      name: 'Iron Runner',        icon: '⚡', desc: '30-day running streak' },
  { id: 'early_bird',     name: 'Early Bird',         icon: '🌅', desc: 'Run before 6 AM' },
  { id: 'night_owl',      name: 'Night Owl',          icon: '🦉', desc: 'Run after 9 PM' },
  { id: 'no_pause',       name: 'Flow State',         icon: '🌊', desc: 'Finish a run with zero pauses' },
  { id: 'pb_distance',    name: 'Distance King',      icon: '📏', desc: 'Beat your personal best distance' },
  { id: 'pb_pace',        name: 'Speed Demon',        icon: '⚡', desc: 'Beat your personal best pace' },
  { id: 'lucky_run',      name: 'Lucky Day',          icon: '🎲', desc: 'Receive a lucky run bonus' },
];

export function detectNewBadges(
  unlockedBadges: string[],
  run: RunRecord,
  totalRuns: number,
  newStreak: number,
  lifetimeDistanceM: number,
  pbUpdates: PBUpdates,
  isLucky: boolean,
): string[] {
  const already = new Set(unlockedBadges);
  const earned: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !already.has(id)) earned.push(id);
  };

  check('first_run',      totalRuns >= 1);
  check('run_10',         totalRuns >= 10);
  check('run_50',         totalRuns >= 50);
  check('dist_5k',        run.distanceMeters >= 5_000);
  check('dist_10k',       run.distanceMeters >= 10_000);
  check('dist_hm',        run.distanceMeters >= 21_100);
  check('lifetime_100k',  lifetimeDistanceM  >= 100_000);
  check('streak_3',       newStreak >= 3);
  check('streak_7',       newStreak >= 7);
  check('streak_30',      newStreak >= 30);
  check('early_bird',     run.startHour < 6);
  check('night_owl',      run.startHour >= 21);
  check('no_pause',       run.pauseCount === 0);
  check('pb_distance',    pbUpdates.longestDistance);
  check('pb_pace',        pbUpdates.fastestPace);
  check('lucky_run',      isLucky);

  return earned;
}

// ─── Archetype ────────────────────────────────────────────────────────────────

export function computeArchetype(profile: GamificationProfile): string {
  const { totalRuns, streak, personalBests, lifetimeDistanceM } = profile;
  if (totalRuns < 5) return 'Newcomer';
  if (streak >= 30) return 'Iron Runner';
  if (personalBests.fastestPaceSecPerKm > 0 && personalBests.fastestPaceSecPerKm < 300) return 'Speed Demon';
  if (personalBests.longestDistanceM >= 15_000) return 'Distance Chaser';
  if (streak >= 7) return 'Week Warrior';
  if (personalBests.earliestStartHour < 6) return 'Early Bird';
  if (totalRuns >= 20 && lifetimeDistanceM / totalRuns < 5_000) return 'Consistent Cruiser';
  return 'Trail Blazer';
}

// ─── Daily / Weekly Challenges ────────────────────────────────────────────────

interface ChallengeTemplate {
  id: string;
  desc: string;
  targetValue: number;
  unit: string;
}

const DAILY_POOL: ChallengeTemplate[] = [
  { id: 'd_2k',     desc: 'Run 2 km today',              targetValue: 2,  unit: 'km' },
  { id: 'd_3k',     desc: 'Run 3 km today',              targetValue: 3,  unit: 'km' },
  { id: 'd_5k',     desc: 'Run 5 km today',              targetValue: 5,  unit: 'km' },
  { id: 'd_20min',  desc: 'Run for 20 minutes today',    targetValue: 20, unit: 'minutes' },
  { id: 'd_30min',  desc: 'Run for 30 minutes today',    targetValue: 30, unit: 'minutes' },
  { id: 'd_nopause',desc: 'Complete a pause-free run',   targetValue: 1,  unit: 'runs' },
  { id: 'd_2runs',  desc: 'Log 2 runs today',            targetValue: 2,  unit: 'runs' },
];

const WEEKLY_POOL: ChallengeTemplate[] = [
  { id: 'w_10k',    desc: 'Run 10 km this week',         targetValue: 10, unit: 'km' },
  { id: 'w_20k',    desc: 'Run 20 km this week',         targetValue: 20, unit: 'km' },
  { id: 'w_3runs',  desc: 'Complete 3 runs this week',   targetValue: 3,  unit: 'runs' },
  { id: 'w_5runs',  desc: 'Complete 5 runs this week',   targetValue: 5,  unit: 'runs' },
  { id: 'w_60min',  desc: 'Run for 60 minutes this week',targetValue: 60, unit: 'minutes' },
  { id: 'w_streak', desc: 'Maintain a 5-day streak',     targetValue: 5,  unit: 'streak' },
];

/** Deterministic pick from pool based on a numeric seed. */
function pickFromPool<T>(pool: T[], seed: number): T {
  return pool[seed % pool.length];
}

/** End-of-day ISO string for a given YYYY-MM-DD. */
function endOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59.999`;
}

/** End-of-week ISO string (Sunday 23:59:59 of the given Monday). */
function endOfWeek(mondayStr: string): string {
  const d = new Date(mondayStr);
  d.setDate(d.getDate() + 6);
  return endOfDay(toDateStr(d));
}

export function generateDailyChallenge(today: string): Challenge {
  // Seed = numeric representation of date digits
  const seed = parseInt(today.replace(/-/g, ''), 10);
  const template = pickFromPool(DAILY_POOL, seed);
  return {
    ...template,
    currentValue: 0,
    completed: false,
    expiresAt: endOfDay(today),
  };
}

export function generateWeeklyChallenge(mondayOfWeek: string): Challenge {
  const seed = parseInt(mondayOfWeek.replace(/-/g, ''), 10);
  const template = pickFromPool(WEEKLY_POOL, seed);
  return {
    ...template,
    currentValue: 0,
    completed: false,
    expiresAt: endOfWeek(mondayOfWeek),
  };
}

export function isDailyChallengeExpired(challenge: Challenge | null, today: string): boolean {
  if (!challenge) return true;
  return challenge.expiresAt.slice(0, 10) !== today;
}

export function isWeeklyChallengeExpired(challenge: Challenge | null, mondayOfWeek: string): boolean {
  if (!challenge) return true;
  const weekStart = challenge.expiresAt.slice(0, 10);
  // The challenge's week Monday
  const d = new Date(challenge.expiresAt);
  d.setDate(d.getDate() - 6);
  return toDateStr(d) !== mondayOfWeek;
}

/** Update challenge progress after a run. Returns updated challenge. */
export function updateChallengeProgress(
  challenge: Challenge | null,
  run: RunRecord,
  streak: number,
): Challenge | null {
  if (!challenge || challenge.completed) return challenge;

  let delta = 0;
  switch (challenge.unit) {
    case 'km':      delta = run.distanceMeters / 1000; break;
    case 'minutes': delta = run.elapsedMs / 60_000;    break;
    case 'runs':    delta = 1;                         break;
    case 'streak':  delta = 0;                         break; // checked separately
  }

  const newValue = challenge.id === 'w_streak'
    ? streak
    : Math.round((challenge.currentValue + delta) * 100) / 100;

  return {
    ...challenge,
    currentValue: newValue,
    completed: newValue >= challenge.targetValue,
  };
}

// ─── Variable Reward ──────────────────────────────────────────────────────────

const LUCKY_LABELS = [
  '🎲 Lucky Run! Bonus XP!',
  '⭐ Star Run! Extra XP awarded!',
  '✨ Magic Run! Bonus XP!',
  '🌟 Golden Run! Extra reward!',
];

/**
 * ~15% chance of a lucky bonus reward.
 * Deterministic-ish: seeded by run ID so replays are consistent.
 */
export function rollLuckyReward(runId: string): PendingReward | null {
  // Use last 4 chars of ID (timestamp-based) as a small int
  const seed = parseInt(runId.slice(-4), 10) || 0;
  if (seed % 7 !== 0) return null; // ~14.3% hit rate
  const bonusXp = 25 + (seed % 76); // 25–100 bonus XP
  const label = LUCKY_LABELS[seed % LUCKY_LABELS.length];
  return { xpBonus: bonusXp, label };
}

// ─── Next Milestone Teaser ────────────────────────────────────────────────────

export interface NextMilestone {
  label: string;
  kmAway: number;
}

/** Returns the nearest upcoming badge milestone based on distance, or null. */
export function nextDistanceMilestone(lifetimeDistanceM: number): NextMilestone | null {
  const milestones = [
    { km: 5,     label: '5K Club badge 🏃' },
    { km: 10,    label: '10K Club badge 🎽' },
    { km: 21.1,  label: 'Half-Marathon badge 🥈' },
    { km: 100,   label: 'Century Club badge 💯' },
    { km: 200,   label: '200km milestone 🗺️' },
    { km: 500,   label: '500km milestone 🌍' },
  ];

  const lifetimeKm = lifetimeDistanceM / 1000;
  for (const m of milestones) {
    if (lifetimeKm < m.km) {
      return { label: m.label, kmAway: Math.round((m.km - lifetimeKm) * 10) / 10 };
    }
  }
  return null;
}
