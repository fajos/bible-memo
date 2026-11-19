import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { STARTER_PACKS } from '@/data/starterPacks';
import { formatReference } from '@/lib/bible';
import { toLocalDateKey } from '@/lib/date';
import type {
  AppSettings,
  BackupPayload,
  DailyActivity,
  Deck,
  MemorizedVerse,
  QuizSession,
  ReviewLog,
  UnlockedBadge,
} from '@/types/models';

export const DEFAULT_SETTINGS: AppSettings = {
  translation: 'KJV',
  themeMode: 'system',
  fontSize: 'medium',
  reminderEnabled: false,
  reminderHour: 8,
  reminderMinute: 0,
  hasSharedCard: false,
  hapticsEnabled: true,
};

interface PersistedSnapshot {
  decks: Deck[];
  verses: MemorizedVerse[];
  reviewLogs: ReviewLog[];
  quizSessions: QuizSession[];
  dailyActivity: DailyActivity[];
  badges: UnlockedBadge[];
  settings: AppSettings;
}

const WEB_STORAGE_KEY = 'selah_bible_memo_db_v1';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function buildStarterSeed(): { decks: Deck[]; verses: MemorizedVerse[] } {
  const nowIso = new Date().toISOString();
  const todayKey = toLocalDateKey();
  const decks: Deck[] = [];
  const verses: MemorizedVerse[] = [];

  for (const pack of STARTER_PACKS) {
    decks.push({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      icon: pack.icon,
      color: pack.color,
      isStarter: true,
      createdAt: nowIso,
    });

    pack.verses.forEach((seed, idx) => {
      const ref = formatReference(seed.bookIndex, seed.chapter, seed.verseStart, seed.verseEnd);
      verses.push({
        id: `${pack.id}_v_${idx + 1}`,
        deckId: pack.id,
        bookIndex: seed.bookIndex,
        bookName: ref.replace(/\s+\d+.*$/, ''),
        chapter: seed.chapter,
        verseStart: seed.verseStart,
        verseEnd: seed.verseEnd,
        reference: ref,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        dueDate: todayKey,
        lastReviewedAt: null,
        mastery: 0,
        totalReviews: 0,
        correctReviews: 0,
        learned: false,
        createdAt: nowIso,
      });
    });
  }

  return { decks, verses };
}

