import { create } from 'zustand';

import { evaluateUnlockedBadgeIds } from '@/data/badges';
import { exportBackupJsonAsync, pickAndParseBackupAsync } from '@/lib/backup';
import { formatReference, getBookMeta } from '@/lib/bible';
import { toLocalDateKey } from '@/lib/date';
import {
  DEFAULT_SETTINGS,
  dbDeleteDeck,
  dbDeleteVerse,
  dbInsertBadges,
  dbInsertDeck,
  dbInsertQuizSession,
  dbInsertReviewLog,
  dbRestoreBackup,
  dbSaveSettings,
  dbUpsertDailyActivity,
  dbUpsertVerse,
  initializeAndLoadSnapshot,
  persistSnapshotDelta,
} from '@/lib/db';
import { syncDailyReminderAsync } from '@/lib/notifications';
import { computeSM2 } from '@/lib/sm2';
import { calculateStreak } from '@/lib/streak';
import type {
  AppSettings,
  BackupPayload,
  DailyActivity,
  Deck,
  MemorizedVerse,
  QuizSession,
  ReviewLog,
  ReviewRating,
  StreakInfo,
  UnlockedBadge,
} from '@/types/models';

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface AppState {
  initialized: boolean;
  loading: boolean;
  decks: Deck[];
  verses: MemorizedVerse[];
  reviewLogs: ReviewLog[];
  quizSessions: QuizSession[];
  dailyActivity: DailyActivity[];
  badges: UnlockedBadge[];
  settings: AppSettings;
  streak: StreakInfo;
  priorityQueueIds: string[];
  recentBadgeIds: string[];

  initApp: () => Promise<void>;
  dismissRecentBadges: () => void;
  getDueVerses: () => MemorizedVerse[];

  createDeck: (name: string, description: string, color: string, icon: string) => Promise<Deck>;
  deleteDeck: (deckId: string) => Promise<void>;
  addVerseToDeck: (params: {
    deckId: string;
    bookIndex: number;
    chapter: number;
    verseStart: number;
    verseEnd: number;
  }) => Promise<{ verse: MemorizedVerse; alreadyExists: boolean }>;
  deleteVerse: (verseId: string) => Promise<void>;

  recordVerseReview: (
    verseId: string,
    rating: ReviewRating,
    mode: 'learn' | 'review' | 'quiz'
  ) => Promise<void>;
  flagQuizMiss: (verseId: string) => Promise<void>;
  recordQuizSession: (params: {
    quizType: 'verse' | 'trivia';
    category: string;
    difficulty: string;
    score: number;
    total: number;
    durationSec: number;
  }) => Promise<void>;

  updateSettings: (partial: Partial<AppSettings>) => Promise<{ reminderError?: string }>;
  markSharedCard: () => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: () => Promise<boolean>;
}

const emptyStreak = calculateStreak([]);

