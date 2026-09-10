// src/components/GhostOverlay.tsx
// Ghost run overlay badge — shows AHEAD / BEHIND vs. ghost pace.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GhostOverlayProps {
  ghostDistanceAtTime: number;  // metres the ghost would have covered by now
  liveDistance: number;         // actual metres covered
}

export function GhostOverlay({ ghostDistanceAtTime, liveDistance }: GhostOverlayProps) {
  const diffM = liveDistance - ghostDistanceAtTime;
  const ahead  = diffM >= 0;
  const absDiff = Math.abs(diffM);

  const label = ahead
    ? `+${(absDiff / 1000).toFixed(2)} km AHEAD`
    : `${(absDiff / 1000).toFixed(2)} km BEHIND`;

  return (
    <View style={[styles.badge, ahead ? styles.badgeAhead : styles.badgeBehind]}>
      <Text style={styles.ghostIcon}>👻</Text>
      <Text style={[styles.label, ahead ? styles.labelAhead : styles.labelBehind]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeAhead: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: '#4ADE80',
  },
  badgeBehind: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderColor: '#F5A623',
  },
  ghostIcon: {
    fontSize: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelAhead: {
    color: '#4ADE80',
  },
  labelBehind: {
    color: '#F5A623',
  },
});
