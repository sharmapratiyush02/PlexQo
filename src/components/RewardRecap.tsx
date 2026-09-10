// src/components/RewardRecap.tsx
// Animated post-run reward section shown on the summary screen.
// Slides up and fades in when rewards are available.

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import type { RunReward } from '../context/GamificationContext';
import { BADGE_CATALOGUE } from '../utils/gamification';

interface RewardRecapProps {
  reward: RunReward;
}

export function RewardRecap({ reward }: RewardRecapProps) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const hasSomething =
    reward.xpGained > 0 ||
    reward.newBadges.length > 0 ||
    reward.luckyReward !== null ||
    reward.dailyChallengeCompleted ||
    reward.weeklyChallengeCompleted ||
    Object.values(reward.pbUpdates).some(Boolean);

  if (!hasSomething) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.sectionTitle}>✦ RUN REWARDS</Text>

      {/* XP Gained */}
      <RewardRow
        icon={reward.levelUp ? '🎉' : '⭐'}
        label={
          reward.levelUp
            ? `+${reward.xpGained} XP — Level Up! → LVL ${reward.newLevel}`
            : `+${reward.xpGained} XP earned`
        }
        highlight={reward.levelUp}
      />

      {/* Streak */}
      {reward.newStreak > 0 && (
        <RewardRow
          icon={reward.streakBroken ? '💔' : '🔥'}
          label={
            reward.streakBroken
              ? `Streak reset to ${reward.newStreak} day`
              : reward.freezeUsed
              ? `🧊 Streak saved! ${reward.newStreak} days`
              : `${reward.newStreak}-day streak! Keep it up!`
          }
          highlight={reward.newStreak >= 7}
        />
      )}

      {/* New Badges */}
      {reward.newBadges.map(id => {
        const def = BADGE_CATALOGUE.find(b => b.id === id);
        if (!def) return null;
        return (
          <RewardRow
            key={id}
            icon={def.icon}
            label={`NEW BADGE: ${def.name}`}
            highlight
          />
        );
      })}

      {/* Personal Bests */}
      {reward.pbUpdates.longestDistance && (
        <RewardRow icon="📏" label="New personal best: Longest run!" highlight />
      )}
      {reward.pbUpdates.fastestPace && (
        <RewardRow icon="⚡" label="New personal best: Fastest pace!" highlight />
      )}
      {reward.pbUpdates.longestDuration && (
        <RewardRow icon="⏱️" label="New personal best: Longest duration!" highlight />
      )}

      {/* Challenges */}
      {reward.dailyChallengeCompleted && (
        <RewardRow icon="⚡" label="Daily challenge complete!" highlight />
      )}
      {reward.weeklyChallengeCompleted && (
        <RewardRow icon="📅" label="Weekly challenge complete!" highlight />
      )}

      {/* Lucky reward */}
      {reward.luckyReward && (
        <RewardRow icon="🎲" label={reward.luckyReward.label} highlight />
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Next milestone teaser */}
      {reward.nextMilestone && (
        <View style={styles.teaser}>
          <Text style={styles.teaserText}>
            🎯  {reward.nextMilestone.kmAway} km more until your next milestone —
          </Text>
          <Text style={styles.teaserBadge}>{reward.nextMilestone.label}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function RewardRow({
  icon,
  label,
  highlight = false,
}: {
  icon: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, highlight && styles.rowLabelHighlight]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1F26',
    borderRadius: 16,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A8A9A',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIcon: {
    fontSize: 18,
    width: 26,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8A9A',
    lineHeight: 18,
  },
  rowLabelHighlight: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2D35',
    marginVertical: 2,
  },
  teaser: {
    gap: 2,
  },
  teaserText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A9A',
    lineHeight: 18,
  },
  teaserBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ADE80',
  },
});
