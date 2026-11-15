import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasteryPill } from '@/components/MasteryPill';
import { BADGE_DEFINITIONS } from '@/data/badges';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/store/useAppStore';

export default function ProgressScreen() {
  const { colors } = useAppTheme();
  const verses = useAppStore((s) => s.verses);
  const quizSessions = useAppStore((s) => s.quizSessions);
  const dailyActivity = useAppStore((s) => s.dailyActivity);
  const badges = useAppStore((s) => s.badges);
  const streak = useAppStore((s) => s.streak);

  const learnedCount = verses.filter((v) => v.learned).length;
  const avgMastery =
    verses.length > 0
      ? Math.round(verses.reduce((acc, v) => acc + v.mastery, 0) / verses.length)
      : 0;

  const totalQuizQuestions = quizSessions.reduce((acc, q) => acc + q.total, 0);
  const totalQuizCorrect = quizSessions.reduce((acc, q) => acc + q.score, 0);
  const quizAccuracy =
    totalQuizQuestions > 0 ? Math.round((totalQuizCorrect / totalQuizQuestions) * 100) : 0;

  const totalReviews = dailyActivity.reduce((acc, d) => acc + d.reviewsCount, 0);

  const unlockedSet = new Set(badges.map((b) => b.id));

  const weakestVerses = [...verses]
    .filter((v) => v.totalReviews > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 5);

  const masteredOrActive = [...verses]
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 8);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Progress & Mastery</Text>

        {/* Streak Card with Gentle Freeze */}
        <View
          style={[
            styles.streakCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={styles.streakTop}>
            <View style={styles.streakMain}>
              <View style={[styles.flameCircle, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="flame" size={28} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.streakNum, { color: colors.text }]}>
                  {streak.currentStreak} day{streak.currentStreak === 1 ? '' : 's'}
                </Text>
                <Text style={[styles.streakSub, { color: colors.textSecondary }]}>
                  Best: {streak.longestStreak} days •{' '}
                  {streak.practicedToday ? 'Practiced today' : 'Review today to grow'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.weekRow}>
            {streak.weekDays.map((day) => (
              <View key={day.dateKey} style={styles.weekCol}>
                <View
                  style={[
                    styles.weekDot,
                    {
                      backgroundColor: day.active ? colors.accent : colors.surfaceMuted,
                      borderColor: day.isToday ? colors.primary : 'transparent',
                      borderWidth: day.isToday ? 2 : 0,
                    },
                  ]}>
                  {day.active && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={[styles.weekLabel, { color: colors.textMuted }]}>{day.label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.freezeRow, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="snow-outline" size={16} color={colors.primary} />
            <Text style={[styles.freezeInfo, { color: colors.primary }]}>
              {streak.freezeUsedRecently
                ? 'Gentle freeze saved your streak across a 1-day break.'
                : 'Gentle freeze active: one missed day won’t wipe your streak.'}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{learnedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Verses Learned
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{avgMastery}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Mastery</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {totalQuizQuestions > 0 ? `${quizAccuracy}%` : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Quiz Accuracy</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalReviews}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Reviews</Text>
          </View>
        </View>

        {/* Milestone Badges */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Milestone Badges ({badges.length}/{BADGE_DEFINITIONS.length})
        </Text>
        <View style={styles.badgeGrid}>
          {BADGE_DEFINITIONS.map((b) => {
            const unlocked = unlockedSet.has(b.id);
            return (
              <View
                key={b.id}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: unlocked ? b.color : colors.border,
                    opacity: unlocked ? 1 : 0.58,
                  },
                ]}>
                <View
                  style={[
                    styles.badgeIcon,
                    { backgroundColor: unlocked ? `${b.color}20` : colors.surfaceMuted },
                  ]}>
                  <Ionicons
                    name={b.icon as never}
                    size={22}
                    color={unlocked ? b.color : colors.textMuted}
                  />
                </View>
                <Text style={[styles.badgeTitle, { color: colors.text }]}>{b.title}</Text>
                <Text style={[styles.badgeDesc, { color: colors.textSecondary }]}>
                  {b.description}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Weakest Verses */}
        {weakestVerses.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Weakest Verses</Text>
            {weakestVerses.map((v) => (
              <Pressable
                key={v.id}
                onPress={() =>
                  router.push({ pathname: '/learn/[verseId]', params: { verseId: v.id } })
                }
                style={[
                  styles.verseStatRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.verseRef, { color: colors.text }]}>{v.reference}</Text>
                  <Text style={[styles.verseMeta, { color: colors.textMuted }]}>
                    Reviews: {v.totalReviews} • Ease: {v.ease.toFixed(2)}
                  </Text>
                </View>
                <MasteryPill mastery={v.mastery} />
              </Pressable>
            ))}
          </>
        )}

        {/* Mastery per Verse */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mastery per Verse</Text>
        {masteredOrActive.map((v) => (
          <Pressable
            key={v.id}
            onPress={() =>
              router.push({ pathname: '/learn/[verseId]', params: { verseId: v.id } })
            }
            style={[
              styles.verseStatRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.masteryTop}>
                <Text style={[styles.verseRef, { color: colors.text }]}>{v.reference}</Text>
                <Text style={[styles.masteryPct, { color: colors.primary }]}>{v.mastery}%</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${v.mastery}%`,
                      backgroundColor: v.mastery >= 80 ? colors.success : colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, gap: 14, paddingBottom: 36 },
  title: { fontSize: 26, fontWeight: '800' },
  streakCard: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 14 },
  streakTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flameCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNum: { fontSize: 24, fontWeight: '800' },
  streakSub: { fontSize: 13, marginTop: 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  weekCol: { alignItems: 'center', gap: 5 },
  weekDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: { fontSize: 11, fontWeight: '700' },
  freezeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  freezeInfo: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48.4%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12.5, fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '48.4%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: { fontSize: 14, fontWeight: '800' },
  badgeDesc: { fontSize: 12, lineHeight: 16 },
  verseStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  verseRef: { fontSize: 15, fontWeight: '700' },
  verseMeta: { fontSize: 12, marginTop: 2 },
  masteryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  masteryPct: { fontSize: 13, fontWeight: '800' },
  barTrack: { height: 7, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
});
