import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { formatReference, getVerseText } from '@/lib/bible';
import { useAppStore } from '@/store/useAppStore';

interface AddToDeckModalProps {
  visible: boolean;
  onClose: () => void;
  bookIndex: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  onAdded?: (deckName: string, alreadyExists: boolean) => void;
}

const DECK_COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

export function AddToDeckModal({
  visible,
  onClose,
  bookIndex,
  chapter,
  verseStart,
  verseEnd,
  onAdded,
}: AddToDeckModalProps) {
  const { colors } = useAppTheme();
  const decks = useAppStore((s) => s.decks);
  const translation = useAppStore((s) => s.settings.translation);
  const addVerseToDeck = useAppStore((s) => s.addVerseToDeck);
  const createDeck = useAppStore((s) => s.createDeck);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DECK_COLORS[0]);

  const refLabel = formatReference(bookIndex, chapter, verseStart, verseEnd);
  const previewText = getVerseText(translation, bookIndex, chapter, verseStart, verseEnd);

  const handleSelectDeck = async (deckId: string, deckName: string) => {
    const res = await addVerseToDeck({
      deckId,
      bookIndex,
      chapter,
      verseStart,
      verseEnd,
    });
    onAdded?.(deckName, res.alreadyExists);
    onClose();
  };

  const handleCreateAndAdd = async () => {
    if (!newName.trim()) return;
    const deck = await createDeck(newName.trim(), 'Custom deck', selectedColor, 'bookmarks');
    await addVerseToDeck({
      deckId: deck.id,
      bookIndex,
      chapter,
      verseStart,
      verseEnd,
    });
    setNewName('');
    setCreating(false);
    onAdded?.(deck.name, false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Add to Deck</Text>
              <Text style={[styles.subtitle, { color: colors.primary }]}>{refLabel}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text
            style={[styles.preview, { color: colors.textSecondary, backgroundColor: colors.surfaceMuted }]}
            numberOfLines={3}>
            “{previewText}”
          </Text>

          {creating ? (
            <View style={styles.createBox}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>New Deck Name</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g., Youth Fellowship"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                autoFocus
              />
              <View style={styles.colorRow}>
                {DECK_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      selectedColor === c && { borderWidth: 3, borderColor: colors.text },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.createActions}>
                <Pressable
                  onPress={() => setCreating(false)}
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateAndAdd}
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: colors.primaryText, fontWeight: '700' }}>Create & Add</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {decks.map((d) => (
                  <Pressable
                    key={d.id}
                    onPress={() => handleSelectDeck(d.id, d.name)}
                    style={[
                      styles.deckRow,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}>
                    <View style={[styles.deckIcon, { backgroundColor: `${d.color}20` }]}>
                      <Ionicons name={d.icon as never} size={18} color={d.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.deckName, { color: colors.text }]}>{d.name}</Text>
                      <Text style={[styles.deckMeta, { color: colors.textMuted }]}>
                        {d.isStarter ? 'Starter Pack' : 'Custom Deck'}
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                onPress={() => setCreating(true)}
                style={[styles.newDeckBtn, { borderColor: colors.primary }]}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={[styles.newDeckText, { color: colors.primary }]}>
                  Create New Custom Deck
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  preview: {
    padding: 12,
    borderRadius: 12,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 14,
    lineHeight: 19,
  },
  list: {
    maxHeight: 280,
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  deckIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deckName: {
    fontSize: 15,
    fontWeight: '600',
  },
  deckMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  newDeckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 6,
  },
  newDeckText: {
    fontSize: 14,
    fontWeight: '700',
  },
  createBox: {
    gap: 12,
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  createActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
});
