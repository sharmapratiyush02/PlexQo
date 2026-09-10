// src/components/RunControls.tsx
// Run control buttons — styled to match target design:
//   Active  → full-width amber PAUSE pill
//   Paused  → "Finish Run?" label + green RESUME + red FINISH side-by-side

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRun } from '../context/RunContext';

interface RunControlsProps {
  onFinishConfirmed: () => void;
}

export function RunControls({ onFinishConfirmed }: RunControlsProps) {
  const { state, pauseRun, resumeRun, finishRun } = useRun();
  const [confirmingFinish, setConfirmingFinish] = useState(false);

  const handleFinishPress = () => {
    if (confirmingFinish) {
      // Second tap — actually finish
      finishRun();
      onFinishConfirmed();
    } else {
      setConfirmingFinish(true);
    }
  };

  const handleResume = () => {
    setConfirmingFinish(false);
    resumeRun();
  };

  const isActive = state.status === 'active';
  const isPaused = state.status === 'paused';

  if (isActive) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.pill, styles.pausePill]}
          onPress={pauseRun}
          accessibilityLabel="Pause run"
          activeOpacity={0.85}
        >
          <Text style={styles.pauseIcon}>⏸</Text>
          <Text style={styles.pillText}>PAUSE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isPaused) {
    return (
      <View style={styles.container}>
        <Text style={styles.finishHint}>Finish Run?</Text>
        <View style={styles.splitRow}>
          {/* RESUME */}
          <TouchableOpacity
            style={[styles.splitPill, styles.resumePill]}
            onPress={handleResume}
            accessibilityLabel="Resume run"
            activeOpacity={0.85}
          >
            <Text style={styles.resumeIcon}>▶</Text>
            <Text style={styles.pillText}>RESUME</Text>
          </TouchableOpacity>

          {/* FINISH */}
          <TouchableOpacity
            style={[styles.splitPill, styles.finishPill]}
            onPress={handleFinishPress}
            accessibilityLabel="Finish run"
            activeOpacity={0.85}
          >
            <Text style={styles.finishIcon}>■</Text>
            <Text style={styles.pillText}>FINISH</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 50,
    gap: 8,
  },
  pausePill: {
    backgroundColor: '#F5A623',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 50,
    gap: 7,
  },
  resumePill: {
    backgroundColor: '#4ADE80',
  },
  finishPill: {
    backgroundColor: '#E53935',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  pauseIcon: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  resumeIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  finishIcon: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  finishHint: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A9A',
    letterSpacing: 0.3,
  },
});
