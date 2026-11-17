import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasteryPill } from '@/components/MasteryPill';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getVerseText } from '@/lib/bible';
import {
  hapticLight,
  hapticMedium,
  hapticSelection,
  hapticSuccess,
} from '@/lib/haptics';
import { previewIntervalLabels } from '@/lib/sm2';
import { useAppStore } from '@/store/useAppStore';
import type { MemorizedVerse, ReviewRating } from '@/types/models';

export default function DailyReviewScreen() {
  const { colors, verseTypography } = useAppTheme();
  const translation = useAppStore((s) => s.settings.translation);
  const getDueVerses = useAppStore((s) => s.getDueVerses);
  const recordVerseReview = useAppStore((s) => s.recordVerseReview);

  // Initialize review queue
  const initialDue = useMemo(() => getDueVerses(), [getDueVerses]);
  const [queue, setQueue] = useState<MemorizedVerse[]>(initialDue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);

  const currentVerse = queue[currentIndex];

  const fullText = useMemo(() => {
    if (!currentVerse) return '';
    return getVerseText(
      translation,
      currentVerse.bookIndex,
      currentVerse.chapter,
      currentVerse.verseStart,
      currentVerse.verseEnd
    );
  }, [currentVerse, translation]);

  const words = useMemo(() => fullText.split(/\s+/).filter(Boolean), [fullText]);

  const intervalPreviews = useMemo(() => {
    return currentVerse ? previewIntervalLabels(currentVerse) : null;
  }, [currentVerse]);

  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  const handleSpeak = () => {
    if (!currentVerse) return;
    if (speaking) {
      Speech.stop().catch(() => {});
      setSpeaking(false);
    } else {
      setSpeaking(true);
      Speech.speak(`${currentVerse.reference}. ${fullText}`, {
        language: 'en-US',
        rate: 0.9,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  };

  const handleNextHint = () => {
    hapticLight();
    setHintCount((c) => Math.min(words.length, c + 1));
  };

  const handleRating = async (rating: ReviewRating) => {
    if (!currentVerse) return;

    if (rating === 'again') hapticLight();
    else if (rating === 'hard') hapticMedium();
    else hapticSuccess();

    await recordVerseReview(currentVerse.id, rating, 'review');
    setSessionCompletedCount((c) => c + 1);
    setRevealed(false);
    setHintCount(0);
    setSpeaking(false);
    Speech.stop().catch(() => {});

    if (rating === 'again') {
      // Missed: push right back to the front / next in line of queue!
      const remaining = queue.slice(currentIndex + 1);
      setQueue([...remaining, currentVerse]);
      // keep currentIndex at 0 of remaining
      setCurrentIndex(0);
    } else {
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        // Queue finished
        hapticSuccess();
        setCurrentIndex(queue.length);
      }
    }
  };

  // Queue empty or finished
  if (!currentVerse || currentIndex >= queue.length) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.doneContainer}>
          <View style={[styles.doneIconCircle, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="checkmark-done" size={48} color={colors.success} />
          </View>
          <Text style={[styles.doneTitle, { color: colors.text }]}>Daily Review Complete!</Text>
          <Text style={[styles.doneSub, { color: colors.textSecondary }]}>
            You practiced {sessionCompletedCount} passage{sessionCompletedCount === 1 ? '' : 's'}.
            Your memory strength and study streak have been updated.
          </Text>

          <View style={styles.doneActions}>
            <Pressable
              onPress={() => router.push('/(tabs)/quiz')}
              style={[styles.donePrimaryBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="help-buoy-outline" size={18} color={colors.primaryText} />
              <Text style={[styles.donePrimaryText, { color: colors.primaryText }]}>
                Take a Quiz
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/(tabs)')}
              style={[styles.doneSecondaryBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const remainingCount = queue.length - currentIndex;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.container}>
        {/* Top Header Queue Tracker */}
        <View style={styles.progressHeader}>
          <View style={styles.progressTextRow}>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
              QUEUE: {remainingCount} REMAINING
            </Text>
            <MasteryPill mastery={currentVerse.mastery} />
          </View>
          <View style={[styles.queueTrack, { backgroundColor: colors.surfaceMuted }]}>
            <View
              style={[
                styles.queueFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.max(
                    10,
                    Math.round(
                      (sessionCompletedCount / (sessionCompletedCount + remainingCount)) * 100
                    )
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Card */}
          <Animated.View entering={FadeIn.duration(200)}>
            <View
              style={[
                styles.reviewCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.refText, { color: colors.text }]}>
                    {currentVerse.reference}
                  </Text>
                  <Text style={[styles.transSub, { color: colors.textMuted }]}>
                    {translation} • Repetitions: {currentVerse.repetitions}
                  </Text>
                </View>

                <Pressable
                  onPress={handleSpeak}
                  style={[styles.audioPill, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons
                    name={speaking ? 'stop-circle' : 'volume-high-outline'}
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.audioPillText, { color: colors.primary }]}>
                    {speaking ? 'Stop' : 'Listen'}
                  </Text>
                </Pressable>
              </View>

              {/* Passage text or recitation prompt */}
              {revealed ? (
                <View style={{ gap: 10 }}>
                  <Text
                    style={[
                      styles.fullPassage,
                      {
                        color: colors.text,
                        fontSize: verseTypography.fontSize,
                        lineHeight: verseTypography.lineHeight + 4,
                      },
                    ]}>
                    “{fullText}”
                  </Text>
                  {Boolean(currentVerse.notes) && (
                    <View
                      style={{
                        padding: 10,
                        backgroundColor: colors.surfaceMuted,
                        borderRadius: 10,
                        borderLeftWidth: 3,
                        borderLeftColor: colors.primary,
                      }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                        MY NOTES:
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                        {currentVerse.notes}
                      </Text>
                    </View>
                  )}
                </View>
              ) : hintCount > 0 ? (
                <View style={styles.hintContainer}>
                  <Text
                    style={[
                      styles.hintText,
                      {
                        color: colors.text,
                        fontSize: verseTypography.fontSize,
                        lineHeight: verseTypography.lineHeight + 4,
                      },
                    ]}>
                    “{words.slice(0, hintCount).join(' ')}
                    <Text style={{ color: colors.textMuted }}> ...</Text>”
                  </Text>
                </View>
              ) : (
                <View style={styles.promptState}>
                  <Ionicons name="sparkles-outline" size={36} color={colors.accent} />
                  <Text style={[styles.promptTitle, { color: colors.text }]}>
                    Recite this passage from memory
                  </Text>
                  <Text style={[styles.promptSub, { color: colors.textSecondary }]}>
                    Take a moment to recall the words. Tap “Hint 1 Word” if you get stuck, or
                    “Show Passage” when ready.
                  </Text>
                </View>
              )}

              {/* Reveal & Hint Action row */}
              <View style={styles.cardBottomActions}>
                <Pressable
                  onPress={handleNextHint}
                  style={[styles.hintBtn, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="bulb-outline" size={17} color={colors.text} />
                  <Text style={[styles.hintBtnText, { color: colors.text }]}>
                    Hint 1 Word ({hintCount}/{words.length})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    hapticSelection();
                    setRevealed((v) => !v);
                  }}
                  style={[
                    styles.revealBtn,
                    { backgroundColor: revealed ? colors.surfaceMuted : colors.primary },
                  ]}>
                  <Ionicons
                    name={revealed ? 'eye-off-outline' : 'eye-outline'}
                    size={17}
                    color={revealed ? colors.text : colors.primaryText}
                  />
                  <Text
                    style={[
                      styles.revealBtnText,
                      { color: revealed ? colors.text : colors.primaryText },
                    ]}>
                    {revealed ? 'Hide Passage' : 'Show Passage'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* SM-2 Self Rating Controls */}
          <Animated.View entering={FadeInDown.duration(200)} style={styles.ratingSection}>
            <Text style={[styles.ratingKicker, { color: colors.textSecondary }]}>
              RATE YOUR RECALL
            </Text>

            <View style={styles.ratingGrid}>
              <Pressable
                onPress={() => handleRating('again')}
                style={[styles.rateCard, { backgroundColor: colors.dangerSoft }]}>
                <Text style={[styles.rateName, { color: colors.danger }]}>Again</Text>
                <Text style={[styles.rateInterval, { color: colors.danger }]}>
                  {intervalPreviews?.again ?? 'Now'}
                </Text>
                <Text style={[styles.rateHint, { color: colors.danger }]}>Front of queue</Text>
              </Pressable>

              <Pressable
                onPress={() => handleRating('hard')}
                style={[styles.rateCard, { backgroundColor: colors.warningSoft }]}>
                <Text style={[styles.rateName, { color: colors.warning }]}>Hard</Text>
                <Text style={[styles.rateInterval, { color: colors.warning }]}>
                  {intervalPreviews?.hard ?? '1d'}
                </Text>
                <Text style={[styles.rateHint, { color: colors.warning }]}>Struggled</Text>
              </Pressable>

              <Pressable
                onPress={() => handleRating('good')}
                style={[styles.rateCard, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.rateName, { color: colors.primary }]}>Good</Text>
                <Text style={[styles.rateInterval, { color: colors.primary }]}>
                  {intervalPreviews?.good ?? '6d'}
                </Text>
                <Text style={[styles.rateHint, { color: colors.primary }]}>Correct</Text>
              </Pressable>

              <Pressable
                onPress={() => handleRating('easy')}
                style={[styles.rateCard, { backgroundColor: colors.successSoft }]}>
                <Text style={[styles.rateName, { color: colors.success }]}>Easy</Text>
                <Text style={[styles.rateInterval, { color: colors.success }]}>
                  {intervalPreviews?.easy ?? '12d'}
                </Text>
                <Text style={[styles.rateHint, { color: colors.success }]}>Instant</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  progressHeader: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10, gap: 8 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.9 },
  queueTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  queueFill: { height: '100%', borderRadius: 999 },
  scroll: { padding: 18, paddingTop: 4, gap: 16, paddingBottom: 32 },
  reviewCard: { borderRadius: 22, borderWidth: 1, padding: 20, gap: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  refText: { fontSize: 22, fontWeight: '800' },
  transSub: { fontSize: 12.5, marginTop: 2 },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  audioPillText: { fontSize: 13, fontWeight: '700' },
  promptState: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  promptTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  promptSub: { fontSize: 13.5, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  fullPassage: { fontFamily: 'serif' },
  hintContainer: { paddingVertical: 8 },
  hintText: { fontFamily: 'serif' },
  cardBottomActions: { flexDirection: 'row', gap: 10 },
  hintBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  hintBtnText: { fontSize: 13, fontWeight: '700' },
  revealBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  revealBtnText: { fontSize: 13, fontWeight: '700' },
  ratingSection: { gap: 10 },
  ratingKicker: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.9, textAlign: 'center' },
  ratingGrid: { flexDirection: 'row', gap: 8 },
  rateCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 2,
  },
  rateName: { fontSize: 15, fontWeight: '800' },
  rateInterval: { fontSize: 13, fontWeight: '700' },
  rateHint: { fontSize: 10, fontWeight: '600', opacity: 0.8 },
  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  doneIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  doneTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  doneSub: { fontSize: 14.5, textAlign: 'center', lineHeight: 21, maxWidth: 320 },
  doneActions: { width: '100%', gap: 10, marginTop: 12 },
  donePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
  },
  donePrimaryText: { fontSize: 15, fontWeight: '800' },
  doneSecondaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
});
