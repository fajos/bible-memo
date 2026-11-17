export type Translation = 'KJV' | 'WEB';

export type ThemePreference = 'system' | 'light' | 'dark';

export type FontSizeOption = 'small' | 'medium' | 'large' | 'xlarge';

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export type TriviaCategory =
  | 'Old Testament'
  | 'New Testament'
  | 'Gospels'
  | 'Characters'
  | 'Books of the Bible'
  | 'Miracles'
  | 'Parables';

export type VerseQuizMode =
  | 'mixed'
  | 'fill_blank'
  | 'finish_verse'
  | 'name_reference'
  | 'word_order';

export interface BibleBookMeta {
  id: number;
  name: string;
  abbrev: string;
  testament: 'OT' | 'NT';
  chapters: number[];
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isStarter: boolean;
  createdAt: string;
}

export interface MemorizedVerse {
  id: string;
  deckId: string;
  bookIndex: number;
  bookName: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  reference: string;
  ease: number;
  interval: number;
  repetitions: number;
  dueDate: string; // YYYY-MM-DD
  lastReviewedAt: string | null;
  mastery: number; // 0..100
  totalReviews: number;
  correctReviews: number;
  learned: boolean;
  notes?: string;
  tags?: string[];
  createdAt: string;
}

export interface ReviewLog {
  id: string;
  verseId: string;
  rating: ReviewRating;
  mode: 'learn' | 'review' | 'quiz';
  reviewedAt: string;
}

export interface QuizSession {
  id: string;
  quizType: 'verse' | 'trivia';
  category: string;
  difficulty: string;
  score: number;
  total: number;
  durationSec: number;
  completedAt: string;
}

export interface DailyActivity {
  dateKey: string; // YYYY-MM-DD
  reviewsCount: number;
  quizzesCount: number;
  learnedCount: number;
}

export interface UnlockedBadge {
  id: string;
  unlockedAt: string;
}

export interface TriviaQuestion {
  id: string;
  category: TriviaCategory;
  difficulty: QuizDifficulty;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  reference: string;
  explanation: string;
}

export interface AppSettings {
  translation: Translation;
  themeMode: ThemePreference;
  fontSize: FontSizeOption;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  hasSharedCard: boolean;
  hapticsEnabled: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  practicedToday: boolean;
  freezeAvailable: boolean;
  freezeUsedRecently: boolean;
  lastActiveDate: string | null;
  weekDays: { dateKey: string; label: string; active: boolean; isToday: boolean }[];
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  decks: Deck[];
  verses: MemorizedVerse[];
  reviewLogs: ReviewLog[];
  quizSessions: QuizSession[];
  dailyActivity: DailyActivity[];
  badges: UnlockedBadge[];
  settings: AppSettings;
}
