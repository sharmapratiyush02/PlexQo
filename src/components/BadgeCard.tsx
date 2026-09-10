// src/components/BadgeCard.tsx
// Individual badge card for the badges gallery screen.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BadgeDef } from '../utils/gamification';

interface BadgeCardProps {
  badge: BadgeDef;
  unlocked: boolean;
  earnedDate?: string;  // ISO string, shown if unlocked
}

export function BadgeCard({ badge, unlocked, earnedDate }: BadgeCardProps) {
  const dateStr = earnedDate
    ? new Date(earnedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <View style={[styles.card, !unlocked && styles.cardLocked]}>
      {/* Icon */}
      <Text style={[styles.icon, !unlocked && styles.iconLocked]}>
        {unlocked ? badge.icon : '🔒'}
      </Text>

      {/* Text */}
      <View style={styles.info}>
        <Text style={[styles.name, !unlocked && styles.nameLocked]} numberOfLines={1}>
          {badge.name}
        </Text>
        <Text style={[styles.desc, !unlocked && styles.descLocked]} numberOfLines={2}>
          {badge.desc}
        </Text>
        {unlocked && dateStr && (
          <Text style={styles.date}>Earned {dateStr}</Text>
        )}
      </View>

      {/* Glow dot for unlocked */}
      {unlocked && <View style={styles.glowDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F26',
    borderRadius: 14,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: '#4ADE80',
    marginBottom: 10,
  },
  cardLocked: {
    borderColor: '#2A2D35',
    opacity: 0.55,
  },
  icon: {
    fontSize: 30,
    width: 40,
    textAlign: 'center',
  },
  iconLocked: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  nameLocked: {
    color: '#555566',
  },
  desc: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8A8A9A',
  },
  descLocked: {
    color: '#3A3D45',
  },
  date: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4ADE80',
    marginTop: 2,
  },
  glowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
});
