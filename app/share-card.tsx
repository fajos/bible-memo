import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';

import { SHARE_CARD_THEMES } from '@/constants/Theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatReference, getVerseText } from '@/lib/bible';
import { useAppStore } from '@/store/useAppStore';

export default function ShareCardScreen() {
  const params = useLocalSearchParams<{
    bookIndex?: string;
    chapter?: string;
    verseStart?: string;
    verseEnd?: string;
  }>();

  const { colors } = useAppTheme();
  const translation = useAppStore((s) => s.settings.translation);
  const markSharedCard = useAppStore((s) => s.markSharedCard);

  const bookIndex = Number(params.bookIndex ?? 42);
  const chapter = Number(params.chapter ?? 3);
  const verseStart = Number(params.verseStart ?? 16);
  const verseEnd = Number(params.verseEnd ?? verseStart);

  const reference = formatReference(bookIndex, chapter, verseStart, verseEnd);
  const text = getVerseText(translation, bookIndex, chapter, verseStart, verseEnd);

  const [themeIndex, setThemeIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const shotRef = useRef<ViewShotRef | null>(null);
  const cardTheme = SHARE_CARD_THEMES[themeIndex];

  const handleShareText = async () => {
    try {
      await Share.share({
        message: `“${text}”\n— ${reference} (${translation})`,
      });
      await markSharedCard();
    } catch {
      // cancelled
    }
  };

  const handleShareImage = async () => {
    if (Platform.OS === 'web') {
      await handleShareText();
      setFeedback('Image capture runs on iOS/Android; shared verse text instead!');
      return;
    }

    try {
      const uri = await shotRef.current?.capture?.();
      if (!uri) {
        setFeedback('Could not render image card.');
        return;
      }
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        await handleShareText();
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Share ${reference}`,
      });
      await markSharedCard();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to share image.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      {/* Live ViewShot Verse Card */}
      <ViewShot
        ref={shotRef}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        style={styles.shotWrapper}>
        <View
          style={[
            styles.cardCanvas,
            { backgroundColor: cardTheme.bg, borderColor: cardTheme.border },
          ]}>
          <View style={styles.cardTopDecor}>
            <View style={[styles.accentBar, { backgroundColor: cardTheme.accent }]} />
            <Text style={[styles.translationBadge, { color: cardTheme.accent }]}>
              {translation}
            </Text>
          </View>

          <Text style={[styles.cardVerseText, { color: cardTheme.text }]}>“{text}”</Text>

          <View style={styles.cardFooter}>
            <Text style={[styles.cardRef, { color: cardTheme.accent }]}>— {reference}</Text>
            <Text style={[styles.watermark, { color: cardTheme.muted }]}>
              Selah Scripture Memory
            </Text>
          </View>
        </View>
      </ViewShot>

      {/* Theme Selector */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>CARD STYLE</Text>
      <View style={styles.themeRow}>
        {SHARE_CARD_THEMES.map((t, idx) => {
          const active = idx === themeIndex;
          return (
            <Pressable
              key={t.id}
              onPress={() => setThemeIndex(idx)}
              style={[
                styles.themeChip,
                {
                  backgroundColor: t.bg,
                  borderColor: active ? colors.primary : t.border,
                  borderWidth: active ? 2.5 : 1,
                },
              ]}>
              <Text style={{ color: t.text, fontSize: 12, fontWeight: '700' }}>{t.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {feedback && (
        <Text style={[styles.feedback, { color: colors.primary }]}>{feedback}</Text>
      )}

      {/* Share Buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleShareImage}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="image-outline" size={20} color={colors.primaryText} />
          <Text style={{ color: colors.primaryText, fontWeight: '800', fontSize: 15 }}>
            Share as Image Card
          </Text>
        </Pressable>

        <Pressable
          onPress={handleShareText}
          style={[
            styles.secondaryBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.text} />
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
            Share as Text
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  shotWrapper: { borderRadius: 24, overflow: 'hidden' },
  cardCanvas: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 26,
    minHeight: 280,
    justifyContent: 'space-between',
    gap: 22,
  },
  cardTopDecor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accentBar: { width: 38, height: 4, borderRadius: 999 },
  translationBadge: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  cardVerseText: {
    fontSize: 20,
    lineHeight: 31,
    fontFamily: 'serif',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardRef: { fontSize: 15, fontWeight: '800' },
  watermark: { fontSize: 11, fontWeight: '600' },
  label: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.9, marginTop: 4 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  feedback: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  actions: { gap: 10, marginTop: 4 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 15,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 15,
    borderWidth: 1,
  },
});
