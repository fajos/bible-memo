import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddToDeckModal } from '@/components/AddToDeckModal';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  formatReference,
  getBooks,
  getChapterVerses,
  searchScripture,
} from '@/lib/bible';
import { toLocalDateKey } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';

type LibraryTab = 'decks' | 'bible' | 'search';

const DECK_COLORS = ['#2B4C7E', '#2E7D5B', '#C48324', '#B83A3A', '#7B4FA3', '#1F6E8C'];
const DECK_ICONS = ['bookmarks', 'heart', 'shield', 'sunny', 'leaf', 'flame'];

export default function LibraryScreen() {
  const { colors, verseTypography } = useAppTheme();
  const decks = useAppStore((s) => s.decks);
  const verses = useAppStore((s) => s.verses);
  const translation = useAppStore((s) => s.settings.translation);
  const createDeck = useAppStore((s) => s.createDeck);

  const [tab, setTab] = useState<LibraryTab>('decks');
  const [newDeckModal, setNewDeckModal] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [deckDesc, setDeckDesc] = useState('');
  const [deckColor, setDeckColor] = useState(DECK_COLORS[0]);
  const [deckIcon, setDeckIcon] = useState(DECK_ICONS[0]);

  // Bible Picker state
  const books = useMemo(() => getBooks(), []);
  const [testament, setTestament] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [selectedBookIdx, setSelectedBookIdx] = useState(42); // John
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [rangeStart, setRangeStart] = useState<number | null>(16);
  const [rangeEnd, setRangeEnd] = useState<number | null>(16);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPick, setSearchPick] = useState<{
    bookIndex: number;
    chapter: number;
    verse: number;
  } | null>(null);

  const filteredBooks = useMemo(() => {
    if (testament === 'ALL') return books;
    return books.filter((b) => b.testament === testament);
  }, [books, testament]);

  const currentBook = books[selectedBookIdx] ?? books[0];
  const chapterVerses = useMemo(
    () => getChapterVerses(translation, currentBook.id, selectedChapter),
    [translation, currentBook.id, selectedChapter]
  );

  const searchResults = useMemo(
    () => (tab === 'search' ? searchScripture(translation, searchQuery, 40) : []),
    [tab, translation, searchQuery]
  );

  const todayKey = toLocalDateKey();

  const handleSelectVerseTap = (verseNum: number) => {
    if (rangeStart === null) {
      setRangeStart(verseNum);
      setRangeEnd(verseNum);
    } else if (rangeStart === rangeEnd && verseNum !== rangeStart) {
      const s = Math.min(rangeStart, verseNum);
      const e = Math.max(rangeStart, verseNum);
      // Cap range at 10 verses so memorization cards stay practical
      setRangeStart(s);
      setRangeEnd(Math.min(e, s + 9));
    } else {
      setRangeStart(verseNum);
      setRangeEnd(verseNum);
    }
  };

  const handleCreateDeck = async () => {
    if (!deckName.trim()) return;
    const created = await createDeck(deckName, deckDesc, deckColor, deckIcon);
    setDeckName('');
    setDeckDesc('');
    setNewDeckModal(false);
    router.push({ pathname: '/deck/[id]', params: { id: created.id } });
  };

  const selectedStart = rangeStart ?? 1;
  const selectedEnd = rangeEnd ?? selectedStart;
  const selectedRef = formatReference(
    currentBook.id,
    selectedChapter,
    selectedStart,
    selectedEnd
  );

  const speakSelected = () => {
    const text = chapterVerses
      .filter((v) => v.verse >= selectedStart && v.verse <= selectedEnd)
      .map((v) => v.text)
      .join(' ');
    Speech.stop().catch(() => {});
    Speech.speak(`${selectedRef}. ${text}`, { language: 'en-US', rate: 0.92 });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Verse Library</Text>
        {tab === 'decks' && (
          <Pressable
            onPress={() => setNewDeckModal(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={18} color={colors.primaryText} />
            <Text style={[styles.addBtnText, { color: colors.primaryText }]}>New Deck</Text>
          </Pressable>
        )}
      </View>

      {/* Segmented Control */}
      <View style={[styles.segmentWrap, { backgroundColor: colors.surfaceMuted }]}>
        {(
          [
            { key: 'decks', label: 'Decks' },
            { key: 'bible', label: 'Bible Picker' },
            { key: 'search', label: 'Search' },
          ] as const
        ).map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[
                styles.segmentItem,
                active && { backgroundColor: colors.surface },
              ]}>
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

      {toast && (
        <View style={[styles.toast, { backgroundColor: colors.successSoft }]}>
          <Text style={{ color: colors.success, fontWeight: '600', fontSize: 13 }}>{toast}</Text>
        </View>
      )}

      {/* TAB 1: DECKS */}
      {tab === 'decks' && (
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          {decks.map((deck) => {
            const deckVerses = verses.filter((v) => v.deckId === deck.id);
            const learned = deckVerses.filter((v) => v.learned).length;
            const due = deckVerses.filter((v) => v.dueDate <= todayKey).length;
            const pct = deckVerses.length > 0 ? Math.round((learned / deckVerses.length) * 100) : 0;

            return (
              <Pressable
                key={deck.id}
                onPress={() =>
                  router.push({ pathname: '/deck/[id]', params: { id: deck.id } })
                }
                style={[
                  styles.deckCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.deckTop}>
                  <View style={[styles.deckIcon, { backgroundColor: `${deck.color}20` }]}>
                    <Ionicons name={deck.icon as never} size={22} color={deck.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.deckTitleRow}>
                      <Text style={[styles.deckTitle, { color: colors.text }]}>{deck.name}</Text>
                      <View
                        style={[
                          styles.kindPill,
                          {
                            backgroundColor: deck.isStarter
                              ? colors.surfaceMuted
                              : colors.primarySoft,
                          },
                        ]}>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: deck.isStarter ? colors.textSecondary : colors.primary,
                          }}>
                          {deck.isStarter ? 'STARTER' : 'CUSTOM'}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.deckDesc, { color: colors.textSecondary }]}
                      numberOfLines={2}>
                      {deck.description}
                    </Text>
                  </View>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${pct}%`, backgroundColor: deck.color },
                    ]}
                  />
                </View>

                <View style={styles.deckFooter}>
                  <Text style={[styles.deckMeta, { color: colors.textMuted }]}>
                    {deckVerses.length} {deckVerses.length === 1 ? 'verse' : 'verses'} • {learned}{' '}
                    learned
                  </Text>
                  {due > 0 && (
                    <Text style={[styles.dueTag, { color: colors.accent }]}>{due} due</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* TAB 2: BIBLE PICKER */}
      {tab === 'bible' && (
        <View style={{ flex: 1 }}>
          {/* Testament + Book selector */}
          <View style={styles.pickerControls}>
            <View style={styles.testamentRow}>
              {(['ALL', 'OT', 'NT'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTestament(t)}
                  style={[
                    styles.miniChip,
                    {
                      backgroundColor:
                        testament === t ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: testament === t ? colors.primaryText : colors.textSecondary,
                    }}>
                    {t === 'ALL' ? 'All 66' : t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}>
              {filteredBooks.map((b) => {
                const active = b.id === currentBook.id;
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => {
                      setSelectedBookIdx(b.id);
                      setSelectedChapter(1);
                      setRangeStart(1);
                      setRangeEnd(1);
                    }}
                    style={[
                      styles.bookChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: active ? colors.primaryText : colors.text,
                      }}>
                      {b.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Chapter Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}>
              {currentBook.chapters.map((_, idx) => {
                const ch = idx + 1;
                const active = ch === selectedChapter;
                return (
                  <Pressable
                    key={ch}
                    onPress={() => {
                      setSelectedChapter(ch);
                      setRangeStart(1);
                      setRangeEnd(1);
                    }}
                    style={[
                      styles.chapChip,
                      {
                        backgroundColor: active ? colors.accent : colors.surface,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: active ? '#FFF' : colors.textSecondary,
                      }}>
                      {ch}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Text style={[styles.rangeHint, { color: colors.textMuted }]}>
            Tap a verse, or tap a second verse to select a range (e.g. John 3:16-18).
          </Text>

          {/* Verses List */}
          <ScrollView contentContainerStyle={styles.chapterPad} showsVerticalScrollIndicator={false}>
            {chapterVerses.map((v) => {
              const isSelected =
                rangeStart !== null &&
                rangeEnd !== null &&
                v.verse >= rangeStart &&
                v.verse <= rangeEnd;

              return (
                <Pressable
                  key={v.verse}
                  onPress={() => handleSelectVerseTap(v.verse)}
                  style={[
                    styles.bibleVerseRow,
                    {
                      backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text style={[styles.verseNum, { color: colors.primary }]}>{v.verse}</Text>
                  <Text
                    style={[
                      styles.bibleVerseText,
                      {
                        color: colors.text,
                        fontSize: Math.max(15, verseTypography.fontSize - 2),
                        lineHeight: Math.max(22, verseTypography.lineHeight - 4),
                      },
                    ]}>
                    {v.text}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Sticky Action Bar for Selected Verse/Range */}
          {rangeStart !== null && (
            <View
              style={[
                styles.selectionBar,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectionRef, { color: colors.text }]}>{selectedRef}</Text>
                <Text style={[styles.selectionSub, { color: colors.textMuted }]}>
                  {translation} • {selectedEnd - selectedStart + 1} verse
                  {selectedEnd > selectedStart ? 's' : ''}
                </Text>
              </View>

              <Pressable
                onPress={speakSelected}
                style={[styles.barIconBtn, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="volume-high-outline" size={18} color={colors.text} />
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/share-card',
                    params: {
                      bookIndex: String(currentBook.id),
                      chapter: String(selectedChapter),
                      verseStart: String(selectedStart),
                      verseEnd: String(selectedEnd),
                    },
                  })
                }
                style={[styles.barIconBtn, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="share-social-outline" size={18} color={colors.text} />
              </Pressable>

              <Pressable
                onPress={() => {
                  setSearchPick(null);
                  setAddModalOpen(true);
                }}
                style={[styles.barAddBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="add" size={18} color={colors.primaryText} />
                <Text style={[styles.barAddText, { color: colors.primaryText }]}>Add to Deck</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* TAB 3: SEARCH */}
      {tab === 'search' && (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${translation} (e.g. "John 3:16" or "shepherd")`}
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 32, gap: 10 }}>
            {searchQuery.trim().length < 2 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Search Full {translation} Bible
                </Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Type a keyword or reference like “Romans 8:28” or “courage”.
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No matching verses</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Try another phrase or check spelling.
                </Text>
              </View>
            ) : (
              searchResults.map((hit) => (
                <View
                  key={`${hit.bookIndex}_${hit.chapter}_${hit.verse}`}
                  style={[
                    styles.searchHitCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <View style={styles.searchHitTop}>
                    <Text style={[styles.verseRef, { color: colors.primary }]}>
                      {hit.reference}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSearchPick({
                          bookIndex: hit.bookIndex,
                          chapter: hit.chapter,
                          verse: hit.verse,
                        });
                        setAddModalOpen(true);
                      }}
                      style={[styles.miniAddBtn, { backgroundColor: colors.primarySoft }]}>
                      <Ionicons name="add" size={15} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>
                        Add
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.searchHitText, { color: colors.text }]}>{hit.text}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* New Custom Deck Modal */}
      <Modal
        visible={newDeckModal}
        transparent
        animationType="slide"
        onRequestClose={() => setNewDeckModal(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Custom Deck</Text>
              <Pressable onPress={() => setNewDeckModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Deck Name</Text>
            <TextInput
              value={deckName}
              onChangeText={setDeckName}
              placeholder="e.g., Youth Fellowship, Sunday School"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              value={deckDesc}
              onChangeText={setDeckDesc}
              placeholder="Optional note about this collection"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Color & Icon</Text>
            <View style={styles.pickerRow}>
              {DECK_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setDeckColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    deckColor === c && { borderWidth: 3, borderColor: colors.text },
                  ]}
                />
              ))}
            </View>
            <View style={styles.pickerRow}>
              {DECK_ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setDeckIcon(ic)}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor:
                        deckIcon === ic ? `${deckColor}25` : colors.surfaceMuted,
                      borderColor: deckIcon === ic ? deckColor : 'transparent',
                    },
                  ]}>
                  <Ionicons
                    name={ic as never}
                    size={18}
                    color={deckIcon === ic ? deckColor : colors.textSecondary}
                  />
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleCreateDeck}
              style={[styles.createSubmitBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 15 }}>
                Create Deck
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AddToDeckModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        bookIndex={searchPick ? searchPick.bookIndex : currentBook.id}
        chapter={searchPick ? searchPick.chapter : selectedChapter}
        verseStart={searchPick ? searchPick.verse : selectedStart}
        verseEnd={searchPick ? searchPick.verse : selectedEnd}
        onAdded={(dName, exists) => {
          const ref = searchPick
            ? formatReference(searchPick.bookIndex, searchPick.chapter, searchPick.verse, searchPick.verse)
            : selectedRef;
          setToast(exists ? `${ref} is already in ${dName}.` : `Added ${ref} to ${dName}!`);
          setTimeout(() => setToast(null), 3000);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: { fontSize: 26, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: 18,
    padding: 4,
    borderRadius: 14,
    marginBottom: 10,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: { fontSize: 13, fontWeight: '700' },
  toast: {
    marginHorizontal: 18,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  scrollPad: { padding: 18, paddingTop: 6, gap: 12, paddingBottom: 32 },
  deckCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  deckTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  deckIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  deckTitle: { fontSize: 17, fontWeight: '800', flex: 1 },
  kindPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  deckDesc: { fontSize: 13, marginTop: 3, lineHeight: 18 },
  progressTrack: { height: 7, borderRadius: 999, marginTop: 14, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  deckFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  deckMeta: { fontSize: 12.5, fontWeight: '600' },
  dueTag: { fontSize: 12.5, fontWeight: '800' },

  pickerControls: { gap: 8, paddingBottom: 6 },
  testamentRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  miniChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  horizontalList: { paddingHorizontal: 16, gap: 8 },
  bookChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chapChip: {
    minWidth: 38,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  rangeHint: {
    fontSize: 12,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  chapterPad: { paddingHorizontal: 16, paddingBottom: 96, gap: 8 },
  bibleVerseRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  verseNum: { fontSize: 13, fontWeight: '800', width: 26, marginTop: 2 },
  bibleVerseText: { flex: 1, fontFamily: 'serif' },
  selectionBar: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
  },
  selectionRef: { fontSize: 14, fontWeight: '800' },
  selectionSub: { fontSize: 11.5, marginTop: 1 },
  barIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
  },
  barAddText: { fontSize: 13, fontWeight: '800' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  emptyState: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
  searchHitCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  searchHitTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verseRef: { fontSize: 14, fontWeight: '800' },
  miniAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  searchHitText: { fontSize: 14.5, lineHeight: 21, fontFamily: 'serif' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  inputLabel: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  pickerRow: { flexDirection: 'row', gap: 12, marginVertical: 4 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSubmitBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
});
