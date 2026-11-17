import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MasteryPill } from '@/components/MasteryPill';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getVerseText } from '@/lib/bible';
import { toLocalDateKey } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();

  const decks = useAppStore((s) => s.decks);
  const verses = useAppStore((s) => s.verses);
  const translation = useAppStore((s) => s.settings.translation);
  const deleteDeck = useAppStore((s) => s.deleteDeck);
  const deleteVerse = useAppStore((s) => s.deleteVerse);

  const deck = decks.find((d) => d.id === id);
  const deckVerses = verses.filter((v) => v.deckId === id);
  const todayKey = toLocalDateKey();
  const dueCount = deckVerses.filter((v) => v.dueDate <= todayKey).length;
  const learnedCount = deckVerses.filter((v) => v.learned).length;

  if (!deck) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Deck not found.</Text>
      </View>
    );
  }

  const handleDeleteDeck = () => {
    const confirmDelete = async () => {
      await deleteDeck(deck.id);
      router.back();
    };
    if (Platform.OS === 'web') {
      void confirmDelete();
      return;
    }
    Alert.alert('Delete Deck', `Delete "${deck.name}" and its verses?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void confirmDelete() },
    ]);
  };

  const handleDeleteVerse = (verseId: string, ref: string) => {
    if (Platform.OS === 'web') {
      void deleteVerse(verseId);
      return;
    }
    Alert.alert('Remove Verse', `Remove ${ref} from ${deck.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void deleteVerse(verseId) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: deck.name, headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Deck Hero */}
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={styles.heroTop}>
            <View style={[styles.iconBox, { backgroundColor: `${deck.color}20` }]}>
              <Ionicons name={deck.icon as never} size={26} color={deck.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deckTitle, { color: colors.text }]}>{deck.name}</Text>
              <Text style={[styles.deckDesc, { color: colors.textSecondary }]}>
                {deck.description}
              </Text>
            </View>
            {!deck.isStarter && (
              <Pressable onPress={handleDeleteDeck} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            )}
          </View>

          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {deckVerses.length} verses
            </Text>
            <Text style={[styles.statText, { color: colors.success }]}>
              {learnedCount} learned
            </Text>
            <Text style={[styles.statText, { color: colors.accent }]}>{dueCount} due</Text>
          </View>

          <View style={styles.heroBtns}>
            {deckVerses.length > 0 && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/learn/[verseId]',
                    params: { verseId: deckVerses[0].id },
                  })
                }
                style={[styles.primaryBtn, { backgroundColor: deck.color }]}>
                <Ionicons name="book-outline" size={17} color="#FFF" />
                <Text style={styles.primaryBtnText}>Learn First</Text>
              </Pressable>
            )}
            {deckVerses.length > 0 && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/verse-quiz',
                    params: { deckId: deck.id, mode: 'mixed' },
                  })
                }
                style={[styles.secondaryBtn, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="extension-puzzle-outline" size={17} color={colors.primary} />
                <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                  Quiz Deck
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.text }]}>Verses in Deck</Text>
          <Pressable onPress={() => router.push('/(tabs)/library')}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
              + Add from Bible
            </Text>
          </Pressable>
        </View>

        {deckVerses.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No verses yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Open the Bible Picker or Search tab in Library to add single verses or ranges to this
              deck.
            </Text>
          </View>
        ) : (
          deckVerses.map((v) => {
            const text = getVerseText(
              translation,
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
                  styles.verseCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.verseTop}>
                  <Text style={[styles.verseRef, { color: colors.text }]}>{v.reference}</Text>
                  <View style={styles.verseRight}>
                    <MasteryPill mastery={v.mastery} />
                    <Pressable
                      onPress={() => handleDeleteVerse(v.id, v.reference)}
                      hitSlop={8}>
                      <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>

                <Text style={[styles.verseBody, { color: colors.textSecondary }]} numberOfLines={3}>
                  “{text}”
                </Text>

                <View style={styles.verseActions}>
                  <Text style={[styles.dueMeta, { color: colors.textMuted }]}>
                    {v.dueDate <= todayKey ? 'Due now' : `Next due: ${v.dueDate}`}
                  </Text>
                  <View style={styles.verseActionLinks}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/share-card',
                          params: {
                            bookIndex: String(v.bookIndex),
                            chapter: String(v.chapter),
                            verseStart: String(v.verseStart),
                            verseEnd: String(v.verseEnd),
                          },
                        })
                      }>
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12.5 }}>
                        Share
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/learn/[verseId]',
                          params: { verseId: v.id },
                        })
                      }>
                      <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 12.5 }}>
                        Learn →
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, gap: 12, paddingBottom: 36 },
  hero: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 14 },
  heroTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckTitle: { fontSize: 20, fontWeight: '800' },
  deckDesc: { fontSize: 13.5, marginTop: 3, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statText: { fontSize: 13, fontWeight: '700' },
  heroBtns: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 13,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 13,
  },
  secondaryBtnText: { fontWeight: '800', fontSize: 14 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  listTitle: { fontSize: 17, fontWeight: '800' },
  emptyCard: { borderRadius: 18, borderWidth: 1, padding: 20, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13.5, textAlign: 'center', lineHeight: 19 },
  verseCard: { borderRadius: 18, borderWidth: 1, padding: 15, gap: 8 },
  verseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verseRef: { fontSize: 16, fontWeight: '800' },
  verseRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verseBody: { fontSize: 14, lineHeight: 20, fontFamily: 'serif' },
  verseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dueMeta: { fontSize: 12, fontWeight: '600' },
  verseActionLinks: { flexDirection: 'row', gap: 14 },
});