async function getNativeDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('bible_memo.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS decks (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          is_starter INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS verses (
          id TEXT PRIMARY KEY NOT NULL,
          deck_id TEXT NOT NULL,
          book_index INTEGER NOT NULL,
          book_name TEXT NOT NULL,
          chapter INTEGER NOT NULL,
          verse_start INTEGER NOT NULL,
          verse_end INTEGER NOT NULL,
          reference TEXT NOT NULL,
          ease REAL NOT NULL DEFAULT 2.5,
          interval INTEGER NOT NULL DEFAULT 0,
          repetitions INTEGER NOT NULL DEFAULT 0,
          due_date TEXT NOT NULL,
          last_reviewed_at TEXT,
          mastery INTEGER NOT NULL DEFAULT 0,
          total_reviews INTEGER NOT NULL DEFAULT 0,
          correct_reviews INTEGER NOT NULL DEFAULT 0,
          learned INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS review_logs (
          id TEXT PRIMARY KEY NOT NULL,
          verse_id TEXT NOT NULL,
          rating TEXT NOT NULL,
          mode TEXT NOT NULL,
          reviewed_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS quiz_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          quiz_type TEXT NOT NULL,
          category TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          score INTEGER NOT NULL,
          total INTEGER NOT NULL,
          duration_sec INTEGER NOT NULL,
          completed_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS daily_activity (
          date_key TEXT PRIMARY KEY NOT NULL,
          reviews_count INTEGER NOT NULL DEFAULT 0,
          quizzes_count INTEGER NOT NULL DEFAULT 0,
          learned_count INTEGER NOT NULL DEFAULT 0,
          visits_count INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS badges (
          id TEXT PRIMARY KEY NOT NULL,
          unlocked_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS auto_snapshots (
          id TEXT PRIMARY KEY NOT NULL,
          created_at TEXT NOT NULL,
          payload TEXT NOT NULL
        );
      `);
      try {
        await db.execAsync('ALTER TABLE verses ADD COLUMN notes TEXT;');
      } catch {}
      try {
        await db.execAsync('ALTER TABLE verses ADD COLUMN tags TEXT;');
      } catch {}
      try {
        await db.execAsync('ALTER TABLE daily_activity ADD COLUMN visits_count INTEGER NOT NULL DEFAULT 0;');
      } catch {}
      return db;
    })();
  }
  return dbPromise;
}

function readWebSnapshot(): PersistedSnapshot | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(WEB_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedSnapshot;
  } catch {
    return null;
  }
}

function writeWebSnapshot(snapshot: PersistedSnapshot): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(snapshot));
}

export async function initializeAndLoadSnapshot(): Promise<PersistedSnapshot> {
  if (Platform.OS === 'web') {
    const existing = readWebSnapshot();
    if (existing) {
      return {
        ...existing,
        settings: { ...DEFAULT_SETTINGS, ...existing.settings },
      };
    }
    const { decks, verses } = buildStarterSeed();
    const initial: PersistedSnapshot = {
      decks,
      verses,
      reviewLogs: [],
      quizSessions: [],
      dailyActivity: [],
      badges: [],
      settings: { ...DEFAULT_SETTINGS },
    };
    writeWebSnapshot(initial);
    return initial;
  }

  const db = await getNativeDb();
  const countRow = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM decks');

  if (!countRow || countRow.cnt === 0) {
    const { decks, verses } = buildStarterSeed();
    await db.withTransactionAsync(async () => {
      for (const d of decks) {
        await db.runAsync(
          'INSERT OR IGNORE INTO decks (id, name, description, icon, color, is_starter, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          d.id,
          d.name,
          d.description,
          d.icon,
          d.color,
          d.isStarter ? 1 : 0,
          d.createdAt
        );
      }
      for (const v of verses) {
        await db.runAsync(
          `INSERT OR IGNORE INTO verses (
            id, deck_id, book_index, book_name, chapter, verse_start, verse_end, reference,
            ease, interval, repetitions, due_date, last_reviewed_at, mastery,
            total_reviews, correct_reviews, learned, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          v.id,
          v.deckId,
          v.bookIndex,
          v.bookName,
          v.chapter,
          v.verseStart,
          v.verseEnd,
          v.reference,
          v.ease,
          v.interval,
          v.repetitions,
          v.dueDate,
          v.lastReviewedAt,
          v.mastery,
          v.totalReviews,
          v.correctReviews,
          v.learned ? 1 : 0,
          v.createdAt
        );
      }
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        'app_settings',
        JSON.stringify(DEFAULT_SETTINGS)
      );
    });
  }

  const deckRows = await db.getAllAsync<{
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    is_starter: number;
    created_at: string;
  }>('SELECT * FROM decks ORDER BY is_starter DESC, created_at ASC');

  const verseRows = await db.getAllAsync<{
    id: string;
    deck_id: string;
    book_index: number;
    book_name: string;
    chapter: number;
    verse_start: number;
    verse_end: number;
    reference: string;
    ease: number;
    interval: number;
    repetitions: number;
    due_date: string;
    last_reviewed_at: string | null;
    mastery: number;
    total_reviews: number;
    correct_reviews: number;
    learned: number;
    notes: string | null;
    tags: string | null;
    created_at: string;
  }>('SELECT * FROM verses ORDER BY created_at ASC');

  const logRows = await db.getAllAsync<{
    id: string;
    verse_id: string;
    rating: ReviewLog['rating'];
    mode: ReviewLog['mode'];
    reviewed_at: string;
  }>('SELECT * FROM review_logs ORDER BY reviewed_at DESC LIMIT 500');

  const quizRows = await db.getAllAsync<{
    id: string;
    quiz_type: QuizSession['quizType'];
    category: string;
    difficulty: string;
    score: number;
    total: number;
    duration_sec: number;
    completed_at: string;
  }>('SELECT * FROM quiz_sessions ORDER BY completed_at DESC LIMIT 200');

  const activityRows = await db.getAllAsync<{
    date_key: string;
    reviews_count: number;
    quizzes_count: number;
    learned_count: number;
    visits_count?: number;
  }>('SELECT * FROM daily_activity ORDER BY date_key ASC');

  const badgeRows = await db.getAllAsync<{
    id: string;
    unlocked_at: string;
  }>('SELECT * FROM badges');

  const settingsRow = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    'app_settings'
  );
  const parsedSettings = settingsRow
    ? { ...DEFAULT_SETTINGS, ...(JSON.parse(settingsRow.value) as Partial<AppSettings>) }
    : { ...DEFAULT_SETTINGS };

  return {
    decks: deckRows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      icon: r.icon,
      color: r.color,
      isStarter: r.is_starter === 1,
      createdAt: r.created_at,
    })),
    verses: verseRows.map((r) => ({
      id: r.id,
      deckId: r.deck_id,
      bookIndex: r.book_index,
      bookName: r.book_name,
      chapter: r.chapter,
      verseStart: r.verse_start,
      verseEnd: r.verse_end,
      reference: r.reference,
      ease: r.ease,
      interval: r.interval,
      repetitions: r.repetitions,
      dueDate: r.due_date,
      lastReviewedAt: r.last_reviewed_at,
      mastery: r.mastery,
      totalReviews: r.total_reviews,
      correctReviews: r.correct_reviews,
      learned: r.learned === 1,
      notes: r.notes ?? undefined,
      tags: r.tags ? (JSON.parse(r.tags) as string[]) : undefined,
      createdAt: r.created_at,
    })),
    reviewLogs: logRows.map((r) => ({
      id: r.id,
      verseId: r.verse_id,
      rating: r.rating,
      mode: r.mode,
      reviewedAt: r.reviewed_at,
    })),
    quizSessions: quizRows.map((r) => ({
      id: r.id,
      quizType: r.quiz_type,
      category: r.category,
      difficulty: r.difficulty,
      score: r.score,
      total: r.total,
      durationSec: r.duration_sec,
      completedAt: r.completed_at,
    })),
    dailyActivity: activityRows.map((r) => ({
      dateKey: r.date_key,
      reviewsCount: r.reviews_count,
      quizzesCount: r.quizzes_count,
      learnedCount: r.learned_count,
      visitsCount: r.visits_count ?? 0,
    })),
    badges: badgeRows.map((r) => ({
      id: r.id,
      unlockedAt: r.unlocked_at,
    })),
    settings: parsedSettings,
  };
}

