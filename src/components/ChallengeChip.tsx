// src/components/ChallengeChip.tsx
// Daily / weekly challenge chip for the home screen.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Challenge } from '../storage/gamificationStorage';

interface ChallengeChipProps {
  challenge: Challenge | null;
  type: 'daily' | 'weekly';
}

export function ChallengeChip({ challenge, type }: ChallengeChipProps) {
  if (!challenge) return null;

  const progress = Math.min(challenge.currentValue / Math.max(challenge.targetValue, 1), 1);
  const pct = Math.round(progress * 100);
  const done = challenge.completed;

  return (
    <View style={[styles.chip, done && styles.chipDone]}>
      <View style={styles.left}>
        <Text style={styles.typeLabel}>{type === 'daily' ? '⚡ DAILY' : '📅 WEEKLY'}</Text>
        <Text style={styles.desc} numberOfLines={1}>{challenge.desc}</Text>
        {!done && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        )}
      </View>

      {done ? (
        <Text style={styles.doneCheck}>✓</Text>
      ) : (
        <Text style={styles.fraction}>
          {challenge.unit === 'km'
            ? `${challenge.currentValue.toFixed(1)}/${challenge.targetValue}km`
            : challenge.unit === 'minutes'
            ? `${Math.floor(challenge.currentValue)}/${challenge.targetValue}min`
            : `${Math.floor(challenge.currentValue)}/${challenge.targetValue}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F26',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2D35',
    gap: 12,
  },
  chipDone: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74, 222, 128, 0.07)',
  },
  left: {
    flex: 1,
    gap: 4,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F5A623',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  desc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#2A2D35',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 2,
  },
  fraction: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8A9A',
    minWidth: 60,
    textAlign: 'right',
  },
  doneCheck: {
    fontSize: 18,
    color: '#4ADE80',
    fontWeight: '800',
  },
});
