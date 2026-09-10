// src/components/StreakBadge.tsx
// Flame + streak counter + archetype label for the home screen.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface StreakBadgeProps {
  streak: number;
  archetype: string;
  streakFreezes: number;
}

export function StreakBadge({ streak, archetype, streakFreezes }: StreakBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse flame when streak > 0
  useEffect(() => {
    if (streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [streak]);

  const hasStreak = streak > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, hasStreak && styles.badgeActive]}>
        {/* Flame */}
        <Animated.Text style={[styles.flame, { transform: [{ scale: pulseAnim }] }]}>
          {hasStreak ? '🔥' : '💤'}
        </Animated.Text>

        {/* Count */}
        <Text style={[styles.count, hasStreak && styles.countActive]}>
          {streak}
        </Text>

        <Text style={styles.dayLabel}>day streak</Text>

        {/* Freezes */}
        {streakFreezes > 0 && (
          <View style={styles.freezeRow}>
            {Array.from({ length: streakFreezes }).map((_, i) => (
              <Text key={i} style={styles.freezeIcon}>🧊</Text>
            ))}
          </View>
        )}
      </View>

      {/* Archetype */}
      <Text style={styles.archetype}>{archetype}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F26',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  badgeActive: {
    borderColor: '#F5A623',
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
  },
  flame: {
    fontSize: 20,
  },
  count: {
    fontSize: 22,
    fontWeight: '800',
    color: '#555566',
    letterSpacing: -0.5,
  },
  countActive: {
    color: '#F5A623',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8A9A',
    letterSpacing: 0.2,
  },
  freezeRow: {
    flexDirection: 'row',
    gap: 2,
    marginLeft: 4,
  },
  freezeIcon: {
    fontSize: 13,
  },
  archetype: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8A9A',
    letterSpacing: 0.5,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
});
