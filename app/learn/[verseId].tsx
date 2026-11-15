import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { MasteryPill } from '@/components/MasteryPill';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getVerseText } from '@/lib/bible';
import {
  buildBlankOptions,
  formatFirstLetterLine,
  selectBlankIndices,
  tokenizeVerse,
} from '@/lib/learnHelpers';
import { previewIntervalLabels } from '@/lib/sm2';
import { useAppStore } from '@/store/useAppStore';
import type { ReviewRating } from '@/types/models';

type Stage = 'read' | 'fill' | 'first_letter' | 'recite';

export default function LearnVerseScreen() {
  const { verseId } = useLocalSearchParams<{ verseId: string }>();
  const { colors, verseTypography } = useAppTheme();

  const verses = useAppStore((s) => s.verses);
  const translation = useAppStore((s) => s.settings.translation);
  const recordVerseReview = useAppStore((s) => s.recordVerseReview);

  const verse = verses.find((v) => v.id === verseId);
  const fullText = useMemo(() => {
    if (!verse) return '';
    return getVerseText(
      translation,
      verse.bookIndex,
      verse.chapter,
      verse.verseStart,
      verse.verseEnd
    );
  }, [verse, translation]);

  const tokens = useMemo(() => tokenizeVerse(fullText), [fullText]);
  const blankIndices = useMemo(
    () => selectBlankIndices(tokens, verse?.id ?? 'v'),
    [tokens, verse?.id]
  );

  const [stage, setStage] = useState<Stage>('read');
  const [speaking, setSpeaking] = useState(false);

  // Fill in blanks state
  const [blankStep, setBlankStep] = useState(0);
  const [filledWords, setFilledWords] = useState<Record<number, string>>({});
  const [wrongShake, setWrongShake] = useState(false);

  // First letter & Recite hints state
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [reciteRevealedCount, setReciteRevealedCount] = useState(0);
  const [reciteShowFull, setReciteShowFull] = useState(false);

  const fillOptions = useMemo(() => {
    if (stage !== 'fill' || blankIndices.length === 0 || blankStep >= blankIndices.length) {
      return [];
    }
    const targetIdx = blankIndices[blankStep];
    const allDeckWords = tokens.map((t) => t.clean);
    return buildBlankOptions(tokens, targetIdx, allDeckWords);
  }, [stage, blankStep, blankIndices, tokens]);

  const intervalPreviews = useMemo(() => {
    return verse ? previewIntervalLabels(verse) : null;
  }, [verse]);

  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  if (!verse) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Verse not found.</Text>
      </View>
    );
  }

  const toggleSpeak = () => {
    if (speaking) {
      Speech.stop().catch(() => {});
      setSpeaking(false);
    } else {
      setSpeaking(true);
      Speech.speak(`${verse.reference}. ${fullText}`, {
        language: 'en-US',
        rate: 0.9,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  };

  const handlePickBlankOption = (word: string) => {
    const targetIdx = blankIndices[blankStep];
    const targetToken = tokens[targetIdx];
    if (word.toLowerCase() === targetToken.clean.toLowerCase()) {
      setFilledWords((prev) => ({ ...prev, [targetIdx]: targetToken.clean }));
      if (blankStep + 1 < blankIndices.length) {
        setBlankStep((s) => s + 1);
      } else {
        // Step complete, advance to first-letter prompts
        setTimeout(() => setStage('first_letter'), 400);
      }
    } else {
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 500);
    }
  };

  const revealOneWord = () => {
    if (stage === 'first_letter') {
      const nextIdx = tokens.findIndex((t) => !revealedIndices.has(t.index));
      if (nextIdx !== -1) {
        setRevealedIndices((prev) => new Set([...prev, nextIdx]));
      }
    } else if (stage === 'recite') {
      setReciteRevealedCount((c) => Math.min(tokens.length, c + 1));
    }
  };

  const handleRate = async (rating: ReviewRating) => {
    await recordVerseReview(verse.id, rating, 'learn');
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Progress Track */}
      <View style={styles.stageTabs}>
        {(['read', 'fill', 'first_letter', 'recite'] as Stage[]).map((st, i) => {
          const active = stage === st;
          const labels = ['Read & Listen', 'Fill Blanks', 'First Letters', 'Recite'];
          return (
            <Pressable
              key={st}
              onPress={() => setStage(st)}
              style={[
                styles.stageTab,
                {
                  borderBottomColor: active ? colors.primary : 'transparent',
                },
              ]}>
              <Text
                style={[
                  styles.stageTabText,
                  { color: active ? colors.primary : colors.textMuted },
                ]}>
                {i + 1}. {labels[i]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header reference */}
        <View style={styles.refRow}>
          <View>
            <Text style={[styles.refText, { color: colors.text }]}>{verse.reference}</Text>
            <Text style={[styles.transLabel, { color: colors.textMuted }]}>
              {translation} • Due: {verse.dueDate}
            </Text>
          </View>
          <MasteryPill mastery={verse.mastery} />
        </View>

        {/* STAGE 1: READ AND LISTEN */}
        {stage === 'read' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.stageBody}>
            <View
              style={[
                styles.verseCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text
                style={[
                  styles.scriptureText,
                  {
                    color: colors.text,
                    fontSize: verseTypography.fontSize + 1,
                    lineHeight: verseTypography.lineHeight + 4,
                  },
                ]}>
                “{fullText}”
              </Text>

              <View style={styles.cardActionRow}>
                <Pressable
                  onPress={toggleSpeak}
                  style={[styles.audioBtn, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons
                    name={speaking ? 'stop-circle' : 'volume-high'}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.audioBtnText, { color: colors.primary }]}>
                    {speaking ? 'Stop Audio' : 'Listen to Audio'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/share-card',
                      params: {
                        bookIndex: String(verse.bookIndex),
                        chapter: String(verse.chapter),
                        verseStart: String(verse.verseStart),
                        verseEnd: String(verse.verseEnd),
                      },
                    })
                  }
                  style={[styles.shareBtn, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="share-social-outline" size={18} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => setStage('fill')}
              style={[styles.nextStageBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 16 }}>
                Step 2: Fill in the Blanks
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
            </Pressable>
          </Animated.View>
        )}

        {/* STAGE 2: FILL IN THE BLANKS */}
        {stage === 'fill' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.stageBody}>
            <View
              style={[
                styles.verseCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text
                style={[
                  styles.scriptureText,
                  {
                    color: colors.text,
                    fontSize: verseTypography.fontSize,
                    lineHeight: verseTypography.lineHeight + 4,
                  },
                ]}>
                {tokens.map((t) => {
                  const isBlank = blankIndices.includes(t.index);
                  const isTarget = blankIndices[blankStep] === t.index;
                  const isFilled = Boolean(filledWords[t.index]);

                  if (!isBlank) {
                    return <Text key={t.index}>{t.raw} </Text>;
                  }

                  if (isFilled) {
                    return (
                      <Text
                        key={t.index}
                        style={{ color: colors.success, fontWeight: '700' }}>
                        {t.prefixPunct}
                        {filledWords[t.index]}
                        {t.suffixPunct}{' '}
                      </Text>
                    );
                  }

                  return (
                    <Text
                      key={t.index}
                      style={[
                        styles.blankSlot,
                        {
                          color: isTarget ? colors.accent : colors.textMuted,
                          backgroundColor: isTarget ? colors.accentSoft : colors.surfaceMuted,
                        },
                      ]}>
                      {t.prefixPunct}
                      {isTarget ? ' ______ ' : ' ____ '}
                      {t.suffixPunct}{' '}
                    </Text>
                  );
                })}
              </Text>
            </View>

            <Text style={[styles.pickPrompt, { color: colors.textSecondary }]}>
              Choose the word for blank {blankStep + 1} of {blankIndices.length}:
            </Text>

            <View style={[styles.optionsGrid, wrongShake && { opacity: 0.6 }]}>
              {fillOptions.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => handlePickBlankOption(opt)}
                  style={[
                    styles.optBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <Text style={[styles.optBtnText, { color: colors.text }]}>{opt}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setStage('first_letter')}
              style={[styles.skipBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                Skip to Step 3 (First Letters)
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* STAGE 3: FIRST-LETTER PROMPTS */}
        {stage === 'first_letter' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.stageBody}>
            <View
              style={[
                styles.verseCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text
                style={[
                  styles.firstLetterText,
                  {
                    color: colors.text,
                    fontSize: verseTypography.fontSize,
                    lineHeight: verseTypography.lineHeight + 6,
                  },
                ]}>
                {formatFirstLetterLine(tokens, revealedIndices)}
              </Text>
            </View>

            <View style={styles.hintRow}>
              <Pressable
                onPress={revealOneWord}
                style={[styles.hintBtn, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="bulb-outline" size={18} color={colors.accent} />
                <Text style={{ color: colors.accent, fontWeight: '700' }}>
                  Reveal Next Word ({revealedIndices.size}/{tokens.length})
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setStage('recite')}
              style={[styles.nextStageBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 16 }}>
                Step 4: Recite from Memory
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
            </Pressable>
          </Animated.View>
        )}

        {/* STAGE 4: RECITE FROM MEMORY & SELF-RATE */}
        {stage === 'recite' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.stageBody}>
            <View
              style={[
                styles.verseCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {reciteShowFull ? (
                <Text
                  style={[
                    styles.scriptureText,
                    {
                      color: colors.text,
                      fontSize: verseTypography.fontSize,
                      lineHeight: verseTypography.lineHeight + 4,
                    },
                  ]}>
                  “{fullText}”
                </Text>
              ) : reciteRevealedCount > 0 ? (
                <Text
                  style={[
                    styles.scriptureText,
                    {
                      color: colors.text,
                      fontSize: verseTypography.fontSize,
                      lineHeight: verseTypography.lineHeight + 4,
                    },
                  ]}>
                  {tokens.slice(0, reciteRevealedCount).map((t) => t.raw).join(' ')}{' '}
                  <Text style={{ color: colors.textMuted }}>...</Text>
                </Text>
              ) : (
                <View style={styles.recitePromptBox}>
                  <Ionicons name="mic-outline" size={36} color={colors.primary} />
                  <Text style={[styles.recitePromptTitle, { color: colors.text }]}>
                    Recite the verse aloud or silently.
                  </Text>
                  <Text style={[styles.recitePromptSub, { color: colors.textSecondary }]}>
                    When you finish, reveal the passage to check your memory and rate how easily it
                    came to mind.
                  </Text>
                </View>
              )}

              <View style={styles.reciteHelpRow}>
                <Pressable
                  onPress={revealOneWord}
                  style={[styles.hintBtn, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="bulb-outline" size={16} color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                    Hint 1 Word ({reciteRevealedCount}/{tokens.length})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setReciteShowFull((v) => !v)}
                  style={[styles.hintBtn, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons
                    name={reciteShowFull ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={colors.text}
                  />
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                    {reciteShowFull ? 'Hide Verse' : 'Reveal Full'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Self-Rating Buttons */}
            <Animated.View entering={FadeInDown.duration(200)}>
              <Text style={[styles.ratingTitle, { color: colors.text }]}>
                How well did you remember this passage?
              </Text>
              <View style={styles.ratingRow}>
                <Pressable
                  onPress={() => handleRate('again')}
                  style={[styles.rateBtn, { backgroundColor: colors.dangerSoft }]}>
                  <Text style={[styles.rateLabel, { color: colors.danger }]}>Again</Text>
                  <Text style={[styles.rateSub, { color: colors.danger }]}>
                    {intervalPreviews?.again ?? 'Now'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleRate('hard')}
                  style={[styles.rateBtn, { backgroundColor: colors.warningSoft }]}>
                  <Text style={[styles.rateLabel, { color: colors.warning }]}>Hard</Text>
                  <Text style={[styles.rateSub, { color: colors.warning }]}>
                    {intervalPreviews?.hard ?? '1d'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleRate('good')}
                  style={[styles.rateBtn, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.rateLabel, { color: colors.primary }]}>Good</Text>
                  <Text style={[styles.rateSub, { color: colors.primary }]}>
                    {intervalPreviews?.good ?? '6d'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleRate('easy')}
                  style={[styles.rateBtn, { backgroundColor: colors.successSoft }]}>
                  <Text style={[styles.rateLabel, { color: colors.success }]}>Easy</Text>
                  <Text style={[styles.rateSub, { color: colors.success }]}>
                    {intervalPreviews?.easy ?? '12d'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stageTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  stageTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2.5,
  },
  stageTabText: { fontSize: 11.5, fontWeight: '700' },
  scroll: { padding: 18, gap: 14, paddingBottom: 40 },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refText: { fontSize: 22, fontWeight: '800' },
  transLabel: { fontSize: 13, marginTop: 2 },
  stageBody: { gap: 14 },
  verseCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  scriptureText: { fontFamily: 'serif' },
  firstLetterText: { fontFamily: 'monospace', letterSpacing: 0.5 },
  cardActionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  audioBtnText: { fontSize: 14, fontWeight: '700' },
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
  },
  blankSlot: { borderRadius: 6, fontWeight: '700' },
  pickPrompt: { fontSize: 13, fontWeight: '600' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optBtn: {
    width: '48.4%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  optBtnText: { fontSize: 16, fontWeight: '700' },
  skipBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  hintRow: { flexDirection: 'row', gap: 10 },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  recitePromptBox: { alignItems: 'center', paddingVertical: 18, gap: 8 },
  recitePromptTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  recitePromptSub: { fontSize: 13.5, textAlign: 'center', lineHeight: 19 },
  reciteHelpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  ratingTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', gap: 8 },
  rateBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 2,
  },
  rateLabel: { fontSize: 15, fontWeight: '800' },
  rateSub: { fontSize: 11, fontWeight: '600' },
});