export async function persistSnapshotDelta(snapshot: PersistedSnapshot): Promise<void> {
  if (Platform.OS === 'web') {
    writeWebSnapshot(snapshot);
  }
}

export async function dbInsertDeck(deck: Deck): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getNativeDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO decks (id, name, description, icon, color, is_starter, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    deck.id,
    deck.name,
    deck.description,
    deck.icon,
    deck.color,
    deck.isStarter ? 1 : 0,
    deck.createdAt
  );
}

export async function dbDeleteDeck(deckId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getNativeDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM verses WHERE deck_id = ?', deckId);
    await db.runAsync('DELETE FROM decks WHERE id = ?', deckId);
  });
}

export async function dbUpsertVerse(v: MemorizedVerse): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getNativeDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO verses (
      id, deck_id, book_index, book_name, chapter, verse_start, verse_end, reference,
      ease, interval, repetitions, due_date, last_reviewed_at, mastery,
      total_reviews, correct_reviews, learned, notes, tags, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    v.id,
    v.deckId,
    v.bookIndex,
    v.bookName,
    v.chapter,
    v.verseStart,
    v.verseEnd,
    v.reference,
    v.ease,
    v.interval,
    v.repetitions,
    v.dueDate,
    v.lastReviewedAt,
    v.mastery,
    v.totalReviews,
    v.correctReviews,
    v.learned ? 1 : 0,
    v.notes ?? null,
    v.tags ? JSON.stringify(v.tags) : null,
    v.createdAt
  );
}

export async function dbDeleteVerse(verseId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getNativeDb();
  await db.runAsync('DELETE FROM verses WHERE id = ?', verseId);
}

export async function dbInsertReviewLog(log: ReviewLog): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getNativeDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO review_logs (id, verse_id, rating, mode, reviewed_at) VALUES (?, ?, ?, ?, ?)',
    log.id,
    log.verseId,
    log.rating,
    log.mode,
    log.reviewedAt
  );
}

export async function dbInsertQuizSession(session: QuizSession): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getNativeDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO quiz_sessions (id, quiz_type, category, difficulty, score, total, duration_sec, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    session.id,
    session.quizType,
    session.category,
    session.difficulty,
    session.score,
    session.total,
    session.durationSec,
    session.completedAt
  );
}

export async function dbUpsertDailyActivity(activity: DailyActivity): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getNativeDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO daily_activity (date_key, reviews_count, quizzes_count, learned_count, visits_count) VALUES (?, ?, ?, ?, ?)',
    activity.dateKey,
    activity.reviewsCount,
    activity.quizzesCount,
    activity.learnedCount,
    activity.visitsCount ?? 0
  );
}

export async function dbInsertBadges(badges: UnlockedBadge[]): Promise<void> {
  if (Platform.OS === 'web' || badges.length === 0) return;
  const db = await getNativeDb();
  await db.withTransactionAsync(async () => {
    for (const b of badges) {
      await db.runAsync(
        'INSERT OR IGNORE INTO badges (id, unlocked_at) VALUES (?, ?)',
        b.id,
        b.unlockedAt
      );
    }
  });
}

export async function dbSaveSettings(settings: AppSettings): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getNativeDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    'app_settings',
    JSON.stringify(settings)
  );
}

