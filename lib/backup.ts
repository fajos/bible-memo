import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { toLocalDateKey } from '@/lib/date';
import type { BackupPayload } from '@/types/models';

export async function exportBackupJsonAsync(payload: BackupPayload): Promise<void> {
  const filename = `selah-backup-${toLocalDateKey()}.json`;
  const json = JSON.stringify(payload, null, 2);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  await file.write(json);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Scripture Memory Backup',
    UTI: 'public.json',
  });
}

export async function pickAndParseBackupAsync(): Promise<BackupPayload | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  let rawText = '';

  if (Platform.OS === 'web') {
    if (asset.file) {
      rawText = await asset.file.text();
    } else {
      const response = await fetch(asset.uri);
      rawText = await response.text();
    }
  } else {
    const pickedFile = new File(asset.uri);
    rawText = await pickedFile.text();
  }

  const parsed = JSON.parse(rawText) as Partial<BackupPayload>;
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray(parsed.decks) ||
    !Array.isArray(parsed.verses)
  ) {
    throw new Error('Selected file is not a valid Selah backup JSON.');
  }

  return {
    version: parsed.version ?? 1,
    exportedAt: parsed.exportedAt ?? new Date().toISOString(),
    decks: parsed.decks,
    verses: parsed.verses,
    reviewLogs: Array.isArray(parsed.reviewLogs) ? parsed.reviewLogs : [],
    quizSessions: Array.isArray(parsed.quizSessions) ? parsed.quizSessions : [],
    dailyActivity: Array.isArray(parsed.dailyActivity) ? parsed.dailyActivity : [],
    badges: Array.isArray(parsed.badges) ? parsed.badges : [],
    settings: parsed.settings ?? {
      translation: 'KJV',
      themeMode: 'system',
      fontSize: 'medium',
      reminderEnabled: false,
      reminderHour: 8,
      reminderMinute: 0,
      hasSharedCard: false,
    },
  };
}
