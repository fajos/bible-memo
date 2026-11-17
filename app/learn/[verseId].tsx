import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { MasteryPill } from '@/components/MasteryPill';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getVerseText } from '@/lib/bible';
import {
  hapticError,
  hapticLight,
  hapticMedium,
  hapticSelection,
  hapticSuccess,
} from '@/lib/haptics';
import {
  buildBlankOptions,
  formatFirstLetterLine,
  selectBlankIndices,
  tokenizeVerse,
} from '@/lib/learnHelpers';
import { previewIntervalLabels } from '@/lib/sm2';
import { useAppStore } from '@/store/useAppStore';
import type { ReviewRating } from '@/types/models';

type Stage = 'read' | 'type' | 'scramble' | 'fill' | 'first_letter' | 'selah' | 'recite';

export default function LearnVerseScreen() {
  const { verseId } = useLocalSearchParams<{ verseId: string }>();
  const { colors, verseTypography } = useAppTheme();

  const verses = useAppStore((s) => s.verses);
  const translation = useAppStore((s) => s.settings.translation);
  const recordVerseReview = useAppStore((s) => s.recordVerseReview);
  const updateVerseNotes = useAppStore((s) => s.updateVerseNotes);

  const verse = verses.find((v) => v.id === verseId);
  const altTranslation = translation === 'KJV' ? 'WEB' : 'KJV';

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

  const altText = useMemo(() => {
    if (!verse) return '';
    return getVerseText(
      altTranslation,
      verse.bookIndex,
      verse.chapter,
      verse.verseStart,
      verse.verseEnd
    );
  }, [verse, altTranslation]);

  const tokens = useMemo(() => tokenizeVerse(fullText), [fullText]);
  const blankIndices = useMemo(
    () => selectBlankIndices(tokens, verse?.id ?? 'v'),
    [tokens, verse?.id]
  );

  const [stage, setStage] = useState<Stage>('read');
  const [showParallel, setShowParallel] = useState(false);
  const [notesText, setNotesText] = useState(verse?.notes ?? '');
  const [showNotes, setShowNotes] = useState(Boolean(verse?.notes));

  // Audio State
  const [speaking, setSpeaking] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(0.9);
  const [audioRepeatTarget, setAudioRepeatTarget] = useState<number>(1);
  const [audioCurrentLoop, setAudioCurrentLoop] = useState<number>(0);

  // Fill in blanks state
  const [blankStep, setBlankStep] = useState(0);
  const [filledWords, setFilledWords] = useState<Record<number, string>>({});
  const [wrongShake, setWrongShake] = useState(false);

  // Scripture Typer state
  const [typeIndex, setTypeIndex] = useState(0);
  const [typeShake, setTypeShake] = useState(false);
  const typeInputRef = useRef<any>(null);

  // Word Scramble state
  const [scramblePlacedIndices, setScramblePlacedIndices] = useState<number[]>([]);
  const [scrambleSeed, setScrambleSeed] = useState(0);
  const [scrambleShake, setScrambleShake] = useState(false);

  const scrambleTilePool = useMemo(() => {
    if (tokens.length === 0) return [];
    const pool = tokens.map((t) => ({ id: t.index, word: t.clean }));
    let hash = scrambleSeed * 31;
    for (let i = pool.length - 1; i > 0; i--) {
      hash = (hash * 1664525 + 1013904223) >>> 0;
      const j = hash % (i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }, [tokens, scrambleSeed]);

  // Selah Meditation State
  const [selahSecondsLeft, setSelahSecondsLeft] = useState(60);
  const [selahActive, setSelahActive] = useState(false);
  const breathAnim = useSharedValue(1);

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

  // Selah Meditation State
  useEffect(() => {
    if (stage === 'selah') {
      breathAnim.value = withRepeat(withTiming(1.2, { duration: 4000 }), -1, true);
    } else {
      breathAnim.value = 1;
    }
  }, [stage, breathAnim]);

  // Selah meditation timer
  useEffect(() => {
    let timer: any = null;
    if (stage === 'selah' && selahActive && selahSecondsLeft > 0) {
      timer = setInterval(() => {
        setSelahSecondsLeft((s) => {
          if (s <= 1) {
            hapticSuccess();
            setSelahActive(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stage, selahActive, selahSecondsLeft]);

  // Speech cleanup on unmount
  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  const breathCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathAnim.value }],
  }));

  if (!verse) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Verse not found.</Text>
      </View>
    );
  }

  // Audio Playback with Loop Support
  const playAudioSequence = (loopTarget: number, currentLoop: number) => {
    setSpeaking(true);
    setAudioCurrentLoop(currentLoop);
    Speech.speak(`${verse.reference}. ${fullText}`, {
      language: 'en-US',
      rate: audioSpeed,
      onDone: () => {
        if (currentLoop + 1 < loopTarget || loopTarget === 99) {
          setTimeout(() => {
            playAudioSequence(loopTarget, currentLoop + 1);
          }, 1000);
        } else {
          setSpeaking(false);
          setAudioCurrentLoop(0);
        }
      },
      onStopped: () => {
        setSpeaking(false);
        setAudioCurrentLoop(0);
      },
      onError: () => {
        setSpeaking(false);
        setAudioCurrentLoop(0);
      },
    });
  };

  const toggleSpeak = () => {
    if (speaking) {
      Speech.stop().catch(() => {});
      setSpeaking(false);
      setAudioCurrentLoop(0);
    } else {
      playAudioSequence(audioRepeatTarget, 0);
    }
  };

  const handlePickBlankOption = (word: string) => {
    const targetIdx = blankIndices[blankStep];
    const targetToken = tokens[targetIdx];
    if (word.toLowerCase() === targetToken.clean.toLowerCase()) {
      hapticSelection();
      setFilledWords((prev) => ({ ...prev, [targetIdx]: targetToken.clean }));
      if (blankStep + 1 < blankIndices.length) {
        setBlankStep((s) => s + 1);
      } else {
        hapticSuccess();
        setTimeout(() => setStage('first_letter'), 400);
      }
    } else {
      hapticError();
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 500);
    }
  };

  // Scripture Typer: checks keystroke on first letter of current word
  const handleTypeKeystroke = (char: string) => {
    if (typeIndex >= tokens.length) return;
    const targetToken = tokens[typeIndex];
    const firstChar = targetToken.clean[0]?.toLowerCase();

    if (char.toLowerCase() === firstChar) {
      hapticLight();
      const nextIdx = typeIndex + 1;
      setTypeIndex(nextIdx);
      if (nextIdx >= tokens.length) {
        hapticSuccess();
      }
    } else {
      hapticError();
      setTypeShake(true);
      setTimeout(() => setTypeShake(false), 400);
    }
  };

  // Scramble word tap handler
  const handleScrambleWordTap = (tokenIndex: number) => {
    const nextExpected = scramblePlacedIndices.length;
    if (tokenIndex === nextExpected) {
      hapticSelection();
      const next = [...scramblePlacedIndices, tokenIndex];
      setScramblePlacedIndices(next);
      if (next.length === tokens.length) {
        hapticSuccess();
      }
    } else {
      hapticError();
      setScrambleShake(true);
      setTimeout(() => setScrambleShake(false), 450);
    }
  };

  const revealOneWord = () => {
    hapticLight();
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
    if (rating === 'again') hapticLight();
    else if (rating === 'hard') hapticMedium();
    else hapticSuccess();

    await recordVerseReview(verse.id, rating, 'learn');
    router.back();
  };

  const handleSaveNotes = (text: string) => {
    setNotesText(text);
    void updateVerseNotes(verse.id, text);
  };

  const STAGE_ORDER: { key: Stage; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'read', label: '1. Read & Listen', icon: 'book-outline' },
    { key: 'type', label: '2. Scripture Typer', icon: 'keypad-outline' },
    { key: 'scramble', label: '3. Scramble', icon: 'grid-outline' },
    { key: 'fill', label: '4. Fill Blanks', icon: 'create-outline' },
    { key: 'first_letter', label: '5. First Letters', icon: 'text-outline' },
    { key: 'selah', label: '6. Selah Pause', icon: 'leaf-outline' },
    { key: 'recite', label: '7. Recite & Test', icon: 'mic-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Stage Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stageTabs}>
        {STAGE_ORDER.map((item) => {
          const active = stage === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                hapticSelection();
                setStage(item.key);
              }}
              style={[
                styles.stageTab,
                { borderBottomColor: active ? colors.primary : 'transparent' },
              ]}>
              <Ionicons
                name={item.icon}
                size={14}
                color={active ? colors.primary : colors.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.stageTabText,
                  { color: active ? colors.primary : colors.textMuted },
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header reference */}
        <View style={styles.refRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.refText, { color: colors.text }]}>{verse.reference}</Text>
            <Text style={[styles.transLabel, { color: colors.textMuted }]}>
              {translation} • Due: {verse.dueDate}
            </Text>
          </View>
          <MasteryPill mastery={verse.mastery} />
        </View>

        {/* STAGE 1: READ AND LISTEN (with Audio Loop & Parallel Translation) */}
        {stage === 'read' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.stageBody}>
            <View
              style={[
                styles.verseCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {/* Primary Scripture Text */}
              <Text
                style={[
                  styles.scriptureText,
                  {
                    color: colors.text,
                    fontSize: verseTypography.fontSize + 1,
                    lineHeight: verseTypography.lineHeight + 5,
                  },
                ]}>
                “{fullText}”
              </Text>

              {/* Parallel Comparison View */}
              {showParallel && (
                <View
                  style={[
                    styles.parallelBox,
                    { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                  ]}>
                  <Text style={[styles.parallelTag, { color: colors.primary }]}>
                    {altTranslation} Translation Comparison:
                  </Text>
                  <Text
                    style={[
                      styles.scriptureText,
                      {
                        color: colors.textSecondary,
                        fontSize: verseTypography.fontSize - 1,
                        lineHeight: verseTypography.lineHeight + 2,
                      },
                    ]}>
                    “{altText}”
                  </Text>
                </View>
              )}

              {/* Action Toolbar */}
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
                    {speaking
                      ? audioRepeatTarget > 1
                        ? `Stop (${audioCurrentLoop + 1}/${audioRepeatTarget})`
                        : 'Stop Audio'
                      : 'Listen Audio'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    hapticSelection();
                    setShowParallel((p) => !p);
                  }}
                  style={[
                    styles.secondaryBtn,
                    {
                      backgroundColor: showParallel ? colors.primarySoft : colors.surfaceMuted,
                      borderColor: showParallel ? colors.primary : colors.border,
                    },
                  ]}>
                  <Ionicons
                    name="git-compare-outline"
                    size={17}
                    color={showParallel ? colors.primary : colors.text}
                  />
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      { color: showParallel ? colors.primary : colors.text },
                    ]}>
                    Parallel
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

              {/* Audio Controls Bar (Speed & Loop) */}
              <View style={[styles.audioSettingsRow, { borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.audioSettingsLabel, { color: colors.textMuted }]}>Speed:</Text>
                  {[0.75, 0.9, 1.0, 1.2].map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => {
                        hapticSelection();
                        setAudioSpeed(s);
                      }}
                      style={[
                        styles.chipBtn,
                        audioSpeed === s && { backgroundColor: colors.primary },
                      ]}>
                      <Text
                        style={[
                          styles.chipBtnText,
                          { color: audioSpeed === s ? colors.primaryText : colors.textSecondary },
                        ]}>
                        {s}x
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.audioSettingsLabel, { color: colors.textMuted }]}>Repeat:</Text>
                  {[1, 3, 5, 99].map((rep) => (
                    <Pressable
                      key={rep}
                      onPress={() => {
                        hapticSelection();
                        setAudioRepeatTarget(rep);
                      }}
                      style={[
                        styles.chipBtn,
                        audioRepeatTarget === rep && { backgroundColor: colors.primary },
                      ]}>
                      <Text
                        style={[
                          styles.chipBtnText,
                          { color: audioRepeatTarget === rep ? colors.primaryText : colors.textSecondary },
                        ]}>
                        {rep === 99 ? '∞' : `${rep}x`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Notes & Personal Reflection Drawer */}
            <View
              style={[
                styles.notesCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Pressable
                onPress={() => {
                  hapticSelection();
                  setShowNotes((v) => !v);
                }}
                style={styles.notesHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="journal-outline" size={18} color={colors.primary} />
                  <Text style={[styles.notesTitle, { color: colors.text }]}>
                    Study Notes & Reflections
                  </Text>
                </View>
                <Ionicons
                  name={showNotes ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              {showNotes && (
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    value={notesText}
                    onChangeText={handleSaveNotes}
                    placeholder="Write a personal reflection, sermon note, or prayer for this verse..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    style={[
                      styles.notesInput,
                      {
                        backgroundColor: colors.surfaceMuted,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                  <Text style={[styles.notesSavedLabel, { color: colors.textMuted }]}>
                    Notes auto-save offline to this verse.
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={() => {
                hapticSelection();
                setStage('type');
              }}
              style={[styles.nextStageBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 16 }}>
                Next: Scripture Typer Mode
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
            </Pressable>
          </Animated.View>
        )}

        {/* STAGE 2: SCRIPTURE TYPER (Active First-Letter Recall) */}
        {stage === 'type' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.stageBody}>
            <View
              style={[
                styles.verseCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {/* Progress Tracker */}
              <View style={styles.typerHeader}>
                <Text style={[styles.typerHeaderLabel, { color: colors.textSecondary }]}>
                  Type the first letter of each word:
                </Text>
                <Text style={[styles.typerCounter, { color: colors.primary }]}>
                  {typeIndex} / {tokens.length} words
                </Text>
              </View>

              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.round((typeIndex / Math.max(1, tokens.length)) * 100)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>

              {/* Interactive Verse Layout */}
              <View style={styles.typerWordBox}>
                {tokens.map((t, idx) => {
                  const isDone = idx < typeIndex;
                  const isCurrent = idx === typeIndex;
                  return (
                    <View
                      key={t.index}
                      style={[
                        styles.typerWordChip,
                        isCurrent && {
                          backgroundColor: typeShake ? colors.dangerSoft : colors.primarySoft,
                          borderColor: typeShake ? colors.danger : colors.primary,
                          borderWidth: 1.5,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.typerWordText,
                          {
                            color: isDone
                              ? colors.success
                              : isCurrent
                              ? colors.primary
                              : colors.textMuted,
                            fontWeight: isDone || isCurrent ? '700' : '400',
                          },
                        ]}>
                        {isDone ? t.raw : isCurrent ? t.clean[0] + '•••' : '••••'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Hidden Keystroke Receiver */}
              <TextInput
                ref={typeInputRef}
                style={styles.hiddenInput}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                value=""
                onChangeText={(text) => {
                  if (text.length > 0) {
                    const char = text.slice(-1);
                    handleTypeKeystroke(char);
                  }
                }}
              />

              {typeIndex >= tokens.length ? (
                <View style={[styles.congratsBox, { backgroundColor: colors.successSoft }]}>
                  <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                  <Text style={[styles.congratsText, { color: colors.success }]}>
                    Verse Completed! 100% typed from memory.
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => typeInputRef.current?.focus()}
                  style={[styles.tapToTypeBtn, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="keypad" size={18} color={colors.primary} />
                  <Text style={[styles.tapToTypeBtnText, { color: colors.primary }]}>
                    Tap to type with your keyboard (Next letter: &quot;{tokens[typeIndex]?.clean[0]?.toUpperCase()}&quot;)
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => {
                  hapticLight();
                  setTypeIndex(0);
                }}
                style={[styles.secondaryBtn, { flex: 1, backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="refresh" size={16} color={colors.text} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Reset</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  hapticSelection();
                  setStage('scramble');
                }}
                style={[styles.nextStageBtn, { flex: 2, backgroundColor: colors.primary }]}>
                <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 15 }}>
                  Next: Scramble
                </Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* STAGE 3: WORD SCRAMBLE BUILDER */}
        {stage === 'scramble' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.stageBody}>
            <View
              style={[
                styles.verseCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.pickPrompt, { color: colors.textSecondary }]}>
                Construct the verse in order by tapping the words:
              </Text>

              {/* Placed Words */}
              <View
                style={[
                  styles.scrambleSentenceBox,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}>
                {scramblePlacedIndices.length === 0 ? (
                  <Text style={{ color: colors.textMuted, fontStyle: 'italic', fontSize: 15 }}>
                    Tap word tiles below to rebuild the scripture...
                  </Text>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {scramblePlacedIndices.map((idx) => (
                      <View
                        key={idx}
                        style={[styles.placedTile, { backgroundColor: colors.primarySoft }]}>
                        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                          {tokens[idx]?.raw}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Word Tile Pool */}
              <View style={[styles.tilePool, scrambleShake && { opacity: 0.6 }]}>
                {scrambleTilePool.map((tile) => {
                  const isUsed = scramblePlacedIndices.includes(tile.id);
                  return (
                    <Pressable
                      key={tile.id}
                      disabled={isUsed}
                      onPress={() => handleScrambleWordTap(tile.id)}
                      style={[
                        styles.wordTile,
                        {
                          backgroundColor: isUsed ? colors.surfaceMuted : colors.surface,
                          borderColor: colors.border,
                          opacity: isUsed ? 0.35 : 1,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.wordTileText,
                          { color: isUsed ? colors.textMuted : colors.text },
                        ]}>
                        {tile.word}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => {
                  hapticLight();
                  setScramblePlacedIndices((prev) => prev.slice(0, -1));
                }}
                disabled={scramblePlacedIndices.length === 0}
                style={[
                  styles.secondaryBtn,
                  {
                    flex: 1,
                    backgroundColor: colors.surfaceMuted,
                    opacity: scramblePlacedIndices.length === 0 ? 0.5 : 1,
                  },
                ]}>
                <Ionicons name="arrow-undo" size={15} color={colors.text} />
                <Text style={[styles.secondaryBtnText, { color: colors.text, fontSize: 12 }]}>Undo</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  hapticSelection();
                  setScrambleSeed((s) => s + 1);
                  setScramblePlacedIndices([]);
                }}
                style={[styles.secondaryBtn, { flex: 1, backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="shuffle" size={15} color={colors.text} />
                <Text style={[styles.secondaryBtnText, { color: colors.text, fontSize: 12 }]}>Shuffle</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  hapticSelection();
                  setStage('fill');
                }}
                style={[styles.nextStageBtn, { flex: 1.5, backgroundColor: colors.primary, paddingVertical: 10 }]}>
                <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 13.5 }}>
                  Next
                </Text>
                <Ionicons name="arrow-forward" size={15} color={colors.primaryText} />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* STAGE 4: FILL IN THE BLANKS */}
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
              onPress={() => {
                hapticSelection();
                setStage('first_letter');
              }}
              style={[styles.skipBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                Skip to First Letters
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* STAGE 5: FIRST-LETTER PROMPTS */}
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
              onPress={() => {
                hapticSelection();
                setStage('selah');
              }}
              style={[styles.nextStageBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 16 }}>
                Next: Selah Meditation
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
            </Pressable>
          </Animated.View>
        )}

        {/* STAGE 6: SELAH MEDITATION & BREATHWORK */}
        {stage === 'selah' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.stageBody}>
            <View
              style={[
                styles.verseCard,
                { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center' },
              ]}>
              {/* Breathing Circle Ring */}
              <Animated.View
                style={[
                  styles.breathCircle,
                  breathCircleStyle,
                  { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                ]}>
                <Text style={[styles.breathTimerText, { color: colors.primary }]}>
                  {selahSecondsLeft}s
                </Text>
                <Text style={[styles.breathSubText, { color: colors.textMuted }]}>
                  {selahActive ? 'Breathe & Reflect' : 'Selah'}
                </Text>
              </Animated.View>

              <Text
                style={[
                  styles.scriptureText,
                  {
                    color: colors.text,
                    fontSize: verseTypography.fontSize + 2,
                    lineHeight: verseTypography.lineHeight + 6,
                    textAlign: 'center',
                    marginTop: 18,
                  },
                ]}>
                “{fullText}”
              </Text>

              <Text style={[styles.selahQuote, { color: colors.textMuted }]}>
                &quot;Be still, and know that I am God.&quot; — Psalm 46:10
              </Text>

              {/* Timer Controls */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Pressable
                  onPress={() => {
                    hapticSelection();
                    setSelahActive((a) => !a);
                  }}
                  style={[styles.audioBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons
                    name={selahActive ? 'pause' : 'play'}
                    size={18}
                    color={colors.primaryText}
                  />
                  <Text style={[styles.audioBtnText, { color: colors.primaryText }]}>
                    {selahActive ? 'Pause' : 'Start 60s Meditation'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    hapticLight();
                    setSelahSecondsLeft(60);
                    setSelahActive(false);
                  }}
                  style={[styles.secondaryBtn, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="refresh" size={16} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => {
                hapticSelection();
                setStage('recite');
              }}
              style={[styles.nextStageBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 16 }}>
                Step 7: Recite & Test Memory
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
            </Pressable>
          </Animated.View>
        )}

        {/* STAGE 7: RECITE FROM MEMORY & SELF-RATE */}
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
                  onPress={() => {
                    hapticSelection();
                    setReciteShowFull((v) => !v);
                  }}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 2.5,
  },
  stageTabText: { fontSize: 12, fontWeight: '700' },
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
  parallelBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  parallelTag: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
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
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700' },
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioSettingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  audioSettingsLabel: { fontSize: 11, fontWeight: '700' },
  chipBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipBtnText: { fontSize: 11, fontWeight: '700' },
  notesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesTitle: { fontSize: 14, fontWeight: '700' },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  notesSavedLabel: { fontSize: 11, marginTop: 4, textAlign: 'right' },
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

  // Typer Mode Styles
  typerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typerHeaderLabel: { fontSize: 12.5, fontWeight: '600' },
  typerCounter: { fontSize: 13, fontWeight: '700' },
  progressBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  typerWordBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 6 },
  typerWordChip: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8 },
  typerWordText: { fontSize: 15 },
  hiddenInput: { width: 1, height: 1, opacity: 0.01, position: 'absolute' },
  congratsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  congratsText: { fontSize: 14, fontWeight: '700', flex: 1 },
  tapToTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tapToTypeBtnText: { fontSize: 13, fontWeight: '700' },

  // Scramble Mode Styles
  scrambleSentenceBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 80,
  },
  placedTile: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tilePool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 6,
  },
  wordTile: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  wordTileText: { fontSize: 14, fontWeight: '600' },

  // Selah Meditation Styles
  breathCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  breathTimerText: { fontSize: 32, fontWeight: '800' },
  breathSubText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  selahQuote: { fontSize: 13, fontStyle: 'italic', marginTop: 8 },
});
