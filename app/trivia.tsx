import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import triviaBankRaw from '@/data/triviaBank.json';
import { useAppTheme } from '@/hooks/useAppTheme';
import { toLocalDateKey } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';
import type { TriviaQuestion } from '@/types/models';

const TRIVIA_BANK = triviaBankRaw as TriviaQuestion[];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDailyChallengeQuestions(dateKey: string): TriviaQuestion[] {
  let seed = 0;
  for (let i = 0; i < dateKey.length; i++) {
    seed = (seed * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  const pool = [...TRIVIA_BANK];
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5);
}

export default function TriviaScreen() {
  const params = useLocalSearchParams<{
    mode?: string;
    category?: string;
    difficulty?: string;
  }>();

  const mode = (params.mode ?? 'daily') as 'daily' | 'timed' | 'category';
  const category = params.category ?? 'Old Testament';
  const difficulty = params.difficulty ?? 'all';

  const { colors } = useAppTheme();
  const recordQuizSession = useAppStore((s) => s.recordQuizSession);

  const [sessionKey, setSessionKey] = useState(0);

  const questions = useMemo(() => {
    if (mode === 'daily') {
      return getDailyChallengeQuestions(toLocalDateKey());
    }
    let filtered = TRIVIA_BANK;
    if (mode === 'category') {
      filtered = filtered.filter((q) => q.category === category);
    }
    if (difficulty !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === difficulty);
    }
    const shuffled = shuffle(filtered);
    return mode === 'timed' ? shuffled.slice(0, 25) : shuffled.slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, category, difficulty, sessionKey]);

  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [finished, setFinished] = useState(false);

  const handlePlayAgain = () => {
    setSessionKey((k) => k + 1);
    setStartedAt(Date.now());
    setIdx(0);
    setScore(0);
    setAnsweredCount(0);
    setSelectedOpt(null);
    setTimeLeft(60);
    setFinished(false);
  };

  const title =
    mode === 'daily'
      ? 'Daily Challenge (5 Qs)'
      : mode === 'timed'
      ? 'Timed Blitz (60s)'
      : category;

  useEffect(() => {
    if (mode !== 'timed' || finished) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, finished]);

  // Persist timed quiz completion when timer runs out
  useEffect(() => {
    if (finished && mode === 'timed' && answeredCount > 0) {
      void recordQuizSession({
        quizType: 'trivia',
        category: 'Timed Blitz',
        difficulty,
        score,
        total: answeredCount,
        durationSec: 60 - timeLeft,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const current = questions[idx];

  const handleSelectOption = (optIdx: number) => {
    if (selectedOpt !== null || !current) return;
    setSelectedOpt(optIdx);
    setAnsweredCount((c) => c + 1);
    if (optIdx === current.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = async () => {
    if (idx + 1 < questions.length) {
      setIdx((i) => i + 1);
      setSelectedOpt(null);
    } else {
      if (mode !== 'timed') {
        const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        await recordQuizSession({
          quizType: 'trivia',
          category: mode === 'daily' ? 'Daily Challenge' : category,
          difficulty,
          score,
          total: questions.length,
          durationSec,
        });
      }
      setFinished(true);
    }
  };

  if (finished || !current) {
    const denom = mode === 'timed' ? Math.max(1, answeredCount) : questions.length;
    const pct = Math.round((score / denom) * 100);
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title, headerBackTitle: 'Back' }} />
        <View style={[styles.scoreCircle, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.scoreBig, { color: colors.accent }]}>{pct}%</Text>
        </View>
        <Text style={[styles.doneTitle, { color: colors.text }]}>
          {mode === 'daily'
            ? 'Daily Challenge Complete!'
            : mode === 'timed'
            ? 'Time’s Up!'
            : 'Trivia Complete!'}
        </Text>
        <Text style={[styles.doneSub, { color: colors.textSecondary }]}>
          You scored {score} out of {mode === 'timed' ? answeredCount : questions.length}{' '}
          questions.
        </Text>
        <View style={styles.resultActions}>
          <Pressable
            onPress={handlePlayAgain}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, flexDirection: 'row', gap: 8, justifyContent: 'center' }]}>
            <Ionicons name="refresh" size={17} color={colors.primaryText} />
            <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 15 }}>
              {mode === 'daily' ? 'Retake Today’s Challenge' : 'Play Again (New Questions)'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
              Back to Quizzes
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title, headerBackTitle: 'Back' }} />

      {/* Top Metadata */}
      <View style={styles.topRow}>
        <Text style={[styles.kicker, { color: colors.textMuted }]}>
          {mode === 'timed'
            ? `ANSWERED: ${answeredCount}`
            : `QUESTION ${idx + 1} OF ${questions.length}`}
        </Text>

        {mode === 'timed' ? (
          <View
            style={[
              styles.timerPill,
              {
                backgroundColor: timeLeft <= 10 ? colors.dangerSoft : colors.accentSoft,
              },
            ]}>
            <Ionicons
              name="timer-outline"
              size={15}
              color={timeLeft <= 10 ? colors.danger : colors.accent}
            />
            <Text
              style={{
                fontWeight: '800',
                fontSize: 13,
                color: timeLeft <= 10 ? colors.danger : colors.accent,
              }}>
              {timeLeft}s
            </Text>
          </View>
        ) : (
          <Text style={[styles.scoreSmall, { color: colors.primary }]}>Score: {score}</Text>
        )}
      </View>

      <Animated.View key={current.id} entering={FadeIn.duration(180)} style={styles.qWrap}>
        <View style={styles.pillRow}>
          <View style={[styles.tagPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>
              {current.category}
            </Text>
          </View>
          <View style={[styles.tagPill, { backgroundColor: colors.surfaceMuted }]}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 11,
                fontWeight: '800',
                textTransform: 'uppercase',
              }}>
              {current.difficulty}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.questionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <Text style={[styles.questionText, { color: colors.text }]}>{current.question}</Text>
        </View>

        <View style={styles.optionsList}>
          {current.options.map((opt, oIdx) => {
            const isSelected = selectedOpt === oIdx;
            const isRight = oIdx === current.correctIndex;

            let bg = colors.surface;
            let border = colors.border;
            if (selectedOpt !== null) {
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
                key={oIdx}
                onPress={() => handleSelectOption(oIdx)}
                style={[styles.optBtn, { backgroundColor: bg, borderColor: border }]}>
                <Text style={[styles.optText, { color: colors.text }]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedOpt !== null && (
          <View
            style={[
              styles.explanationCard,
              {
                backgroundColor:
                  selectedOpt === current.correctIndex
                    ? colors.successSoft
                    : colors.surfaceMuted,
              },
            ]}>
            <Text style={[styles.refLabel, { color: colors.primary }]}>
              {current.reference}
            </Text>
            <Text style={[styles.expText, { color: colors.text }]}>{current.explanation}</Text>

            <Pressable
              onPress={handleNext}
              style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 12 }]}>
              <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 15 }}>
                {idx + 1 < questions.length ? 'Next Question' : 'See Results'}
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
  scoreCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scoreBig: { fontSize: 28, fontWeight: '800' },
  doneTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  doneSub: { fontSize: 14.5, textAlign: 'center', lineHeight: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 0.9 },
  scoreSmall: { fontSize: 14, fontWeight: '800' },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  qWrap: { gap: 12, marginTop: 4 },
  pillRow: { flexDirection: 'row', gap: 8 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  questionCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  questionText: { fontSize: 18, fontWeight: '700', lineHeight: 26 },
  optionsList: { gap: 10 },
  optBtn: { padding: 16, borderRadius: 14, borderWidth: 1.5 },
  optText: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  explanationCard: { padding: 16, borderRadius: 16, gap: 6 },
  refLabel: { fontSize: 12.5, fontWeight: '800' },
  expText: { fontSize: 14, lineHeight: 20 },
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
  resultActions: { width: '100%', gap: 10, marginTop: 16 },
});
