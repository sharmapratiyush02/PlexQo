// src/components/XpBar.tsx
// Level indicator + filled XP progress bar.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { levelProgress, xpToReachLevel, levelFromXp } from '../utils/gamification';

interface XpBarProps {
  totalXp: number;
}

export function XpBar({ totalXp }: XpBarProps) {
  const level    = levelFromXp(totalXp);
  const progress = levelProgress(totalXp);         // 0..1
  const xpBase   = xpToReachLevel(level);
  const xpNext   = xpToReachLevel(level + 1);
  const xpInLevel = totalXp - xpBase;
  const xpNeeded  = xpNext - xpBase;

  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.levelPill}>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
        <Text style={styles.xpLabel}>
          {xpInLevel} / {xpNeeded} XP
        </Text>
      </View>

      {/* Progress track */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelPill: {
    backgroundColor: '#4ADE80',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111418',
    letterSpacing: 0.8,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8A9A',
  },
  track: {
    height: 6,
    backgroundColor: '#2A2D35',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 3,
  },
});
