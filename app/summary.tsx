// app/summary.tsx
// Run Summary screen — ONE big ScrollView so everything is always reachable.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRun } from '../src/context/RunContext';
import { useGamification, type RunReward } from '../src/context/GamificationContext';
import { RouteMap } from '../src/components/RouteMap';
import { RewardRecap } from '../src/components/RewardRecap';
import { formatDistance, formatDuration, formatPace, paceSecPerKm } from '../src/utils/format';
import { saveRun } from '../src/storage/runStorage';

// Fixed map height — never grows, never shrinks
const MAP_HEIGHT = Math.round(Dimensions.get('window').height * 0.30);

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function SummaryScreen() {
  const router = useRouter();
  const { state, resetRun } = useRun();
  const { processRunCompletion } = useGamification();

  const [saved, setSaved]   = useState(false);
  const [reward, setReward] = useState<RunReward | null>(null);

  // Redirect if landed here without a finished run
  useEffect(() => {
    if (state.status !== 'finished') {
      router.replace('/');
    }
  }, []);

  // Minimum distance to count a run (metres)
  const MIN_VALID_DISTANCE_M = 100;
  const isValidRun = state.distanceMeters >= MIN_VALID_DISTANCE_M;

  // Save + process gamification exactly once — only when distance threshold met
  useEffect(() => {
    if (state.status === 'finished' && !saved) {
      setSaved(true);
      if (!isValidRun) return;

      const runDate = new Date();
      const record = {
        id: String(Date.now()),
        date: runDate.toISOString(),
        distanceMeters: state.distanceMeters,
        elapsedMs: state.elapsedMs,
        avgPaceSecPerKm: paceSecPerKm(state.distanceMeters, state.elapsedMs),
        coords: state.coords,
        pauseCount: state.pauseCount,
        startHour: runDate.getHours(),
      };

      saveRun(record).then(() => {
        processRunCompletion(record).then(r => setReward(r));
      });
    }
  }, [state.status]);

  const handleDone = () => {
    resetRun();
    router.replace('/');
  };

  const now         = new Date();
  const timeStr     = formatTime(now);
  const distanceStr = formatDistance(state.distanceMeters);
  const durationStr = formatDuration(state.elapsedMs);
  const paceStr     = formatPace(state.distanceMeters, state.elapsedMs);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* Fixed header — always visible at top */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RUN COMPLETE</Text>
        <Text style={styles.headerSub}>TODAY, {timeStr.toUpperCase()}</Text>
      </View>

      {/* ONE ScrollView wraps map + stats + rewards + done */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Route map — fixed height */}
        <View style={styles.mapContainer}>
          <RouteMap
            coords={state.coords}
            style={StyleSheet.absoluteFill}
            polylineColor="#4ADE80"
            showMarkerLabels
          />
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.runLabel}>RUN</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{distanceStr}</Text>
              <Text style={styles.statLabel}>TOTAL KM</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{durationStr}</Text>
              <Text style={styles.statLabel}>TOTAL TIME</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{paceStr}</Text>
              <Text style={styles.statLabel}>FINAL PACE</Text>
            </View>
          </View>
        </View>

        {/* Reward recap OR too-short notice */}
        {!isValidRun ? (
          <View style={styles.tooShortNotice}>
            <Text style={styles.tooShortIcon}>📏</Text>
            <Text style={styles.tooShortTitle}>Too Short to Count</Text>
            <Text style={styles.tooShortSub}>
              Runs under 100 m aren't saved.{'\n'}Get moving to earn XP, streaks &amp; badges!
            </Text>
          </View>
        ) : (
          reward && <RewardRecap reward={reward} />
        )}

        {/* Done button */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleDone}
          activeOpacity={0.85}
          accessibilityLabel="Done"
        >
          <Text style={styles.doneBtnText}>DONE</Text>
          <Text style={styles.doneBtnIcon}>✦</Text>
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111418',
  },

  // Fixed header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8A9A',
    letterSpacing: 1,
    marginTop: 3,
  },

  // Single scrollable body
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 24 : 16,
    gap: 0,
  },

  // Map — fixed height, never collapses
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: '#1a1e24',
  },

  // Stats
  statsSection: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1F26',
  },
  runLabel: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8A8A9A',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#2A2D35',
  },

  // Done button
  doneBtn: {
    backgroundColor: '#2A2D35',
    marginHorizontal: 20,
    marginTop: 4,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  doneBtnIcon: {
    fontSize: 16,
    color: '#8A8A9A',
  },

  // Too-short notice
  tooShortNotice: {
    backgroundColor: '#1C1F26',
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  tooShortIcon: {
    fontSize: 28,
  },
  tooShortTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tooShortSub: {
    fontSize: 12,
    color: '#8A8A9A',
    textAlign: 'center',
    lineHeight: 18,
  },
});
