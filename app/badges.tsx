// app/badges.tsx
// Badges gallery — shows all badges, locked and unlocked.

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGamification } from '../src/context/GamificationContext';
import { BadgeCard } from '../src/components/BadgeCard';
import { BADGE_CATALOGUE } from '../src/utils/gamification';

export default function BadgesScreen() {
  const router = useRouter();
  const { profile, isLoaded } = useGamification();

  const unlockedSet = useMemo(() => new Set(profile.unlockedBadges), [profile.unlockedBadges]);

  // Sort: unlocked first, then locked
  const sorted = useMemo(() => {
    return [...BADGE_CATALOGUE].sort((a, b) => {
      const aU = unlockedSet.has(a.id) ? 0 : 1;
      const bU = unlockedSet.has(b.id) ? 0 : 1;
      return aU - bU;
    });
  }, [unlockedSet]);

  const unlockedCount = unlockedSet.size;
  const totalCount    = BADGE_CATALOGUE.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🏅 BADGES</Text>
          <Text style={styles.headerSub}>
            {unlockedCount} / {totalCount} earned
          </Text>
        </View>

        {/* Spacer to centre the title */}
        <View style={styles.backBtn} />
      </View>

      {/* ── Progress bar ────────────────────────────────── */}
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round((unlockedCount / totalCount) * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressPct}>
          {Math.round((unlockedCount / totalCount) * 100)}%
        </Text>
      </View>

      {/* ── Badge list ──────────────────────────────────── */}
      <FlatList
        data={sorted}
        keyExtractor={b => b.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <BadgeCard
            badge={item}
            unlocked={unlockedSet.has(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111418',
  },

  // ── Header ────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4ADE80',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8A9A',
    marginTop: 2,
  },

  // ── Progress bar ──────────────────────────────────────
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#2A2D35',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 3,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ADE80',
    minWidth: 32,
    textAlign: 'right',
  },

  // ── List ──────────────────────────────────────────────
  list: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 16,
  },
});
