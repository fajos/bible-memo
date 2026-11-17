import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/useAppTheme';
import { formatTimeLabel } from '@/lib/date';
import type { AutoSnapshotMeta } from '@/lib/db';
import { hapticSelection, hapticSuccess } from '@/lib/haptics';
import { sendTestReminderAsync } from '@/lib/notifications';
import {
  applyUpdateAsync,
  checkAndFetchUpdateAsync,
  getUpdateStatus,
} from '@/lib/updates';
import { useAppStore } from '@/store/useAppStore';
import type { FontSizeOption, ThemePreference, Translation } from '@/types/models';

export default function SettingsScreen() {
  const { colors, verseTypography } = useAppTheme();
  const settings = useAppStore((s) => s.settings);
  const verses = useAppStore((s) => s.verses);
  const decks = useAppStore((s) => s.decks);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const exportBackup = useAppStore((s) => s.exportBackup);
  const importBackup = useAppStore((s) => s.importBackup);
  const createLocalSnapshot = useAppStore((s) => s.createLocalSnapshot);
  const getAutoSnapshots = useAppStore((s) => s.getAutoSnapshots);
  const restoreLocalSnapshot = useAppStore((s) => s.restoreLocalSnapshot);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [snapshots, setSnapshots] = useState<AutoSnapshotMeta[]>([]);
  const updateInfo = getUpdateStatus();

  React.useEffect(() => {
    void getAutoSnapshots().then(setSnapshots);
  }, [getAutoSnapshots]);

  const handleCreateSnapshot = async () => {
    hapticSelection();
    try {
      await createLocalSnapshot();
      const updated = await getAutoSnapshots();
      setSnapshots(updated);
      hapticSuccess();
      showStatus('Local snapshot created successfully!');
    } catch (err) {
      showStatus(err instanceof Error ? err.message : 'Snapshot failed.');
    }
  };

  const handleRestoreSnapshot = async (id: string) => {
    hapticSelection();
    const confirm = async () => {
      const ok = await restoreLocalSnapshot(id);
      if (ok) {
        hapticSuccess();
        showStatus('Snapshot restored! Your decks & verses are restored.');
      } else {
        showStatus('Failed to restore snapshot.');
      }
    };
    if (Platform.OS === 'web') {
      void confirm();
      return;
    }
    Alert.alert('Restore Snapshot', 'Restore data from this local snapshot?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', style: 'default', onPress: () => void confirm() },
    ]);
  };

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleToggleReminder = async (enabled: boolean) => {
    const res = await updateSettings({ reminderEnabled: enabled });
    if (res.reminderError) {
      showStatus(res.reminderError);
    } else if (enabled) {
      showStatus(
        `Daily reminder set for ${formatTimeLabel(settings.reminderHour, settings.reminderMinute)}.`
      );
    }
  };

  const shiftTime = async (deltaMinutes: number) => {
    const total = (settings.reminderHour * 60 + settings.reminderMinute + deltaMinutes + 1440) % 1440;
    const hour = Math.floor(total / 60);
    const minute = total % 60;
    const res = await updateSettings({ reminderHour: hour, reminderMinute: minute });
    if (res.reminderError) showStatus(res.reminderError);
  };

  const handleExport = async () => {
    try {
      await exportBackup();
      showStatus('Backup JSON exported successfully!');
    } catch (err) {
      showStatus(err instanceof Error ? err.message : 'Export failed.');
    }
  };

  const handleImport = async () => {
    try {
      const ok = await importBackup();
      if (ok) {
        showStatus('Backup restored! Your decks, streaks, and progress are loaded.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed.';
      if (Platform.OS === 'web') showStatus(msg);
      else Alert.alert('Restore Failed', msg);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const res = await checkAndFetchUpdateAsync();
      showStatus(res.message);
      if (res.isAvailable) {
        setUpdateReady(true);
      }
    } catch (err) {
      showStatus(err instanceof Error ? err.message : 'Update check failed.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleApplyUpdate = async () => {
    try {
      await applyUpdateAsync();
    } catch (err) {
      showStatus(err instanceof Error ? err.message : 'Failed to reload app.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {statusMsg && (
          <View style={[styles.statusBanner, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
              {statusMsg}
            </Text>
          </View>
        )}

        {/* Translation */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          BIBLE TRANSLATION (PUBLIC DOMAIN)
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={styles.optionRow}>
            {(['KJV', 'WEB'] as Translation[]).map((tr) => {
              const active = settings.translation === tr;
              return (
                <Pressable
                  key={tr}
                  onPress={() => void updateSettings({ translation: tr })}
                  style={[
                    styles.choiceBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceMuted,
                    },
                  ]}>
                  <Text
                    style={{
                      fontWeight: '800',
                      color: active ? colors.primaryText : colors.text,
                    }}>
                    {tr === 'KJV' ? 'KJV (Classic)' : 'WEB (Modern)'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Theme</Text>
          <View style={styles.optionRow}>
            {(['system', 'light', 'dark'] as ThemePreference[]).map((mode) => {
              const active = settings.themeMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => void updateSettings({ themeMode: mode })}
                  style={[
                    styles.choiceBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceMuted,
                    },
                  ]}>
                  <Text
                    style={{
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      color: active ? colors.primaryText : colors.text,
                    }}>
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.cardTitle, { color: colors.text, marginTop: 14 }]}>
            Verse Font Size
          </Text>
          <View style={styles.optionRow}>
            {(
              [
                { key: 'small', label: 'S' },
                { key: 'medium', label: 'M' },
                { key: 'large', label: 'L' },
                { key: 'xlarge', label: 'XL' },
              ] as { key: FontSizeOption; label: string }[]
            ).map((sz) => {
              const active = settings.fontSize === sz.key;
              return (
                <Pressable
                  key={sz.key}
                  onPress={() => void updateSettings({ fontSize: sz.key })}
                  style={[
                    styles.choiceBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceMuted,
                    },
                  ]}>
                  <Text
                    style={{
                      fontWeight: '800',
                      color: active ? colors.primaryText : colors.text,
                    }}>
                    {sz.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={[
              styles.previewVerse,
              {
                color: colors.textSecondary,
                backgroundColor: colors.background,
                fontSize: verseTypography.fontSize,
                lineHeight: verseTypography.lineHeight,
              },
            ]}>
            “Thy word is a lamp unto my feet, and a light unto my path.”
          </Text>
        </View>

        {/* Tactile Feel / Haptics */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TACTILE FEEL</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Haptic Feedback</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Tactile vibrations for keyboard typing recall, card flips, and quiz results
              </Text>
            </View>
            <Switch
              value={settings.hapticsEnabled !== false}
              onValueChange={(val) => {
                hapticSelection();
                void updateSettings({ hapticsEnabled: val });
              }}
              trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
            />
          </View>
        </View>

        {/* Daily Reminder */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DAILY REMINDER</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Daily Study Notification
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Gentle nudge to review due verses & Verse of the Day
              </Text>
            </View>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
            />
          </View>

          <View style={[styles.timeRow, { borderTopColor: colors.border }]}>
            <View>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>Reminder Time</Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>
                {formatTimeLabel(settings.reminderHour, settings.reminderMinute)}
              </Text>
            </View>

            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => void shiftTime(-30)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>-30m</Text>
              </Pressable>
              <Pressable
                onPress={() => void shiftTime(30)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>+30m</Text>
              </Pressable>
            </View>
          </View>

          {Platform.OS !== 'web' && (
            <Pressable
              onPress={async () => {
                const ok = await sendTestReminderAsync(settings.translation);
                showStatus(
                  ok
                    ? 'Test notification scheduled in 2 seconds!'
                    : 'Please enable notification permissions first.'
                );
              }}
              style={[styles.secondaryBtn, { borderColor: colors.border }]}>
              <Ionicons name="notifications-outline" size={17} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                Send Test Notification
              </Text>
            </Pressable>
          )}
        </View>

        {/* App Updates (EAS Update) */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          OVER-THE-AIR UPDATES
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>EAS Update Status</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                {updateInfo.isEnabled
                  ? `Channel: ${updateInfo.channel ?? 'production'} • v${updateInfo.runtimeVersion ?? '1.0.0'}`
                  : updateInfo.isEmbeddedLaunch
                  ? 'Running local build (OTA updates disabled in dev)'
                  : 'Web / Development mode'}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: updateInfo.isEnabled ? colors.primarySoft : colors.surfaceMuted,
              }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: updateInfo.isEnabled ? colors.primary : colors.textMuted,
                }}>
                {updateInfo.isEnabled ? 'OTA Active' : 'Dev / Web'}
              </Text>
            </View>
          </View>

          {updateReady ? (
            <Pressable
              onPress={handleApplyUpdate}
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.primary, borderColor: colors.primary, marginTop: 12 },
              ]}>
              <Ionicons name="refresh" size={17} color={colors.primaryText} />
              <Text style={{ color: colors.primaryText, fontWeight: '800' }}>
                Restart & Apply Downloaded Update
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleCheckUpdate}
              disabled={checkingUpdate}
              style={[styles.secondaryBtn, { borderColor: colors.border, marginTop: 12 }]}>
              {checkingUpdate ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="cloud-download-outline" size={17} color={colors.primary} />
              )}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {checkingUpdate ? 'Checking for Updates...' : 'Check for Updates Now'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Backup & Export */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          BACKUP & EXPORT (OFFLINE JSON)
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <Text style={[styles.cardSub, { color: colors.textSecondary, marginBottom: 12 }]}>
            No accounts, no cloud servers. Export all {decks.length} decks and {verses.length}{' '}
            verses to a portable JSON file anytime.
          </Text>

          <View style={styles.backupActions}>
            <Pressable
              onPress={handleExport}
              style={[styles.backupBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="download-outline" size={18} color={colors.primaryText} />
              <Text style={{ color: colors.primaryText, fontWeight: '800' }}>Export JSON</Text>
            </Pressable>

            <Pressable
              onPress={handleImport}
              style={[styles.backupBtn, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name="cloud-upload-outline" size={18} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '800' }}>Import JSON</Text>
            </Pressable>
          </View>
        </View>

        {/* Local Auto-Snapshots */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          LOCAL DATABASE SNAPSHOTS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <Text style={[styles.cardSub, { color: colors.textSecondary, marginBottom: 12 }]}>
            Rolling offline snapshots saved directly inside local device SQLite storage.
          </Text>

          <Pressable
            onPress={handleCreateSnapshot}
            style={[styles.secondaryBtn, { borderColor: colors.primary, marginTop: 0, marginBottom: 12 }]}>
            <Ionicons name="shield-checkmark-outline" size={17} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '800' }}>Create Local Snapshot Now</Text>
          </Pressable>

          {snapshots.length > 0 ? (
            <View style={{ gap: 8 }}>
              {snapshots.map((snap) => {
                const dateStr = new Date(snap.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <View
                    key={snap.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: colors.surfaceMuted,
                    }}>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                        {dateStr}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                        {snap.versesCount} verses backed up
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleRestoreSnapshot(snap.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                        Restore
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
              No snapshots created yet. Tap above to create your first safety point.
            </Text>
          )}
        </View>

        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Selah Scripture Memory • 100% Free & Offline • KJV & WEB Public Domain
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 18, gap: 12, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  statusBanner: { padding: 12, borderRadius: 12 },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.9, marginTop: 6 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  cardSub: { fontSize: 13, lineHeight: 18 },
  optionRow: { flexDirection: 'row', gap: 8 },
  choiceBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewVerse: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    fontFamily: 'serif',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  timeValue: { fontSize: 19, fontWeight: '800', marginTop: 2 },
  stepperRow: { flexDirection: 'row', gap: 8 },
  stepBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  secondaryBtn: {
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backupActions: { flexDirection: 'row', gap: 10 },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 13,
  },
  footerNote: { textAlign: 'center', fontSize: 12, marginTop: 10 },
});
