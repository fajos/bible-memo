import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddToDeckModal } from '@/components/AddToDeckModal';
import { MasteryPill } from '@/components/MasteryPill';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getVerseOfTheDay, getVerseText } from '@/lib/bible';
import { useAppStore } from '@/store/useAppStore';

export default function HomeScreen() {
  const { colors, verseTypography } = useAppTheme();
  const verses = useAppStore((s) => s.verses);
  const settings = useAppStore((s) => s.settings);
  const streak = useAppStore((s) => s.streak);
  const priorityQueueIds = useAppStore((s) => s.priorityQueueIds);
  const getDueVerses = useAppStore((s) => s.getDueVerses);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [speaking, setSpeaking] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dueVerses = getDueVerses();
  const learnedCount = verses.filter((v) => v.learned).length;
  const votd = getVerseOfTheDay(settings.translation);

  const weakestVerses = [...verses]
    .filter((v) => v.totalReviews > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  const focusList =
    weakestVerses.length > 0 ? weakestVerses : dueVerses.slice(0, 3);

  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  const toggleSpeakVotd = () => {
    if (speaking) {
      Speech.stop().catch(() => {});
      setSpeaking(false);
    } else {
      setSpeaking(true);
      Speech.speak(`${votd.reference}. ${votd.text}`, {
        language: 'en-US',
        rate: 0.92,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  };

  const toggleTranslation = () => {
    const next = settings.translation === 'KJV' ? 'WEB' : 'KJV';
    void updateSettings({ translation: next });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.kicker, { color: colors.textMuted }]}>SELAH • SCRIPTURE MEMORY</Text>
            <Text style={[styles.heading, { color: colors.text }]}>Daily Sanctuary</Text>
          </View>
          <View style={styles.topPills}>
            <Pressable
              onPress={toggleTranslation}
              style={[
                styles.transPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.transPillText, { color: colors.primary }]}>
                {settings.translation}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/progress')}
              style={[
                styles.streakPill,
                { backgroundColor: colors.accentSoft, borderColor: `${colors.accent}40` },
              ]}>
              <Ionicons name="flame" size={16} color={colors.accent} />
              <Text style={[styles.streakText, { color: colors.accent }]}>
                {streak.currentStreak}d
              </Text>
            </Pressable>
          </View>
        </View>

        {streak.freezeUsedRecently && !streak.practicedToday && (
          <View
            style={[
              styles.freezeBanner,
              { backgroundColor: colors.primarySoft, borderColor: `${colors.primary}40` },
            ]}>
            <Ionicons name="snow-outline" size={18} color={colors.primary} />
            <Text style={[styles.freezeText, { color: colors.primary }]}>
              Gentle freeze protected your {streak.currentStreak}-day streak! Review today to keep it growing.
            </Text>
          </View>
        )}

        {/* Due Today Hero Card */}
        <Animated.View entering={FadeInUp.duration(300)}>
          <View
            style={[
              styles.heroCard,
              { backgroundColor: colors.primary },
            ]}>
            <View style={styles.heroTop}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={14} color="#FFF" />
                <Text style={styles.heroBadgeText}>
                  {dueVerses.length > 0 ? 'SPACED REPETITION' : 'ALL CAUGHT UP'}
                </Text>
              </View>
              <Text style={styles.heroStat}>
                {learnedCount}/{verses.length} learned
              </Text>
            </View>

            <Text style={styles.heroCount}>
              {dueVerses.length} {dueVerses.length === 1 ? 'verse' : 'verses'} due today
            </Text>
            <Text style={styles.heroSub}>
              {dueVerses.length > 0
                ? priorityQueueIds.length > 0
                  ? `${priorityQueueIds.length} missed quiz verse${priorityQueueIds.length === 1 ? '' : 's'} prioritized at the front.`
                  : 'SM-2 schedules each passage right before it fades from memory.'
                : 'You finished every scheduled review for today. Try a quiz or learn a new verse!'}
            </Text>

            <View style={styles.heroActions}>
              {dueVerses.length > 0 ? (
                <Pressable
                  onPress={() => router.push('/review')}
                  style={[styles.heroPrimaryBtn, { backgroundColor: '#FFFDF9' }]}>
                  <Ionicons name="play" size={18} color={colors.primary} />
                  <Text style={[styles.heroPrimaryText, { color: colors.primary }]}>
                    Start Daily Review
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => router.push('/(tabs)/library')}
                  style={[styles.heroPrimaryBtn, { backgroundColor: '#FFFDF9' }]}>
                  <Ionicons name="book-outline" size={18} color={colors.primary} />
                  <Text style={[styles.heroPrimaryText, { color: colors.primary }]}>
                    Browse Verse Decks
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Verse of the Day */}
        <Animated.View entering={FadeInUp.delay(80).duration(300)}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.cardHeader}>
              <View style={styles.votdLabelRow}>
                <Ionicons name="sunny" size={17} color={colors.accent} />
                <Text style={[styles.cardKicker, { color: colors.accent }]}>VERSE OF THE DAY</Text>
              </View>
              <Text style={[styles.refBadge, { color: colors.primary }]}>
                {votd.reference} ({settings.translation})
              </Text>
            </View>

            <Text
              style={[
                styles.votdText,
                {
                  color: colors.text,
                  fontSize: verseTypography.fontSize,
                  lineHeight: verseTypography.lineHeight,
                },
              ]}>
              “{votd.text}”
            </Text>

            <View style={styles.votdActions}>
              <Pressable
                onPress={toggleSpeakVotd}
                style={[styles.iconAction, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons
                  name={speaking ? 'stop-circle-outline' : 'volume-high-outline'}
                  size={18}
                  color={colors.text}
                />
                <Text style={[styles.iconActionText, { color: colors.text }]}>
                  {speaking ? 'Stop' : 'Listen'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setAddModalOpen(true)}
                style={[styles.iconAction, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="bookmark-outline" size={18} color={colors.text} />
                <Text style={[styles.iconActionText, { color: colors.text }]}>Save</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/share-card',
                    params: {
                      bookIndex: String(votd.bookIndex),
                      chapter: String(votd.chapter),
                      verseStart: String(votd.verseStart),
                      verseEnd: String(votd.verseEnd),
                    },
                  })
                }
                style={[styles.iconAction, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                <Text style={[styles.iconActionText, { color: colors.primary }]}>Share Card</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {toast && (
          <View style={[styles.toast, { backgroundColor: colors.successSoft }]}>
            <Text style={{ color: colors.success, fontWeight: '600', fontSize: 13 }}>{toast}</Text>
          </View>
        )}

        {/* Quick Practice */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Practice</Text>
        <View style={styles.quickGrid}>
          <Pressable
            onPress={() => router.push({ pathname: '/trivia', params: { mode: 'daily' } })}
            style={[
              styles.quickCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={[styles.quickIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="trophy-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>Daily Challenge</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>
              5 Bible trivia questions
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push({ pathname: '/verse-quiz', params: { mode: 'mixed' } })
            }
            style={[
              styles.quickCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={[styles.quickIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="extension-puzzle-outline" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>Verse Quiz</Text>
            <Text style={[styles.quickSub, { color: colors.textSecondary }]}>
              Blanks, order & references
            </Text>
          </Pressable>
        </View>

        {/* Focus Next */}
        {focusList.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {weakestVerses.length > 0 ? 'Strengthen Weakest Verses' : 'Ready to Learn'}
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/library')}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                  View all
                </Text>
              </Pressable>
            </View>

            {focusList.map((v) => {
              const snippet = getVerseText(
                settings.translation,
                v.bookIndex,
                v.chapter,
                v.verseStart,
                v.verseEnd
              );
              return (
                <Pressable
                  key={v.id}
                  onPress={() =>
                    router.push({ pathname: '/learn/[verseId]', params: { verseId: v.id } })
                  }
                  style={[
                    styles.verseRow,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.verseRowTop}>
                      <Text style={[styles.verseRef, { color: colors.text }]}>{v.reference}</Text>
                      <MasteryPill mastery={v.mastery} />
                    </View>
                    <Text
                      style={[styles.verseSnippet, { color: colors.textSecondary }]}
                      numberOfLines={2}>
                      {snippet}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      <AddToDeckModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        bookIndex={votd.bookIndex}
        chapter={votd.chapter}
        verseStart={votd.verseStart}
        verseEnd={votd.verseEnd}
        onAdded={(deckName, exists) => {
          setToast(
            exists
              ? `${votd.reference} is already in ${deckName}.`
              : `Added ${votd.reference} to ${deckName}!`
          );
          setTimeout(() => setToast(null), 3000);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 36, gap: 14 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  heading: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  topPills: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  transPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  transPillText: { fontSize: 12, fontWeight: '800' },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  streakText: { fontSize: 13, fontWeight: '800' },
  freezeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  freezeText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  heroCard: {
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroStat: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },
  heroCount: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.86)', fontSize: 13.5, lineHeight: 19, marginTop: 6 },
  heroActions: { marginTop: 16, flexDirection: 'row' },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  heroPrimaryText: { fontSize: 15, fontWeight: '800' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  votdLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.9 },
  refBadge: { fontSize: 13, fontWeight: '700' },
  votdText: { fontFamily: 'serif', marginBottom: 14 },
  votdActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  iconAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
  },
  iconActionText: { fontSize: 13, fontWeight: '700' },
  toast: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: { fontSize: 15, fontWeight: '700' },
  quickSub: { fontSize: 12.5, marginTop: 3 },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  verseRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  verseRef: { fontSize: 15, fontWeight: '700' },
  verseSnippet: { fontSize: 13.5, lineHeight: 19 },
});
