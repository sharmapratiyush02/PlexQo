// src/components/MetricCard.tsx
// Flat metric display — no card background, bold white values on dark screen.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MetricCardProps {
  value: string;
  label: string;
  /** Renders the value extra-large (primary distance display) */
  highlight?: boolean;
  size?: 'normal' | 'large';
  /** Dim the value (used in paused state) */
  dimmed?: boolean;
}

export function MetricCard({
  value,
  label,
  highlight = false,
  size = 'normal',
  dimmed = false,
}: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text
        style={[
          styles.value,
          size === 'large' && styles.valueLarge,
          dimmed && styles.valueDimmed,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={[styles.label, dimmed && styles.labelDimmed]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  value: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  valueLarge: {
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -2,
  },
  valueDimmed: {
    color: '#666680',
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8A9A',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  labelDimmed: {
    color: '#44445A',
  },
});
