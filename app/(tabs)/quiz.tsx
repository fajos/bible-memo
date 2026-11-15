import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/store/useAppStore';
import type { QuizDifficulty, TriviaCategory, VerseQuizMode } from '@/types/models';

const VERSE_QUIZ_MODES: {
  key: VerseQuizMode;
  title: string;
  desc: string;
  icon: string;
}[] = [
  {
    key: 'mixed',
    title: 'Mixed Challenge',
    desc: 'All four verse quiz styles rotated in one session.',
    icon: 'shuffle',
  },
  {
    key: 'fill_blank',
    title: 'Fill in the Blank',
    desc: 'Pick the missing word using distractors from your deck.',
    icon: 'create-outline',
  },
  {
    key: 'finish_verse',
    title: 'Finish the Verse',
    desc: 'Read the opening phrase and choose the right ending.',
    icon: 'arrow-forward-circle-outline',
  },
  {
    key: 'name_reference',
    title: 'Name the Reference',
    desc: 'Identify the Book, Chapter, and Verse from 4 choices.',
    icon: 'bookmark-outline',
  },
  {
    key: 'word_order',
    title: 'Word Order',
    desc: 'Tap shuffled scripture chunks back into exact order.',
    icon: 'list-outline',
  },
];

const TRIVIA_CATEGORIES: { name: TriviaCategory; icon: string; color: string }[] = [
  { name: 'Old Testament', icon: 'flame-outline', color: '#C48324' },
  { name: 'New Testament', icon: 'mail-outline', color: '#2B4C7E' },
  { name: 'Gospels', icon: 'book-outline', color: '#B83A3A' },
  { name: 'Characters', icon: 'people-outline', color: '#7B4FA3' },
  { name: 'Books of the Bible', icon: 'library-outline', color: '#1F6E8C' },
  { name: 'Miracles', icon: 'sparkles-outline', color: '#2E7D5B' },
  { name: 'Parables', icon: 'leaf-outline', color: '#8C6239' },
];

