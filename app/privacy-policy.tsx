import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/useAppTheme';

export default function PrivacyPolicyScreen() {
  const { colors } = useAppTheme();

  const handleOpenOnline = () => {
    void Linking.openURL('https://github.com/fajos/bible-memo/blob/main/PRIVACY_POLICY.md');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.pillBadge, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={[styles.pillBadgeText, { color: colors.primary }]}>Zero Data Collection</Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="cloud-offline" size={14} color={colors.textSecondary} />
            <Text style={[styles.pillBadgeText, { color: colors.textSecondary }]}>100% Offline</Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="person-remove" size={14} color={colors.textSecondary} />
            <Text style={[styles.pillBadgeText, { color: colors.textSecondary }]}>No Accounts</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
        <Text style={[styles.effectiveDate, { color: colors.textSecondary }]}>
          Last Updated: November 19, 2026
        </Text>

        <Text style={[styles.paragraph, { color: colors.text }]}>
          Selah Scripture Memory is built with a strict <Text style={styles.bold}>privacy-first and offline-first</Text> philosophy.
          We believe that your personal prayer, spiritual meditation, and scripture memorization habits are private and belong solely to you.
        </Text>

        {/* Section 1 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>1. Zero Data Collection</Text>
          </View>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>No Personal Info:</Text> We do not collect, store, sell, or transmit any personally identifiable information (name, email, phone, location, contacts).
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>No Accounts:</Text> You do not need to register, log in, or link any third-party accounts (Apple, Google, etc.) to use any feature.
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>No Tracking or Ads:</Text> We do not use third-party analytics trackers, cookies, behavioral profiling, or advertising identifier frameworks (such as Apple IDFA or Google AAID).
          </Text>
        </View>

        {/* Section 2 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>2. On-Device Local Storage</Text>
          </View>
          <Text style={[styles.paragraphInCard, { color: colors.textSecondary }]}>
            All your data stays strictly on your physical device inside isolated SQLite storage:
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>What is stored locally:</Text> Your custom decks, memorized verses, review intervals (SM-2 repetitions), quiz scores, study streaks, personal notes, and tags.
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>Full User Ownership:</Text> You can export a full JSON backup file of your entire database anytime via <Text style={styles.bold}>Settings &gt; Backup &amp; Export</Text>, or delete any deck or verse at will.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>3. Permissions &amp; Capabilities</Text>
          </View>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>Daily Reminders:</Text> Scheduled locally using your device&apos;s notification system. No push tokens or remote servers are involved.
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>Audio Narration:</Text> Reads verses aloud using your device’s on-device text-to-speech engine. No audio is ever recorded or uploaded.
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>Haptics &amp; Sharing:</Text> Vibration is used for tactile keyboard recall and quiz feedback. Sharing verse cards hands off directly to your device&apos;s native share sheet.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="wifi-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>4. Network Usage</Text>
          </View>
          <Text style={[styles.paragraphInCard, { color: colors.textSecondary }]}>
            The app is fully functional without internet. When connected, network activity is limited strictly to checking for over-the-air code updates (EAS Update) to download software fixes and scripture enhancements. No personal identifiers are sent.
          </Text>
        </View>

        {/* Section 5 & 6 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>5. Children&apos;s Privacy (COPPA)</Text>
          </View>
          <Text style={[styles.paragraphInCard, { color: colors.textSecondary }]}>
            Because Selah Scripture Memory collects zero personal information, displays zero ads, and contains zero in-app purchases, it is safe for users of all ages, including children under 13.
          </Text>
        </View>

        {/* Open Source Button */}
        <Pressable
          onPress={handleOpenOnline}
          style={[styles.linkBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="logo-github" size={18} color={colors.primary} />
          <Text style={[styles.linkBtnText, { color: colors.primary }]}>
            View Privacy Policy on GitHub
          </Text>
          <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, gap: 14, paddingBottom: 40 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillBadgeText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '800' },
  effectiveDate: { fontSize: 13, marginTop: -4, marginBottom: 4 },
  paragraph: { fontSize: 14.5, lineHeight: 22 },
  paragraphInCard: { fontSize: 13.5, lineHeight: 20, marginBottom: 8 },
  bold: { fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  bullet: { fontSize: 13.5, lineHeight: 20 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  linkBtnText: { fontSize: 14, fontWeight: '700' },
});
