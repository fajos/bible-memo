import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/useAppTheme';
import { hapticError, hapticLight, hapticSuccess } from '@/lib/haptics';
import { generateVerseQuiz, type VerseQuizQuestion } from '@/lib/verseQuiz';
import { useAppStore } from '@/store/useAppStore';
import type { VerseQuizMode } from '@/types/models';

function buildQuizQuestions(deckId: string, mode: VerseQuizMode): VerseQuizQuestion[] {
  const allVerses = useAppStore.getState().verses;
  const translation = useAppStore.getState().settings.translation;
  const deckVerses = deckId === 'all' ? allVerses : allVerses.filter((v) => v.deckId === deckId);
  const distractorPool = deckVerses.length >= 4 ? deckVerses : allVerses;
  return generateVerseQuiz({
    targetVerses: deckVerses,
    distractorPoolVerses: distractorPool,
    translation,
    mode,
    maxQuestions: 8,
  });
}

export default function VerseQuizScreen() {
  const params = useLocalSearchParams<{ deckId?: string; mode?: string }>();
  const deckId = params.deckId ?? 'all';
  const mode = (params.mode ?? 'mixed') as VerseQuizMode;

  const { colors, verseTypography } = useAppTheme();
  const decks = useAppStore((s) => s.decks);
  const flagQuizMiss = useAppStore((s) => s.flagQuizMiss);
  const recordVerseReview = useAppStore((s) => s.recordVerseReview);
  const recordQuizSession = useAppStore((s) => s.recordQuizSession);

  const deckName =
    deckId === 'all' ? 'All Decks' : decks.find((d) => d.id === deckId)?.name ?? 'Deck';

  // Questions are generated ONCE per session and kept completely stable during the quiz
  const [questions, setQuestions] = useState<VerseQuizQuestion[]>(() =>
    buildQuizQuestions(deckId, mode)
  );

  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [missedIds, setMissedIds] = useState<string[]>([]);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<number | string | null>(null);

  // Word order state
  const [pickedChunks, setPickedChunks] = useState<{ id: string; text: string }[]>([]);
  const [finished, setFinished] = useState(false);

  const handlePlayAgain = useCallback(() => {
    setQuestions(buildQuizQuestions(deckId, mode));
    setStartedAt(Date.now());
    setIdx(0);
    setScore(0);
    setMissedIds([]);
    setAnswered(null);
    setSelectedOpt(null);
    setPickedChunks([]);
    setFinished(false);
  }, [deckId, mode]);

  const lastParamsRef = useRef(`${deckId}_${mode}`);
  useEffect(() => {
    const key = `${deckId}_${mode}`;
    if (lastParamsRef.current !== key) {
      lastParamsRef.current = key;
      handlePlayAgain();
    }
  }, [deckId, mode, handlePlayAgain]);

  const current = questions[idx];

  if (questions.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="book-outline" size={44} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Verses in Selection</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
          Add verses to this deck first, then come back to quiz yourself.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 14 }]}>
          <Text style={{ color: colors.primaryText, fontWeight: '800' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleAnswerResult = async (isCorrect: boolean, verseId: string) => {
    setAnswered(isCorrect);
    if (isCorrect) {
      hapticSuccess();
      setScore((s) => s + 1);
      await recordVerseReview(verseId, 'good', 'quiz');
    } else {
      hapticError();
      setMissedIds((prev) => (prev.includes(verseId) ? prev : [...prev, verseId]));
      await flagQuizMiss(verseId);
    }
  };

  const handlePickMultipleChoice = (choiceIndexOrValue: number | string) => {
    if (answered !== null || !current) return;
    setSelectedOpt(choiceIndexOrValue);

    let isCorrect = false;
    if (current.type === 'fill_blank') {
      isCorrect = choiceIndexOrValue === current.correctAnswer;
    } else if (current.type === 'finish_verse' || current.type === 'name_reference') {
      isCorrect = choiceIndexOrValue === current.correctIndex;
    }
    void handleAnswerResult(isCorrect, current.verseId);
  };

  const handleCheckWordOrder = () => {
    if (!current || current.type !== 'word_order' || answered !== null) return;
    const isCorrect =
      pickedChunks.length === current.correctChunks.length &&
      pickedChunks.every((c, i) => c.text === current.correctChunks[i]);
    void handleAnswerResult(isCorrect, current.verseId);
  };

  const handleNext = async () => {
    if (idx + 1 < questions.length) {
      hapticLight();
      setIdx((i) => i + 1);
      setAnswered(null);
      setSelectedOpt(null);
      setPickedChunks([]);
    } else {
      hapticSuccess();
      const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      await recordQuizSession({
        quizType: 'verse',
        category: deckName,
        difficulty: mode,
        score,
        total: questions.length,
        durationSec,
      });
      setFinished(true);
    }
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.resultCircle, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.resultPct, { color: colors.primary }]}>{pct}%</Text>
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Verse Quiz Complete!</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
          You answered {score} of {questions.length} correctly.
          {missedIds.length > 0
            ? ` ${missedIds.length} missed verse${missedIds.length === 1 ? '' : 's'} moved to the front of your review queue.`
            : ' Every answer was spot on!'}
        </Text>

        <View style={styles.resultActions}>
          <Pressable
            onPress={handlePlayAgain}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, flexDirection: 'row', gap: 8, justifyContent: 'center' }]}>
            <Ionicons name="refresh" size={18} color={colors.primaryText} />
            <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 15 }}>
              Play Again (Fresh Quiz)
            </Text>
          </Pressable>

          {missedIds.length > 0 && (
            <Pressable
              onPress={() => router.replace('/review')}
              style={[styles.primaryBtn, { backgroundColor: colors.accent, flexDirection: 'row', gap: 8, justifyContent: 'center' }]}>
              <Ionicons name="sparkles" size={17} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '800' }}>Review Missed Verses Now</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.back()}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      {/* Progress */}
      <View style={styles.topRow}>
        <View style={[styles.deckTagRow, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="layers-outline" size={13} color={colors.primary} />
          <Text style={[styles.deckTagText, { color: colors.text }]} numberOfLines={1}>
            {deckName}
          </Text>
        </View>
        <Text style={[styles.counter, { color: colors.textMuted }]}>
          {idx + 1} OF {questions.length}
        </Text>
        <Text style={[styles.scoreBadge, { color: colors.primary }]}>Score: {score}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
              width: `${Math.round(((idx + 1) / questions.length) * 100)}%`,
            },
          ]}
        />
      </View>

      <Animated.View key={idx} entering={FadeIn.duration(200)} style={styles.qWrap}>
        {/* TYPE 1: FILL IN THE BLANK */}
        {current.type === 'fill_blank' && (
          <>
            <Text style={[styles.typeBadge, { color: colors.accent }]}>FILL IN THE BLANK</Text>
            <Text style={[styles.refTitle, { color: colors.text }]}>{current.reference}</Text>
            <View
              style={[
                styles.promptCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text
                style={[
                  styles.scriptureText,
                  {
                    color: colors.text,
                    fontSize: verseTypography.fontSize,
                    lineHeight: verseTypography.lineHeight,
                  },
                ]}>
                {current.promptSegments.map((seg, i) => {
                  if (!seg.isBlank) {
                    return <Text key={i}>{seg.text}</Text>;
                  }
                  return (
                    <Text
                      key={i}
                      style={{
                        color:
                          answered === null
                            ? colors.primary
                            : answered
                            ? colors.success
                            : colors.danger,
                        fontWeight: '800',
                      }}>
                      {answered !== null ? ` ${current.correctAnswer} ` : seg.text}
                    </Text>
                  );
                })}
              </Text>
            </View>

            <View style={styles.optionsList}>
              {current.options.map((opt) => {
                const isSelected = selectedOpt === opt;
                const isRight = opt === current.correctAnswer;
                let bg = colors.surface;
                let border = colors.border;
                if (answered !== null) {
                  if (isRight) {
                    bg = colors.successSoft;
                    border = colors.success;
                  } else if (isSelected) {
                    bg = colors.dangerSoft;
                    border = colors.danger;
                  }
                }
                return (
                  <Pressable
                    key={opt}
                    disabled={answered !== null}
                    onPress={() => handlePickMultipleChoice(opt)}
                    style={[styles.optBtn, { backgroundColor: bg, borderColor: border }]}>
                    <Text style={[styles.optText, { color: colors.text }]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* TYPE 2: FINISH THE VERSE */}
        {current.type === 'finish_verse' && (
          <>
            <Text style={[styles.typeBadge, { color: colors.accent }]}>FINISH THE VERSE</Text>
            <Text style={[styles.refTitle, { color: colors.text }]}>{current.reference}</Text>
            <View
              style={[
                styles.promptCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text
                style={[
                  styles.scriptureText,
                  {
                    color: colors.text,
                    fontSize: verseTypography.fontSize,
                    lineHeight: verseTypography.lineHeight,
                  },
                ]}>
                “{current.promptStart}”
              </Text>
            </View>

            <View style={styles.optionsList}>
              {current.options.map((opt, optIdx) => {
                const isSelected = selectedOpt === optIdx;
                const isRight = optIdx === current.correctIndex;
                let bg = colors.surface;
                let border = colors.border;
                if (answered !== null) {
                  if (isRight) {
                    bg = colors.successSoft;
                    border = colors.success;
                  } else if (isSelected) {
                    bg = colors.dangerSoft;
                    border = colors.danger;
                  }
                }
                return (
                  <Pressable
                    key={optIdx}
                    disabled={answered !== null}
                    onPress={() => handlePickMultipleChoice(optIdx)}
                    style={[styles.optBtn, { backgroundColor: bg, borderColor: border }]}>
                    <Text style={[styles.optText, { color: colors.text }]}>... {opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* TYPE 3: NAME THE REFERENCE */}
        {current.type === 'name_reference' && (
          <>
            <Text style={[styles.typeBadge, { color: colors.accent }]}>NAME THE REFERENCE</Text>
            <View
              style={[
                styles.promptCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text
                style={[
                  styles.scriptureText,
                  {
                    color: colors.text,
                    fontSize: verseTypography.fontSize,
                    lineHeight: verseTypography.lineHeight,
                  },
                ]}>
                “{current.verseText}”
              </Text>
            </View>

            <View style={styles.optionsList}>
              {current.options.map((opt, optIdx) => {
                const isSelected = selectedOpt === optIdx;
                const isRight = optIdx === current.correctIndex;
                let bg = colors.surface;
                let border = colors.border;
                if (answered !== null) {
                  if (isRight) {
                    bg = colors.successSoft;
                    border = colors.success;
                  } else if (isSelected) {
                    bg = colors.dangerSoft;
                    border = colors.danger;
                  }
                }
                return (
                  <Pressable
                    key={optIdx}
                    disabled={answered !== null}
                    onPress={() => handlePickMultipleChoice(optIdx)}
                    style={[styles.optBtn, { backgroundColor: bg, borderColor: border }]}>
                    <Text style={[styles.optText, { color: colors.text }]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* TYPE 4: WORD ORDER */}
        {current.type === 'word_order' && (
          <>
            <Text style={[styles.typeBadge, { color: colors.accent }]}>WORD ORDER</Text>
            <Text style={[styles.refTitle, { color: colors.text }]}>{current.reference}</Text>
            <Text style={[styles.orderHint, { color: colors.textSecondary }]}>
              Tap the chunks below in the right order to build the verse.
            </Text>

            <View
              style={[
                styles.answerTray,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {pickedChunks.length === 0 ? (
                <Text style={{ color: colors.textMuted, fontStyle: 'italic' }}>
                  Your assembled verse will appear here...
                </Text>
              ) : (
                <View style={styles.chunkWrap}>
                  {pickedChunks.map((ch) => (
                    <Pressable
                      key={ch.id}
                      onPress={() => {
                        if (answered !== null) return;
                        setPickedChunks((prev) => prev.filter((p) => p.id !== ch.id));
                      }}
                      style={[
                        styles.chunkChip,
                        { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                      ]}>
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                        {ch.text}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.chunkWrap}>
              {current.shuffledChunks.map((ch) => {
                const used = pickedChunks.some((p) => p.id === ch.id);
                return (
                  <Pressable
                    key={ch.id}
                    disabled={used || answered !== null}
                    onPress={() => setPickedChunks((prev) => [...prev, ch])}
                    style={[
                      styles.chunkChip,
                      {
                        backgroundColor: used ? colors.surfaceMuted : colors.surface,
                        borderColor: colors.border,
                        opacity: used ? 0.35 : 1,
                      },
                    ]}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                      {ch.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {answered === null && (
              <Pressable
                onPress={handleCheckWordOrder}
                disabled={pickedChunks.length !== current.correctChunks.length}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor:
                      pickedChunks.length === current.correctChunks.length
                        ? colors.primary
                        : colors.surfaceMuted,
                  },
                ]}>
                <Text
                  style={{
                    color:
                      pickedChunks.length === current.correctChunks.length
                        ? colors.primaryText
                        : colors.textMuted,
                    fontWeight: '800',
                  }}>
                  Check Order ({pickedChunks.length}/{current.correctChunks.length})
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* Feedback + Next */}
        {answered !== null && (
          <View
            style={[
              styles.feedbackBox,
              {
                backgroundColor: answered ? colors.successSoft : colors.dangerSoft,
              },
            ]}>
            <Text
              style={{
                fontWeight: '800',
                fontSize: 15,
                color: answered ? colors.success : colors.danger,
              }}>
              {answered
                ? 'Correct!'
                : 'Not quite — pushed to front of your review queue!'}
            </Text>
            {!answered && current.type === 'word_order' && (
              <Text style={{ color: colors.text, marginTop: 4, fontSize: 13 }}>
                Correct: “{current.fullText}”
              </Text>
            )}

            <Pressable
              onPress={handleNext}
              style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 10 }]}>
              <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 15 }}>
                {idx + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}
              </Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, gap: 12, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deckTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    maxWidth: '45%',
  },
  deckTagText: { fontSize: 12, fontWeight: '700' },
  counter: { fontSize: 12, fontWeight: '800', letterSpacing: 0.9 },
  scoreBadge: { fontSize: 14, fontWeight: '800' },
  track: { height: 6, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  qWrap: { gap: 12, marginTop: 6 },
  typeBadge: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1 },
  refTitle: { fontSize: 21, fontWeight: '800' },
  orderHint: { fontSize: 13 },
  promptCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  scriptureText: { fontFamily: 'serif' },
  optionsList: { gap: 10 },
  optBtn: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optText: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  answerTray: {
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  chunkWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chunkChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  feedbackBox: { padding: 16, borderRadius: 16, marginTop: 4 },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  resultCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  resultPct: { fontSize: 28, fontWeight: '800' },
  resultActions: { width: '100%', gap: 10, marginTop: 14 },
});
