// src/context/GamificationContext.tsx
// Context that owns the GamificationProfile and exposes processRunCompletion.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { loadProfile, saveProfile, GamificationProfile } from '../storage/gamificationStorage';
import type { RunRecord } from '../storage/runStorage';
import {
  xpForRun,
  levelFromXp,
  updateStreak,
  refreshFreezesIfNeeded,
  getMondayOfWeek,
  refreshWeeklyIfNeeded,
  detectPersonalBests,
  applyPersonalBests,
  detectNewBadges,
  computeArchetype,
  generateDailyChallenge,
  generateWeeklyChallenge,
  isDailyChallengeExpired,
  isWeeklyChallengeExpired,
  updateChallengeProgress,
  rollLuckyReward,
  nextDistanceMilestone,
  toDateStr,
  PBUpdates,
  NextMilestone,
} from '../utils/gamification';

// ─── RunReward (returned from processRunCompletion) ───────────────────────────

export interface RunReward {
  xpGained: number;
  levelUp: boolean;
  newLevel: number;
  newStreak: number;
  streakBroken: boolean;
  freezeUsed: boolean;
  newBadges: string[];
  pbUpdates: PBUpdates;
  luckyReward: { xpBonus: number; label: string } | null;
  dailyChallengeCompleted: boolean;
  weeklyChallengeCompleted: boolean;
  nextMilestone: NextMilestone | null;
}

// ─── Context Value ─────────────────────────────────────────────────────────────