export default function QuizHubScreen() {
  const { colors } = useAppTheme();
  const decks = useAppStore((s) => s.decks);
  const verses = useAppStore((s) => s.verses);

  const [section, setSection] = useState<'verse' | 'trivia'>('verse');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [deckPickerOpen, setDeckPickerOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | QuizDifficulty>('all');

  const customDecks = decks.filter((d) => !d.isStarter);
  const starterDecks = decks.filter((d) => d.isStarter);
  const activeDeck = selectedDeckId === 'all' ? null : decks.find((d) => d.id === selectedDeckId);
  const activeVerseCount =
    selectedDeckId === 'all'
      ? verses.length
      : verses.filter((v) => v.deckId === selectedDeckId).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Quizzes</Text>
      </View>

      <View style={[styles.segmentWrap, { backgroundColor: colors.surfaceMuted }]}>
        {(
          [
            { key: 'verse', label: 'Verse Quizzes' },
            { key: 'trivia', label: 'Bible Knowledge' },
          ] as const
        ).map((item) => {
          const active = section === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setSection(item.key)}
              style={[styles.segmentItem, active && { backgroundColor: colors.surface }]}>
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? colors.text : colors.textMuted },
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {section === 'verse' ? (
          <>
            {/* Interactive Target Deck Selector */}
            <View style={styles.deckPickerHeaderRow}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                TARGET DECK FOR QUIZ
              </Text>
              {selectedDeckId !== 'all' && (
                <Pressable
                  onPress={() => setSelectedDeckId('all')}
                  hitSlop={8}
                  style={styles.resetDeckBtn}>
                  <Text style={[styles.resetDeckText, { color: colors.primary }]}>
                    Reset to All Decks
                  </Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => setDeckPickerOpen(true)}
              style={[
                styles.targetDeckCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: activeDeck ? activeDeck.color : colors.primary,
                },
              ]}>
              <View
                style={[
                  styles.targetDeckIcon,
                  {
                    backgroundColor: activeDeck ? `${activeDeck.color}20` : colors.primarySoft,
                  },
                ]}>
                <Ionicons
                  name={activeDeck ? (activeDeck.icon as never) : 'albums-outline'}
                  size={24}
                  color={activeDeck ? activeDeck.color : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={[styles.targetDeckName, { color: colors.text }]} numberOfLines={1}>
                    {activeDeck ? activeDeck.name : 'All Decks (Complete Library)'}
                  </Text>
                  {activeDeck && (
                    <View
                      style={[
                        styles.deckTypeBadge,
                        {
                          backgroundColor: activeDeck.isStarter
                            ? colors.surfaceMuted
                            : `${colors.primary}20`,
                        },
                      ]}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: activeDeck.isStarter ? colors.textMuted : colors.primary,
                        }}>
                        {activeDeck.isStarter ? 'Starter Pack' : 'Custom'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.targetDeckSub, { color: colors.textSecondary }]}>
                  {activeVerseCount} {activeVerseCount === 1 ? 'verse' : 'verses'} • Tap to change deck
                </Text>
              </View>
              <View
                style={[
                  styles.changeBtnPill,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}>
                <Text style={[styles.changeBtnText, { color: colors.text }]}>Choose Deck</Text>
                <Ionicons name="chevron-down" size={15} color={colors.textSecondary} />
              </View>
            </Pressable>

            {activeVerseCount === 0 && (
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: '#FFF3CD', borderColor: '#FFEEBA' },
                ]}>
                <Ionicons name="alert-circle" size={18} color="#856404" />
                <Text style={[styles.warningText, { color: '#856404' }]}>
                  This deck has 0 verses. Add verses to it from the Library tab before taking quizzes.
                </Text>
              </View>
            )}

            <View
              style={[
                styles.infoBox,
                { backgroundColor: colors.primarySoft, borderColor: `${colors.primary}35` },
              ]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                Distractors are pulled directly from your selected deck. Missed verses move straight to the
                front of your review queue.
              </Text>
            </View>

            {VERSE_QUIZ_MODES.map((m) => (
              <Pressable
                key={m.key}
                onPress={() =>
                  router.push({
                    pathname: '/verse-quiz',
                    params: { deckId: selectedDeckId, mode: m.key },
                  })
                }
                style={[
                  styles.modeCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={[styles.modeIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={m.icon as never} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modeTitle, { color: colors.text }]}>{m.title}</Text>
                  <Text style={[styles.modeDesc, { color: colors.textSecondary }]}>{m.desc}</Text>
                  <View style={styles.modeDeckBadge}>
                    <Ionicons
                      name="layers-outline"
                      size={12}
                      color={activeDeck ? activeDeck.color : colors.primary}
                    />
                    <Text
                      style={[
                        styles.modeDeckBadgeText,
                        { color: activeDeck ? activeDeck.color : colors.primary },
                      ]}>
                      {activeDeck ? activeDeck.name : 'All Decks'} ({activeVerseCount} verses)
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            ))}
          </>
        ) : (
          <>
            {/* Daily & Timed Modes */}
            <View style={styles.featuredRow}>
              <Pressable
                onPress={() => router.push({ pathname: '/trivia', params: { mode: 'daily' } })}
                style={[styles.featuredCard, { backgroundColor: colors.primary }]}>
                <Ionicons name="sunny" size={24} color="#FFF" />
                <Text style={styles.featuredTitle}>Daily Challenge</Text>
                <Text style={styles.featuredSub}>5 curated questions for today</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/trivia',
                    params: { mode: 'timed', difficulty: selectedDifficulty },
                  })
                }
                style={[styles.featuredCard, { backgroundColor: colors.accent }]}>
                <Ionicons name="timer-outline" size={24} color="#FFF" />
                <Text style={styles.featuredTitle}>Timed Blitz</Text>
                <Text style={styles.featuredSub}>60s speed run • beat your best</Text>
              </Pressable>
            </View>

            {/* Difficulty Filter */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              DIFFICULTY LEVEL
            </Text>
            <View style={styles.diffRow}>
              {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => {
                const active = selectedDifficulty === diff;
                return (
                  <Pressable
                    key={diff}
                    onPress={() => setSelectedDifficulty(diff)}
                    style={[
                      styles.diffChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: active ? colors.primaryText : colors.textSecondary,
                        textTransform: 'capitalize',
                      }}>
                      {diff === 'all' ? 'Mixed' : diff}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 7 Categories */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              CATEGORIES (BUNDLED OFFLINE BANK)
            </Text>
            {TRIVIA_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.name}
                onPress={() =>
                  router.push({
                    pathname: '/trivia',
                    params: {
                      mode: 'category',
                      category: cat.name,
                      difficulty: selectedDifficulty,
                    },
                  })
                }
                style={[
                  styles.modeCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={[styles.modeIcon, { backgroundColor: `${cat.color}20` }]}>
                  <Ionicons name={cat.icon as never} size={22} color={cat.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modeTitle, { color: colors.text }]}>{cat.name}</Text>
                  <Text style={[styles.modeDesc, { color: colors.textSecondary }]}>
                    {selectedDifficulty === 'all'
                      ? 'Easy, Medium & Hard questions'
                      : `${selectedDifficulty[0].toUpperCase()}${selectedDifficulty.slice(1)} difficulty`}
                  </Text>
                </View>
                <Ionicons name="play-circle-outline" size={24} color={cat.color} />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      {/* Interactive Deck Picker Modal */}
      <Modal
        visible={deckPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setDeckPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Quiz Deck</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  Select a collection to quiz specific verses, or quiz your entire library.
                </Text>
              </View>
              <Pressable
                onPress={() => setDeckPickerOpen(false)}
                hitSlop={10}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}>
              {/* Option 1: All Decks */}
              <Pressable
                onPress={() => {
                  setSelectedDeckId('all');
                  setDeckPickerOpen(false);
                }}
                style={[
                  styles.deckOptionItem,
                  {
                    backgroundColor:
                      selectedDeckId === 'all' ? colors.primarySoft : colors.background,
                    borderColor: selectedDeckId === 'all' ? colors.primary : colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.deckOptionIcon,
                    {
                      backgroundColor:
                        selectedDeckId === 'all' ? colors.primary : colors.surfaceMuted,
                    },
                  ]}>
                  <Ionicons
                    name="albums-outline"
                    size={20}
                    color={selectedDeckId === 'all' ? colors.primaryText : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.deckOptionName, { color: colors.text }]}>
                    All Decks ({verses.length} verses)
                  </Text>
                  <Text style={[styles.deckOptionDesc, { color: colors.textSecondary }]}>
                    Draw questions and distractors from your entire collection
                  </Text>
                </View>
                {selectedDeckId === 'all' && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </Pressable>

              {/* Section: Your Custom Decks */}
              <View style={styles.modalSectionLabelRow}>
                <Ionicons name="person-outline" size={14} color={colors.primary} />
                <Text style={[styles.modalSectionLabel, { color: colors.primary }]}>
                  YOUR CUSTOM DECKS ({customDecks.length})
                </Text>
              </View>

              {customDecks.length === 0 ? (
                <View
                  style={[
                    styles.emptyCustomCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}>
                  <Ionicons name="bookmark-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.emptyCustomText, { color: colors.textSecondary }]}>
                    No custom decks yet. Create custom decks in the{' '}
                    <Text style={{ fontWeight: '700', color: colors.primary }}>Library</Text> tab!
                  </Text>
                </View>
              ) : (
                customDecks.map((d) => {
                  const count = verses.filter((v) => v.deckId === d.id).length;
                  const isSelected = selectedDeckId === d.id;
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() => {
                        setSelectedDeckId(d.id);
                        setDeckPickerOpen(false);
                      }}
                      style={[
                        styles.deckOptionItem,
                        {
                          backgroundColor: isSelected ? `${d.color}15` : colors.background,
                          borderColor: isSelected ? d.color : colors.border,
                        },
                      ]}>
                      <View style={[styles.deckOptionIcon, { backgroundColor: `${d.color}25` }]}>
                        <Ionicons name={d.icon as never} size={20} color={d.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deckOptionName, { color: colors.text }]}>
                          {d.name} ({count} {count === 1 ? 'verse' : 'verses'})
                        </Text>
                        <Text
                          style={[styles.deckOptionDesc, { color: colors.textSecondary }]}
                          numberOfLines={1}>
                          {d.description || 'Custom deck'}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={d.color} />
                      )}
                    </Pressable>
                  );
                })
              )}

              {/* Section: Starter Packs */}
              <View style={styles.modalSectionLabelRow}>
                <Ionicons name="sparkles-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>
                  PRESET STARTER PACKS ({starterDecks.length})
                </Text>
              </View>

              {starterDecks.map((d) => {
                const count = verses.filter((v) => v.deckId === d.id).length;
                const isSelected = selectedDeckId === d.id;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => {
                      setSelectedDeckId(d.id);
                      setDeckPickerOpen(false);
                    }}
                    style={[
                      styles.deckOptionItem,
                      {
                        backgroundColor: isSelected ? `${d.color}15` : colors.background,
                        borderColor: isSelected ? d.color : colors.border,
                      },
                    ]}>
                    <View style={[styles.deckOptionIcon, { backgroundColor: `${d.color}20` }]}>
                      <Ionicons name={d.icon as never} size={20} color={d.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.deckOptionName, { color: colors.text }]}>
                        {d.name} ({count} {count === 1 ? 'verse' : 'verses'})
                      </Text>
                      <Text
                        style={[styles.deckOptionDesc, { color: colors.textSecondary }]}
                        numberOfLines={1}>
                        {d.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={d.color} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: '800' },
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: 18,
    padding: 4,
    borderRadius: 14,
    marginBottom: 8,
  },
  segmentItem: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segmentText: { fontSize: 13, fontWeight: '700' },
  content: { padding: 18, paddingTop: 8, gap: 12, paddingBottom: 36 },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.9, marginTop: 4 },
  deckPickerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  resetDeckBtn: { paddingVertical: 2, paddingHorizontal: 4 },
  resetDeckText: { fontSize: 12, fontWeight: '700' },
  targetDeckCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  targetDeckIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetDeckName: { fontSize: 15.5, fontWeight: '800' },
  deckTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  targetDeckSub: { fontSize: 12.5, marginTop: 2 },
  changeBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  changeBtnText: { fontSize: 12, fontWeight: '700' },
  warningBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  warningText: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 17 },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoText: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 18 },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: { fontSize: 16, fontWeight: '700' },
  modeDesc: { fontSize: 12.5, marginTop: 2, lineHeight: 17 },
  modeDeckBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  modeDeckBadgeText: { fontSize: 11.5, fontWeight: '700' },
  featuredRow: { flexDirection: 'row', gap: 12 },
  featuredCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  featuredTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 4 },
  featuredSub: { color: 'rgba(255,255,255,0.88)', fontSize: 12.5, lineHeight: 17 },
  diffRow: { flexDirection: 'row', gap: 8 },
  diffChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 19, fontWeight: '800' },
  modalSub: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 4,
  },
  modalSectionLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8 },
  emptyCustomCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyCustomText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  deckOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  deckOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckOptionName: { fontSize: 14.5, fontWeight: '700' },
  deckOptionDesc: { fontSize: 12, marginTop: 1 },
});