export const useAppStore = create<AppState>((set, get) => {
  const syncWeb = () => {
    const s = get();
    void persistSnapshotDelta({
      decks: s.decks,
      verses: s.verses,
      reviewLogs: s.reviewLogs,
      quizSessions: s.quizSessions,
      dailyActivity: s.dailyActivity,
      badges: s.badges,
      settings: s.settings,
    });
  };

  const evaluateBadgesAndStreak = async () => {
    const s = get();
    const streak = calculateStreak(s.dailyActivity);
    const existingIds = new Set(s.badges.map((b) => b.id));
    const newlyIds = evaluateUnlockedBadgeIds({
      verses: s.verses,
      decks: s.decks,
      streak,
      quizSessions: s.quizSessions,
      hasSharedCard: s.settings.hasSharedCard,
      existingIds,
    });

    if (newlyIds.length > 0) {
      const nowIso = new Date().toISOString();
      const created: UnlockedBadge[] = newlyIds.map((id) => ({ id, unlockedAt: nowIso }));
      const nextBadges = [...s.badges, ...created];
      set({
        streak,
        badges: nextBadges,
        recentBadgeIds: [...s.recentBadgeIds, ...newlyIds],
      });
      await dbInsertBadges(created);
    } else {
      set({ streak });
    }
    syncWeb();
  };

  return {
    initialized: false,
    loading: false,
    decks: [],
    verses: [],
    reviewLogs: [],
    quizSessions: [],
    dailyActivity: [],
    badges: [],
    settings: DEFAULT_SETTINGS,
    streak: emptyStreak,
    priorityQueueIds: [],
    recentBadgeIds: [],

    initApp: async () => {
      if (get().initialized || get().loading) return;
      set({ loading: true });
      try {
        const snap = await initializeAndLoadSnapshot();
        const streak = calculateStreak(snap.dailyActivity);
        set({
          initialized: true,
          loading: false,
          decks: snap.decks,
          verses: snap.verses,
          reviewLogs: snap.reviewLogs,
          quizSessions: snap.quizSessions,
          dailyActivity: snap.dailyActivity,
          badges: snap.badges,
          settings: snap.settings,
          streak,
        });
        await evaluateBadgesAndStreak();
      } catch (err) {
        console.error('Failed to initialize app store:', err);
        set({ initialized: true, loading: false });
      }
    },

    dismissRecentBadges: () => set({ recentBadgeIds: [] }),

    getDueVerses: () => {
      const { verses, priorityQueueIds } = get();
      const todayKey = toLocalDateKey();
      const priorityIndex = new Map(priorityQueueIds.map((id, idx) => [id, idx]));

      const due = verses.filter((v) => v.dueDate <= todayKey || priorityIndex.has(v.id));
      return due.sort((a, b) => {
        const pa = priorityIndex.get(a.id);
        const pb = priorityIndex.get(b.id);
        if (pa !== undefined && pb !== undefined) return pa - pb;
        if (pa !== undefined) return -1;
        if (pb !== undefined) return 1;
        if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        return a.mastery - b.mastery;
      });
    },

    createDeck: async (name, description, color, icon) => {
      const deck: Deck = {
        id: uid('deck'),
        name: name.trim(),
        description: description.trim() || 'Custom Scripture collection',
        color,
        icon,
        isStarter: false,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ decks: [...state.decks, deck] }));
      await dbInsertDeck(deck);
      syncWeb();
      return deck;
    },

    deleteDeck: async (deckId) => {
      set((state) => ({
        decks: state.decks.filter((d) => d.id !== deckId),
        verses: state.verses.filter((v) => v.deckId !== deckId),
        priorityQueueIds: state.priorityQueueIds.filter((id) =>
          state.verses.some((v) => v.id === id && v.deckId !== deckId)
        ),
      }));
      await dbDeleteDeck(deckId);
      syncWeb();
    },

    addVerseToDeck: async ({ deckId, bookIndex, chapter, verseStart, verseEnd }) => {
      const existing = get().verses.find(
        (v) =>
          v.deckId === deckId &&
          v.bookIndex === bookIndex &&
          v.chapter === chapter &&
          v.verseStart === verseStart &&
          v.verseEnd === verseEnd
      );
      if (existing) {
        return { verse: existing, alreadyExists: true };
      }

      const book = getBookMeta(bookIndex);
      const verse: MemorizedVerse = {
        id: uid('verse'),
        deckId,
        bookIndex,
        bookName: book.name,
        chapter,
        verseStart,
        verseEnd,
        reference: formatReference(bookIndex, chapter, verseStart, verseEnd),
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        dueDate: toLocalDateKey(),
        lastReviewedAt: null,
        mastery: 0,
        totalReviews: 0,
        correctReviews: 0,
        learned: false,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({ verses: [...state.verses, verse] }));
      await dbUpsertVerse(verse);
      await evaluateBadgesAndStreak();
      return { verse, alreadyExists: false };
    },

    deleteVerse: async (verseId) => {
      set((state) => ({
        verses: state.verses.filter((v) => v.id !== verseId),
        priorityQueueIds: state.priorityQueueIds.filter((id) => id !== verseId),
      }));
      await dbDeleteVerse(verseId);
      syncWeb();
    },

    recordVerseReview: async (verseId, rating, mode) => {
      const target = get().verses.find((v) => v.id === verseId);
      if (!target) return;

      const todayKey = toLocalDateKey();
      const updatedFields = computeSM2(target, rating, todayKey);
      const updatedVerse: MemorizedVerse = { ...target, ...updatedFields };
      const becameLearned = !target.learned && updatedVerse.learned;

      const log: ReviewLog = {
        id: uid('rev'),
        verseId,
        rating,
        mode,
        reviewedAt: new Date().toISOString(),
      };

      const existingDay = get().dailyActivity.find((a) => a.dateKey === todayKey);
      const updatedDay: DailyActivity = {
        dateKey: todayKey,
        reviewsCount: (existingDay?.reviewsCount ?? 0) + 1,
        quizzesCount: existingDay?.quizzesCount ?? 0,
        learnedCount: (existingDay?.learnedCount ?? 0) + (becameLearned ? 1 : 0),
      };

      set((state) => {
        const nextQueue =
          rating === 'again'
            ? [verseId, ...state.priorityQueueIds.filter((id) => id !== verseId)]
            : state.priorityQueueIds.filter((id) => id !== verseId);

        const nextActivity = existingDay
          ? state.dailyActivity.map((a) => (a.dateKey === todayKey ? updatedDay : a))
          : [...state.dailyActivity, updatedDay];

        return {
          verses: state.verses.map((v) => (v.id === verseId ? updatedVerse : v)),
          reviewLogs: [log, ...state.reviewLogs].slice(0, 500),
          dailyActivity: nextActivity,
          priorityQueueIds: nextQueue,
        };
      });

      await dbUpsertVerse(updatedVerse);
      await dbInsertReviewLog(log);
      await dbUpsertDailyActivity(updatedDay);
      await evaluateBadgesAndStreak();
    },

    flagQuizMiss: async (verseId) => {
      const target = get().verses.find((v) => v.id === verseId);
      if (!target) return;

      const todayKey = toLocalDateKey();
      const updatedFields = computeSM2(target, 'again', todayKey);
      const updatedVerse: MemorizedVerse = { ...target, ...updatedFields };

      const log: ReviewLog = {
        id: uid('rev'),
        verseId,
        rating: 'again',
        mode: 'quiz',
        reviewedAt: new Date().toISOString(),
      };

      set((state) => ({
        verses: state.verses.map((v) => (v.id === verseId ? updatedVerse : v)),
        reviewLogs: [log, ...state.reviewLogs].slice(0, 500),
        priorityQueueIds: [verseId, ...state.priorityQueueIds.filter((id) => id !== verseId)],
      }));

      await dbUpsertVerse(updatedVerse);
      await dbInsertReviewLog(log);
      syncWeb();
    },

    recordQuizSession: async ({ quizType, category, difficulty, score, total, durationSec }) => {
      const todayKey = toLocalDateKey();
      const session: QuizSession = {
        id: uid('quiz'),
        quizType,
        category,
        difficulty,
        score,
        total,
        durationSec,
        completedAt: new Date().toISOString(),
      };

      const existingDay = get().dailyActivity.find((a) => a.dateKey === todayKey);
      const updatedDay: DailyActivity = {
        dateKey: todayKey,
        reviewsCount: existingDay?.reviewsCount ?? 0,
        quizzesCount: (existingDay?.quizzesCount ?? 0) + 1,
        learnedCount: existingDay?.learnedCount ?? 0,
      };

      set((state) => ({
        quizSessions: [session, ...state.quizSessions].slice(0, 200),
        dailyActivity: existingDay
          ? state.dailyActivity.map((a) => (a.dateKey === todayKey ? updatedDay : a))
          : [...state.dailyActivity, updatedDay],
      }));

      await dbInsertQuizSession(session);
      await dbUpsertDailyActivity(updatedDay);
      await evaluateBadgesAndStreak();
    },

    updateSettings: async (partial) => {
      const next = { ...get().settings, ...partial };
      set({ settings: next });
      await dbSaveSettings(next);
      syncWeb();

      if (
        partial.reminderEnabled !== undefined ||
        partial.reminderHour !== undefined ||
        partial.reminderMinute !== undefined
      ) {
        const res = await syncDailyReminderAsync({
          enabled: next.reminderEnabled,
          hour: next.reminderHour,
          minute: next.reminderMinute,
          dueCount: get().getDueVerses().length,
          translation: next.translation,
        });
        if (!res.ok) {
          // Roll back enabled if permissions denied
          if (partial.reminderEnabled) {
            const rolledBack = { ...next, reminderEnabled: false };
            set({ settings: rolledBack });
            await dbSaveSettings(rolledBack);
            syncWeb();
          }
          return { reminderError: res.reason };
        }
      }
      return {};
    },

    markSharedCard: async () => {
      if (get().settings.hasSharedCard) return;
      const next = { ...get().settings, hasSharedCard: true };
      set({ settings: next });
      await dbSaveSettings(next);
      await evaluateBadgesAndStreak();
    },

    exportBackup: async () => {
      const s = get();
      const payload: BackupPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        decks: s.decks,
        verses: s.verses,
        reviewLogs: s.reviewLogs,
        quizSessions: s.quizSessions,
        dailyActivity: s.dailyActivity,
        badges: s.badges,
        settings: s.settings,
      };
      await exportBackupJsonAsync(payload);
    },

    importBackup: async () => {
      const payload = await pickAndParseBackupAsync();
      if (!payload) return false;
      await dbRestoreBackup(payload);
      const streak = calculateStreak(payload.dailyActivity);
      set({
        decks: payload.decks,
        verses: payload.verses,
        reviewLogs: payload.reviewLogs,
        quizSessions: payload.quizSessions,
        dailyActivity: payload.dailyActivity,
        badges: payload.badges,
        settings: { ...DEFAULT_SETTINGS, ...payload.settings },
        streak,
        priorityQueueIds: [],
      });
      await evaluateBadgesAndStreak();
      return true;
    },
  };
});