interface GamificationContextValue {
  profile: GamificationProfile;
  isLoaded: boolean;
  processRunCompletion: (run: RunRecord) => Promise<RunReward>;
  useStreakFreeze: () => Promise<boolean>;
  refreshChallenges: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);

  // Load on mount
  useEffect(() => {
    loadProfile().then(p => setProfile(refreshChallengesInProfile(p)));
  }, []);

  // ── Helper: ensure challenges are fresh ─────────────────────────────────────
  function refreshChallengesInProfile(p: GamificationProfile): GamificationProfile {
    const today  = toDateStr(new Date());
    const monday = getMondayOfWeek(new Date(today));
    let updated  = { ...p };

    if (isDailyChallengeExpired(p.dailyChallenge, today)) {
      updated = { ...updated, dailyChallenge: generateDailyChallenge(today) };
    }
    if (isWeeklyChallengeExpired(p.weeklyChallenge, monday)) {
      updated = { ...updated, weeklyChallenge: generateWeeklyChallenge(monday) };
    }

    // Reset weekly counters if the week rolled over
    const { weekStartDate, weeklyDistanceM, weeklyRunCount, reset } = refreshWeeklyIfNeeded(
      updated.weekStartDate,
      updated.weeklyDistanceSoFarM,
      updated.weeklyRunCount,
      today,
    );
    if (reset) {
      updated = {
        ...updated,
        weekStartDate,
        weeklyDistanceSoFarM: weeklyDistanceM,
        weeklyRunCount,
      };
    }

    // Refresh streak freezes if month changed
    const { freezes, month } = refreshFreezesIfNeeded(
      updated.streakFreezes,
      updated.streakFreezeMonth,
      today,
    );
    updated = { ...updated, streakFreezes: freezes, streakFreezeMonth: month };

    return updated;
  }

  // ── processRunCompletion ────────────────────────────────────────────────────
  const processRunCompletion = useCallback(async (run: RunRecord): Promise<RunReward> => {
    const base = profile ?? await loadProfile();
    const fresh = refreshChallengesInProfile(base);

    const today  = toDateStr(new Date(run.date));
    const monday = getMondayOfWeek(new Date(today));

    // 1. XP
    const xpGained  = xpForRun(run.distanceMeters, run.elapsedMs, run.pauseCount);
    const luckyRoll = rollLuckyReward(run.id);
    const totalXpGained = xpGained + (luckyRoll?.xpBonus ?? 0);
    const oldLevel  = levelFromXp(fresh.xp);
    const newXp     = fresh.xp + totalXpGained;
    const newLevel  = levelFromXp(newXp);

    // 2. Streak
    const streakResult = updateStreak(fresh.lastRunDate, fresh.streak, fresh.streakFreezes, today);

    // 3. Personal bests
    const newTotalRuns = fresh.totalRuns + 1;
    const newLifetimeM = fresh.lifetimeDistanceM + run.distanceMeters;
    const pbUpdates    = detectPersonalBests(fresh.personalBests, run, streakResult.newStreak);
    const newBests     = applyPersonalBests(fresh.personalBests, run, streakResult.newStreak, pbUpdates);

    // 4. Badges
    const newBadgeIds = detectNewBadges(
      fresh.unlockedBadges,
      run,
      newTotalRuns,
      streakResult.newStreak,
      newLifetimeM,
      pbUpdates,
      luckyRoll !== null,
    );

    // 5. Challenges
    const updatedDaily  = updateChallengeProgress(fresh.dailyChallenge, run, streakResult.newStreak);
    const updatedWeekly = updateChallengeProgress(fresh.weeklyChallenge, run, streakResult.newStreak);
    const dailyCompleted  = !!(updatedDaily?.completed  && !fresh.dailyChallenge?.completed);
    const weeklyCompleted = !!(updatedWeekly?.completed && !fresh.weeklyChallenge?.completed);

    // 6. Weekly goal accumulators
    const weekRefresh = refreshWeeklyIfNeeded(
      fresh.weekStartDate,
      fresh.weeklyDistanceSoFarM,
      fresh.weeklyRunCount,
      today,
    );
    const newWeeklyDist  = (weekRefresh.reset ? 0 : weekRefresh.weeklyDistanceM) + run.distanceMeters;
    const newWeeklyRuns  = (weekRefresh.reset ? 0 : weekRefresh.weeklyRunCount) + 1;

    // 7. Archetype
    const scratchProfile: GamificationProfile = {
      ...fresh,
      totalRuns: newTotalRuns,
      lifetimeDistanceM: newLifetimeM,
      streak: streakResult.newStreak,
      personalBests: newBests,
    };
    const newArchetype = computeArchetype(scratchProfile);

    // 8. Next milestone teaser
    const nextMilestone = nextDistanceMilestone(newLifetimeM);

    // ── Build updated profile ──────────────────────────────────────────────
    const updated: GamificationProfile = {
      ...fresh,
      xp: newXp,
      level: newLevel,
      streak: streakResult.newStreak,
      lastRunDate: today,
      streakFreezes: streakResult.newFreezes,
      personalBests: newBests,
      unlockedBadges: [...fresh.unlockedBadges, ...newBadgeIds],
      weeklyDistanceSoFarM: newWeeklyDist,
      weeklyRunCount: newWeeklyRuns,
      weekStartDate: weekRefresh.weekStartDate,
      lifetimeDistanceM: newLifetimeM,
      totalRuns: newTotalRuns,
      archetype: newArchetype,
      dailyChallenge: updatedDaily,
      weeklyChallenge: updatedWeekly,
      pendingReward: luckyRoll,
    };

    await saveProfile(updated);
    setProfile(updated);

    return {
      xpGained: totalXpGained,
      levelUp: newLevel > oldLevel,
      newLevel,
      newStreak: streakResult.newStreak,
      streakBroken: streakResult.streakBroken,
      freezeUsed: streakResult.freezeUsed,
      newBadges: newBadgeIds,
      pbUpdates,
      luckyReward: luckyRoll,
      dailyChallengeCompleted: dailyCompleted,
      weeklyChallengeCompleted: weeklyCompleted,
      nextMilestone,
    };
  }, [profile]);

  // ── useStreakFreeze ─────────────────────────────────────────────────────────
  const useStreakFreeze = useCallback(async (): Promise<boolean> => {
    const p = profile ?? await loadProfile();
    if (p.streakFreezes <= 0) return false;
    const updated = { ...p, streakFreezes: p.streakFreezes - 1 };
    await saveProfile(updated);
    setProfile(updated);
    return true;
  }, [profile]);

  // ── refreshChallenges ───────────────────────────────────────────────────────
  const refreshChallenges = useCallback(async (): Promise<void> => {
    const p = profile ?? await loadProfile();
    const updated = refreshChallengesInProfile(p);
    await saveProfile(updated);
    setProfile(updated);
  }, [profile]);

  const isLoaded = profile !== null;
  const safeProfile = profile ?? {
    xp: 0, level: 1, streak: 0, lastRunDate: '', streakFreezes: 2,
    streakFreezeMonth: '', personalBests: { longestDistanceM: 0, fastestPaceSecPerKm: 0,
      longestDurationMs: 0, longestStreak: 0, earliestStartHour: 24 },
    unlockedBadges: [], weeklyGoalKm: 20, monthlyGoalRuns: 12,
    weeklyDistanceSoFarM: 0, weeklyRunCount: 0, weekStartDate: '',
    lifetimeDistanceM: 0, totalRuns: 0, archetype: 'Newcomer', theme: 'dark',
    dailyChallenge: null, weeklyChallenge: null, pendingReward: null,
  };

  return (
    <GamificationContext.Provider
      value={{ profile: safeProfile, isLoaded, processRunCompletion, useStreakFreeze, refreshChallenges }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGamification(): GamificationContextValue {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}
