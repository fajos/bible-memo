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

export default function TermsOfUseScreen() {
  const { colors } = useAppTheme();

  const handleOpenOnline = () => {
    void Linking.openURL('https://github.com/fajos/bible-memo/blob/main/TERMS_OF_USE.md');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.pillBadge, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="book" size={14} color={colors.primary} />
            <Text style={[styles.pillBadgeText, { color: colors.primary }]}>Public Domain Texts</Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="gift-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.pillBadgeText, { color: colors.textSecondary }]}>Free &amp; Open</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Terms of Use</Text>
        <Text style={[styles.effectiveDate, { color: colors.textSecondary }]}>
          Last Updated: November 19, 2026
        </Text>

        <Text style={[styles.paragraph, { color: colors.text }]}>
          Please read these Terms of Use before using Selah Scripture Memory. By downloading or using the app, you agree to these terms.
        </Text>

        {/* Section 1 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            By downloading, installing, accessing, or using Selah Scripture Memory, you agree to be bound by these Terms of Use. If you do not agree, please do not use the application.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="library-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>2. Public Domain Scripture</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            The Bible translations packaged with the application are in the public domain:
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>King James Version (KJV):</Text> Public domain worldwide.
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>World English Bible (WEB):</Text> Dedicated to the public domain by Rainbow Missions, Inc.
          </Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary, marginTop: 4 }]}>
            You are free to read, memorize, quote, share, and distribute these scripture texts without copyright restrictions.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="code-slash-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>3. License &amp; Open Source</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            The source code and design are provided as open source under the terms of the project’s license. You may inspect, fork, and contribute in accordance with the repository terms.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="save-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>4. User Backup Responsibility</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Because Selah Scripture Memory operates completely offline without cloud servers or accounts, you are solely responsible for backing up your data.
          </Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Please use the built-in <Text style={styles.bold}>Export JSON</Text> feature in Settings to safely preserve your decks and verses. The developers cannot recover data lost due to device resets or app deletion.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>5. Disclaimer of Warranties</Text>
          </View>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            THE APPLICATION IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT SHALL THE AUTHORS OR CONTRIBUTORS BE LIABLE FOR ANY CLAIM, DAMAGES, OR LIABILITY ARISING FROM USE OF THE APPLICATION.
          </Text>
        </View>

        {/* Section 6 - Developer & Contact */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>6. Developer &amp; Contact Information</Text>
          </View>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>Developer / Publisher:</Text> Femi Adeyemi / Fajostech
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>Email:</Text>{' '}
            <Text
              onPress={() => void Linking.openURL('mailto:fajostech@gmail.com')}
              style={{ color: colors.primary, fontWeight: '700' }}>
              fajostech@gmail.com
            </Text>
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>Website:</Text>{' '}
            <Text
              onPress={() => void Linking.openURL('https://fajostech.com')}
              style={{ color: colors.primary, fontWeight: '700' }}>
              https://fajostech.com
            </Text>
          </Text>
          <Text style={[styles.bullet, { color: colors.text }]}>
            • <Text style={styles.bold}>Repository &amp; Issues:</Text>{' '}
            <Text
              onPress={() => void Linking.openURL('https://github.com/fajos/bible-memo/issues')}
              style={{ color: colors.primary, fontWeight: '700' }}>
              https://github.com/fajos/bible-memo
            </Text>
          </Text>
        </View>

        {/* Open Source Button */}
        <Pressable
          onPress={handleOpenOnline}
          style={[styles.linkBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="logo-github" size={18} color={colors.primary} />
          <Text style={[styles.linkBtnText, { color: colors.primary }]}>
            View Terms of Use on GitHub
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
  bold: { fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardBody: { fontSize: 13.5, lineHeight: 20 },
  bullet: { fontSize: 13.5, lineHeight: 20 },
  disclaimerText: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
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
