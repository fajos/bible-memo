import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { getVerseText } from '@/lib/bible';
import { toLocalDateKey } from '@/lib/date';
import type { BackupPayload, Deck, MemorizedVerse, Translation } from '@/types/models';

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

export async function exportDeckCsvAsync(
  deck: Deck,
  verses: MemorizedVerse[],
  translation: Translation
): Promise<void> {
  const header = 'Reference,Text,Translation,Deck,Mastery,Learned,Notes\n';
  const rows = verses.map((v) => {
    const text = getVerseText(translation, v.bookIndex, v.chapter, v.verseStart, v.verseEnd)
      .replace(/"/g, '""');
    const notes = (v.notes ?? '').replace(/"/g, '""');
    return `"${v.reference}","${text}","${translation}","${deck.name}",${v.mastery}%,${v.learned ? 'Yes' : 'No'},"${notes}"`;
  });

  const csv = header + rows.join('\n');
  const safeDeckName = deck.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeDeckName}-verses.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv' });
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
  await file.write(csv);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: `Export ${deck.name} (CSV)`,
    UTI: 'public.comma-separated-values-text',
  });
}

export async function exportDeckPrintableTextAsync(
  deck: Deck,
  verses: MemorizedVerse[],
  translation: Translation
): Promise<void> {
  const lines: string[] = [
    `============================================================`,
    ` SELAH SCRIPTURE MEMORY: ${deck.name.toUpperCase()}`,
    ` ${verses.length} Verses • Translation: ${translation} • Date: ${toLocalDateKey()}`,
    `============================================================\n`,
  ];

  verses.forEach((v, idx) => {
    const text = getVerseText(translation, v.bookIndex, v.chapter, v.verseStart, v.verseEnd);
    lines.push(`CARD #${idx + 1}`);
    lines.push(`REFERENCE: ${v.reference}`);
    lines.push(`TEXT: ${text}`);
    if (v.notes) {
      lines.push(`NOTES: ${v.notes}`);
    }
    lines.push(`------------------------------------------------------------\n`);
  });

  const fullText = lines.join('\n');
  const safeDeckName = deck.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeDeckName}-printable.txt`;

  if (Platform.OS === 'web') {
    const blob = new Blob([fullText], { type: 'text/plain' });
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
  await file.write(fullText);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain',
    dialogTitle: `Printable Flashcards: ${deck.name}`,
    UTI: 'public.plain-text',
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
      hapticsEnabled: true,
    },
  };
}
