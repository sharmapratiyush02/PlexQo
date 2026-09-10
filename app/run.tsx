// app/run.tsx
// Active run screen — map-first, live metrics, ghost run support.

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRun } from '../src/context/RunContext';
import { useTimer } from '../src/hooks/useTimer';
import { useLocation } from '../src/hooks/useLocation';
import { MetricCard } from '../src/components/MetricCard';
import { RunControls } from '../src/components/RunControls';
import { RouteMap } from '../src/components/RouteMap';
import { GhostOverlay } from '../src/components/GhostOverlay';
import { formatDistance, formatDuration, formatPace } from '../src/utils/format';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { getRunHistory, type RunRecord } from '../src/storage/runStorage';
import type { Coord } from '../src/context/RunContext';

export default function RunScreen() {
  const router = useRouter();
  const { ghostRunId } = useLocalSearchParams<{ ghostRunId?: string }>();
  const { state } = useRun();
  const { gpsWeak } = useLocation();

  // Ghost state
  const [ghostRun, setGhostRun] = useState<RunRecord | null>(null);
  const ghostLoadedRef = useRef(false);

  useTimer();

  // Keep screen awake during run
  useEffect(() => {
    activateKeepAwakeAsync();
    return () => { deactivateKeepAwake(); };
  }, []);

  // Redirect to home if run ends unexpectedly
  useEffect(() => {
    if (state.status === 'idle') {
      router.replace('/');
    }
  }, [state.status]);

  // Load ghost run data once
  useEffect(() => {
    if (!ghostRunId || ghostLoadedRef.current) return;
    ghostLoadedRef.current = true;
    (async () => {
      const runs = await getRunHistory(50);
      const found = runs.find(r => r.id === ghostRunId);
      if (found) setGhostRun(found);
    })();
  }, [ghostRunId]);

  const handleFinishConfirmed = () => {
    router.replace('/summary');
  };

  const isActive = state.status === 'active';
  const isPaused = state.status === 'paused';
  const polylineColor = isPaused ? '#C8A027' : '#4ADE80';

  // Compute ghost's expected distance at the current elapsed time
  const ghostDistanceAtTime = (() => {
    if (!ghostRun || ghostRun.elapsedMs === 0) return 0;
    const ghostRate = ghostRun.distanceMeters / ghostRun.elapsedMs; // m/ms
    return ghostRate * state.elapsedMs;
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* ── Map (top ~45%) ──────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <RouteMap
          coords={state.coords}
          style={styles.map}
          polylineColor={polylineColor}
          ghostCoords={ghostRun?.coords as Coord[] | undefined}
        />

        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            isPaused ? styles.statusBadgePaused : styles.statusBadgeActive,
          ]}
        >
          <Text style={styles.statusDot}>{isActive ? '●' : '⏸'}</Text>
          <Text style={styles.statusText}>
            {isActive ? 'TRACKING' : 'PAUSED'}
          </Text>
        </View>

        {/* Ghost run badge */}
        {ghostRun && (
          <View style={styles.ghostBadge}>
            <Text style={styles.ghostBadgeText}>👻 GHOST RUN</Text>
          </View>
        )}

        {/* Weak GPS warning */}
        {gpsWeak && (
          <View style={styles.gpsBadge}>
            <Text style={styles.gpsText}>⚠ GPS WEAK</Text>
          </View>
        )}

        {/* Ghost AHEAD/BEHIND overlay */}
        {ghostRun && (
          <GhostOverlay
            ghostDistanceAtTime={ghostDistanceAtTime}
            liveDistance={state.distanceMeters}
          />
        )}
      </View>

      {/* ── Metrics ─────────────────────────────────────────── */}
      <View style={styles.metricsSection}>
        {/* Primary: Distance */}
        <Text style={[styles.distanceValue, isPaused && styles.dimmed]}>
          {formatDistance(state.distanceMeters)}
          <Text style={[styles.distanceUnit, isPaused && styles.dimmedUnit]}> KM</Text>
        </Text>

        {/* Secondary: Duration + Pace */}
        <View style={styles.secondaryRow}>
          <View style={styles.secondaryItem}>
            <Text style={[styles.secondaryValue, isPaused && styles.dimmed]}>
              {formatDuration(state.elapsedMs)}
            </Text>
            <Text style={styles.secondaryLabel}>DURATION</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.secondaryItem}>
            <Text style={[styles.secondaryValue, isPaused && styles.dimmed]}>
              {formatPace(state.distanceMeters, state.elapsedMs)}
            </Text>
            <Text style={styles.secondaryLabel}>AVG PACE /KM</Text>
          </View>
        </View>
      </View>

      {/* ── Controls ────────────────────────────────────────── */}
      <View style={styles.controlsSection}>
        <RunControls onFinishConfirmed={handleFinishConfirmed} />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111418',
  },

  // ── Map ─────────────────────────────────────────────────
  mapContainer: {
    flex: 45,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
    borderRadius: 0,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(17, 20, 24, 0.82)',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  statusBadgePaused: {
    backgroundColor: '#F5A623',
  },
  statusDot: {
    fontSize: 11,
    color: '#4ADE80',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  ghostBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderWidth: 1,
    borderColor: '#F5A623',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ghostBadgeText: {
    color: '#F5A623',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gpsBadge: {
    position: 'absolute',
    top: 54,
    right: 16,
    backgroundColor: 'rgba(245, 166, 35, 0.18)',
    borderWidth: 1,
    borderColor: '#F5A623',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gpsText: {
    color: '#F5A623',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // ── Metrics ──────────────────────────────────────────────
  metricsSection: {
    flex: 35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  distanceValue: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 80,
  },
  distanceUnit: {
    fontSize: 28,
    fontWeight: '600',
    color: '#8A8A9A',
    letterSpacing: 0,
  },
  dimmed: { color: '#555566' },
  dimmedUnit: { color: '#333344' },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  secondaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  secondaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  secondaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8A8A9A',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A2D35',
    marginHorizontal: 16,
  },

  // ── Controls ─────────────────────────────────────────────
  controlsSection: {
    flex: 20,
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'android' ? 8 : 0,
  },
});