export async function dbRestoreBackup(payload: BackupPayload): Promise<void> {
  if (Platform.OS === 'web') {
    writeWebSnapshot({
      decks: payload.decks,
      verses: payload.verses,
      reviewLogs: payload.reviewLogs,
      quizSessions: payload.quizSessions,
      dailyActivity: payload.dailyActivity,
      badges: payload.badges,
      settings: { ...DEFAULT_SETTINGS, ...payload.settings },
    });
    return;
  }

  const db = await getNativeDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM decks;
      DELETE FROM verses;
      DELETE FROM review_logs;
      DELETE FROM quiz_sessions;
      DELETE FROM daily_activity;
      DELETE FROM badges;
    `);
    for (const d of payload.decks) {
      await db.runAsync(
        'INSERT INTO decks (id, name, description, icon, color, is_starter, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        d.id,
        d.name,
        d.description,
        d.icon,
        d.color,
        d.isStarter ? 1 : 0,
        d.createdAt
      );
    }
    for (const v of payload.verses) {
      await db.runAsync(
        `INSERT INTO verses (
          id, deck_id, book_index, book_name, chapter, verse_start, verse_end, reference,
          ease, interval, repetitions, due_date, last_reviewed_at, mastery,
          total_reviews, correct_reviews, learned, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        v.id,
        v.deckId,
        v.bookIndex,
        v.bookName,
        v.chapter,
        v.verseStart,
        v.verseEnd,
        v.reference,
        v.ease,
        v.interval,
        v.repetitions,
        v.dueDate,
        v.lastReviewedAt,
        v.mastery,
        v.totalReviews,
        v.correctReviews,
        v.learned ? 1 : 0,
        v.createdAt
      );
    }
    for (const l of payload.reviewLogs) {
      await db.runAsync(
        'INSERT INTO review_logs (id, verse_id, rating, mode, reviewed_at) VALUES (?, ?, ?, ?, ?)',
        l.id,
        l.verseId,
        l.rating,
        l.mode,
        l.reviewedAt
      );
    }
    for (const q of payload.quizSessions) {
      await db.runAsync(
        'INSERT INTO quiz_sessions (id, quiz_type, category, difficulty, score, total, duration_sec, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        q.id,
        q.quizType,
        q.category,
        q.difficulty,
        q.score,
        q.total,
        q.durationSec,
        q.completedAt
      );
    }
    for (const a of payload.dailyActivity) {
      await db.runAsync(
        'INSERT INTO daily_activity (date_key, reviews_count, quizzes_count, learned_count, visits_count) VALUES (?, ?, ?, ?, ?)',
        a.dateKey,
        a.reviewsCount,
        a.quizzesCount,
        a.learnedCount,
        a.visitsCount ?? 0
      );
    }
    for (const b of payload.badges) {
      await db.runAsync(
        'INSERT INTO badges (id, unlocked_at) VALUES (?, ?)',
        b.id,
        b.unlockedAt
      );
    }
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      'app_settings',
      JSON.stringify({ ...DEFAULT_SETTINGS, ...payload.settings })
    );
  });
}

export interface AutoSnapshotMeta {
  id: string;
  createdAt: string;
  versesCount: number;
}

export async function dbSaveAutoSnapshot(payload: BackupPayload): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getNativeDb();
  const id = `snap_${Date.now()}`;
  const nowIso = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO auto_snapshots (id, created_at, payload) VALUES (?, ?, ?)',
    id,
    nowIso,
    JSON.stringify(payload)
  );

  // Keep only the most recent 5 snapshots
  const all = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM auto_snapshots ORDER BY created_at DESC'
  );
  if (all.length > 5) {
    const toDelete = all.slice(5);
    for (const s of toDelete) {
      await db.runAsync('DELETE FROM auto_snapshots WHERE id = ?', s.id);
    }
  }
}

export async function dbGetAutoSnapshots(): Promise<AutoSnapshotMeta[]> {
  if (Platform.OS === 'web') return [];
  const db = await getNativeDb();
  const rows = await db.getAllAsync<{ id: string; created_at: string; payload: string }>(
    'SELECT id, created_at, payload FROM auto_snapshots ORDER BY created_at DESC'
  );
  return rows.map((r) => {
    let count = 0;
    try {
      const parsed = JSON.parse(r.payload) as BackupPayload;
      count = parsed.verses?.length ?? 0;
    } catch {}
    return {
      id: r.id,
      createdAt: r.created_at,
      versesCount: count,
    };
  });
}

export async function dbRestoreAutoSnapshot(id: string): Promise<PersistedSnapshot | null> {
  if (Platform.OS === 'web') return null;
  const db = await getNativeDb();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM auto_snapshots WHERE id = ?',
    id
  );
  if (!row) return null;
  const payload = JSON.parse(row.payload) as BackupPayload;
  await dbRestoreBackup(payload);
  return {
    decks: payload.decks,
    verses: payload.verses,
    reviewLogs: payload.reviewLogs,
    quizSessions: payload.quizSessions,
    dailyActivity: payload.dailyActivity,
    badges: payload.badges,
    settings: { ...DEFAULT_SETTINGS, ...payload.settings },
  };
}
