// app/index.tsx
// Pre-run / Home screen — engagement dashboard with streak, XP, weekly ring,
// daily challenge, ghost-run selection modal, and START RUN button.

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import { useRun } from '../src/context/RunContext';
import { useGamification } from '../src/context/GamificationContext';
import { getRunHistory, type RunRecord } from '../src/storage/runStorage';
import { StreakBadge } from '../src/components/StreakBadge';
import { XpBar } from '../src/components/XpBar';
import { WeeklyRing } from '../src/components/WeeklyRing';
import { ChallengeChip } from '../src/components/ChallengeChip';
import { formatDistance, formatDuration } from '../src/utils/format';

// Map takes the top 38% of the screen — fixed pixels so it never collapses
const MAP_HEIGHT = Math.round(Dimensions.get('window').height * 0.38);

// ─── Dark map style ───────────────────────────────────────────────────────────
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1e24' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
];

export default function HomeScreen() {
  const router  = useRouter();
  const { startRun, resetRun } = useRun();
  const { profile, isLoaded } = useGamification();
  const mapRef  = useRef<MapView>(null);

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Ghost run modal state
  const [ghostModalVisible, setGhostModalVisible] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);
  const [selectedGhost, setSelectedGhost] = useState<RunRecord | null>(null);

  // Check location permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (granted) {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } catch (_) {}
      }
    })();
  }, []);

  // Fly map to user location as soon as GPS arrives (fixes blank/wrong-region map)
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        600,
      );
    }
  }, [userLocation]);

  // Load recent runs for ghost selection
  const loadRecentRuns = useCallback(async () => {
    const runs = await getRunHistory(10);
    setRecentRuns(runs.filter(r => r.coords.length >= 2));
  }, []);

  const handleRequestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);
    if (granted) {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (_) {}
    }
  };

  const handleReCenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        400
      );
    }
  };

  const handleStartRun = () => {
    resetRun();
    startRun();
    if (selectedGhost) {
      router.push({ pathname: '/run', params: { ghostRunId: selectedGhost.id } });
    } else {
      router.push('/run');
    }
    setSelectedGhost(null);
  };

  const handleOpenGhostModal = async () => {
    await loadRecentRuns();
    setGhostModalVisible(true);
  };

  const handleSelectGhost = (run: RunRecord) => {
    setSelectedGhost(run);
    setGhostModalVisible(false);
  };

  const handleClearGhost = () => setSelectedGhost(null);

  const gpsReady = permissionGranted === true;
  const defaultRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : { latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* ── Map — fixed height so it never eats the bottom panel ── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={defaultRegion}
          customMapStyle={DARK_MAP_STYLE}
          showsUserLocation={gpsReady}
          showsMyLocationButton={false}
          showsCompass={false}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
        />

        {/* PLEXQO — RUN badge */}
        <View style={styles.headerBadge}>
          <Text style={styles.headerBrand}>PLEXQO</Text>
          <Text style={styles.headerDash}> — </Text>
          <Text style={styles.headerRun}>RUN</Text>
        </View>

        {/* GPS status */}
        <View style={styles.gpsBadge}>
          <View style={[styles.gpsDot, !gpsReady && styles.gpsDotOff]} />
          <Text style={[styles.gpsText, !gpsReady && styles.gpsTextOff]}>
            {permissionGranted === null
              ? 'CHECKING GPS…'
              : gpsReady
              ? 'GPS READY'
              : 'GPS UNAVAILABLE'}
          </Text>
        </View>

        {/* Badges button */}
        <TouchableOpacity
          style={styles.badgesBtn}
          onPress={() => router.push('/badges')}
          activeOpacity={0.8}
        >
          <Text style={styles.badgesBtnText}>🏅 Badges</Text>
        </TouchableOpacity>

        {/* RE-CENTER */}
        {gpsReady && (
          <TouchableOpacity
            style={styles.reCenterBtn}
            onPress={handleReCenter}
            activeOpacity={0.8}
          >
            <Text style={styles.reCenterText}>▲ RE-CENTER</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Bottom panel: flex:1 fills remaining space ────────── */}
      <View style={styles.bottomPanel}>

        {/* Scrollable dashboard — sits above the pinned button row */}
        <ScrollView
          style={styles.dashboardScroll}
          contentContainerStyle={styles.dashboardContent}
          showsVerticalScrollIndicator={false}
        >
          {/* "Ready to run?" label */}
          <Text style={styles.readyLabel}>Ready to run?</Text>

          {/* Gamification widgets */}
          {isLoaded && (
            <View style={styles.dashboard}>
              <StreakBadge
                streak={profile.streak}
                archetype={profile.archetype}
                streakFreezes={profile.streakFreezes}
              />
              <XpBar totalXp={profile.xp} />
              <WeeklyRing
                weeklyDistanceKm={profile.weeklyDistanceSoFarM / 1000}
                goalKm={profile.weeklyGoalKm}
                weeklyRunCount={profile.weeklyRunCount}
              />
              <ChallengeChip challenge={profile.dailyChallenge} type="daily" />
              {profile.weeklyChallenge && !profile.weeklyChallenge.completed && (
                <ChallengeChip challenge={profile.weeklyChallenge} type="weekly" />
              )}
            </View>
          )}

          {/* Ghost run row */}
          <View style={styles.ghostRow}>
            {selectedGhost ? (
              <View style={styles.ghostSelected}>
                <Text style={styles.ghostSelectedIcon}>👻</Text>
                <View style={styles.ghostSelectedInfo}>
                  <Text style={styles.ghostSelectedLabel}>Ghost run active</Text>
                  <Text style={styles.ghostSelectedSub}>
                    {formatDistance(selectedGhost.distanceMeters)} · {formatDuration(selectedGhost.elapsedMs)}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClearGhost} style={styles.ghostClear}>
                  <Text style={styles.ghostClearText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={handleOpenGhostModal}
                activeOpacity={0.8}
              >
                <Text style={styles.ghostBtnIcon}>👻</Text>
                <Text style={styles.ghostBtnText}>Race your past self</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* ── Pinned action area — always visible ──────────────── */}
        <View style={styles.actionArea}>
          {/* Enable location if denied */}
          {permissionGranted === false && (
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={handleRequestPermission}
              activeOpacity={0.85}
            >
              <Text style={styles.permissionBtnText}>Enable Location</Text>
            </TouchableOpacity>
          )}

          {/* ★ START RUN — always visible, always tappable ★ */}
          <TouchableOpacity
            style={[
              styles.startBtn,
              permissionGranted === false && styles.startBtnDisabled,
            ]}
            onPress={handleStartRun}
            disabled={permissionGranted === false}
            activeOpacity={0.85}
            accessibilityLabel="Start run"
          >
            <Text style={styles.startBtnText}>
              {selectedGhost ? '👻 START GHOST RUN' : 'START RUN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Ghost Run Selection Modal ────────────────────────── */}
      <Modal
        visible={ghostModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setGhostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👻 Ghost a past run</Text>
              <TouchableOpacity
                onPress={() => setGhostModalVisible(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Race your own pace from a previous run.</Text>

            {recentRuns.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>
                  No recorded runs yet. Complete a run first!
                </Text>
              </View>
            ) : (
              <FlatList
                data={recentRuns}
                keyExtractor={r => r.id}
                style={styles.runList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.runItem}
                    onPress={() => handleSelectGhost(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.runItemLeft}>
                      <Text style={styles.runItemDate}>
                        {new Date(item.date).toLocaleDateString(undefined, {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.runItemStats}>
                        {formatDistance(item.distanceMeters)} · {formatDuration(item.elapsedMs)}
                      </Text>
                    </View>
                    <Text style={styles.runItemArrow}>›</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111418',
  },

  // ── Map ── fixed height via Dimensions so it never collapses ─
  mapContainer: {
    height: MAP_HEIGHT,
    position: 'relative',
    backgroundColor: '#1a1e24',
  },

  headerBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 20, 24, 0.82)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  headerBrand: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  headerDash: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8A8A9A',
  },
  headerRun: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4ADE80',
    letterSpacing: 1.5,
  },
  gpsBadge: {
    position: 'absolute',
    top: 52,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(17, 20, 24, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  gpsDotOff: { backgroundColor: '#F5A623' },
  gpsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ADE80',
    letterSpacing: 0.8,
  },
  gpsTextOff: { color: '#F5A623' },
  badgesBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(17, 20, 24, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A3D45',
  },
  badgesBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  reCenterBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(17, 20, 24, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A3D45',
  },
  reCenterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Bottom panel — takes all remaining space ──────────────
  bottomPanel: {
    flex: 1,
    backgroundColor: '#111418',
  },

  // Scrollable area above the start button
  dashboardScroll: {
    flex: 1,
  },
  dashboardContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },

  readyLabel: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  dashboard: {
    gap: 10,
  },

  ghostRow: {
    marginTop: 2,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1F26',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  ghostBtnIcon: { fontSize: 18 },
  ghostBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A9A',
  },
  ghostSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F5A623',
  },
  ghostSelectedIcon: { fontSize: 20 },
  ghostSelectedInfo: { flex: 1 },
  ghostSelectedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F5A623',
  },
  ghostSelectedSub: {
    fontSize: 11,
    color: '#8A8A9A',
    marginTop: 1,
  },
  ghostClear: { padding: 4 },
  ghostClearText: {
    fontSize: 14,
    color: '#8A8A9A',
    fontWeight: '600',
  },

  // ── Pinned action area — always at the bottom, always visible ─
  actionArea: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 20 : 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1C1F26',
  },

  permissionBtn: {
    backgroundColor: '#F5A623',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#111418',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },

  startBtn: {
    backgroundColor: '#4ADE80',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  startBtnDisabled: {
    backgroundColor: '#2A2D35',
    shadowOpacity: 0,
    elevation: 0,
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111418',
    letterSpacing: 2,
  },

  // ── Ghost modal ───────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#111418',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalClose: { padding: 4 },
  modalCloseText: {
    fontSize: 16,
    color: '#8A8A9A',
    fontWeight: '600',
  },
  modalSub: {
    fontSize: 12,
    color: '#8A8A9A',
    marginBottom: 16,
  },
  runList: { maxHeight: 360 },
  runItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D35',
  },
  runItemLeft: { flex: 1, gap: 3 },
  runItemDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  runItemStats: {
    fontSize: 11,
    color: '#8A8A9A',
  },
  runItemArrow: {
    fontSize: 20,
    color: '#4ADE80',
    fontWeight: '300',
  },
  modalEmpty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: '#8A8A9A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
