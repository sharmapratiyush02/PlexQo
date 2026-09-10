// src/components/WeeklyRing.tsx
// Circular progress ring for weekly distance goal — pure View/border approach.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface WeeklyRingProps {
  weeklyDistanceKm: number;
  goalKm: number;
  weeklyRunCount: number;
}

const RING_SIZE   = 72;
const RING_STROKE = 7;

export function WeeklyRing({ weeklyDistanceKm, goalKm, weeklyRunCount }: WeeklyRingProps) {
  const progress  = Math.min(weeklyDistanceKm / Math.max(goalKm, 1), 1);
  const pct       = Math.round(progress * 100);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotate the clipping arc to represent progress (0°–360°)
    Animated.timing(rotateAnim, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Arc approach using border trick: a half-circle rotated
  // We simulate a filled arc by using 4 quarter-circle segments.
  // For simplicity: use a border-top colored, rest transparent, rotated.

  // degrees to fill
  const fillDeg = Math.round(progress * 360);

  return (
    <View style={styles.container}>
      {/* Ring */}
      <View style={styles.ringWrapper}>
        {/* Background ring */}
        <View style={styles.ringBg} />

        {/* Filled arc — two half-disk approach */}
        <RingArc fillDeg={fillDeg} />

        {/* Centre label */}
        <View style={styles.centre}>
          <Text style={styles.centreValue}>{weeklyDistanceKm.toFixed(1)}</Text>
          <Text style={styles.centreUnit}>km</Text>
        </View>
      </View>

      {/* Labels */}
      <View style={styles.labels}>
        <Text style={styles.title}>Weekly Goal</Text>
        <Text style={styles.sub}>{weeklyRunCount} run{weeklyRunCount !== 1 ? 's' : ''} · {pct}% of {goalKm}km</Text>
      </View>
    </View>
  );
}

/** Renders a coloured arc [0..360] degrees using two rotated half-disks. */
function RingArc({ fillDeg }: { fillDeg: number }) {
  const half     = RING_SIZE / 2;
  const stroke   = RING_STROKE;
  const color    = '#4ADE80';

  if (fillDeg <= 0) return null;

  // First half (0–180)
  const firstHalf = Math.min(fillDeg, 180);
  // Second half (180–360)
  const secondHalf = Math.max(0, fillDeg - 180);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Clip container */}
      <View style={[styles.arcContainer, { width: RING_SIZE, height: RING_SIZE }]}>
        {/* Right half — always shown if progress > 0 */}
        <View style={[styles.halfClip, { left: half }]}>
          <View
            style={[
              styles.halfDisk,
              { borderColor: color },
              {
                transform: [{ rotate: `${firstHalf - 90}deg` }],
              },
            ]}
          />
        </View>

        {/* Left half — shown when progress > 50% */}
        {secondHalf > 0 && (
          <View style={[styles.halfClip, { right: half, left: 0 }]}>
            <View
              style={[
                styles.halfDisk,
                { borderColor: color, left: -half },
                {
                  transform: [{ rotate: `${secondHalf - 90}deg` }],
                },
              ]}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringBg: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
    borderColor: '#2A2D35',
  },
  arcContainer: {
    position: 'absolute',
    borderRadius: RING_SIZE / 2,
    overflow: 'hidden',
  },
  halfClip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: RING_SIZE / 2,
    overflow: 'hidden',
  },
  halfDisk: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
    borderColor: '#4ADE80',
  },
  centre: {
    alignItems: 'center',
    zIndex: 1,
  },
  centreValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 18,
  },
  centreUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8A8A9A',
    letterSpacing: 0.5,
  },
  labels: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  sub: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8A8A9A',
  },
});
