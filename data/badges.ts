import type { Deck, MemorizedVerse, QuizSession, StreakInfo } from '@/types/models';

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_verse',
    title: 'First Seed',
    description: 'Memorize or review your very first verse.',
    icon: 'leaf',
    color: '#2E7D5B',
  },
  {
    id: 'ten_verses',
    title: 'Word Keeper',
    description: 'Learn 10 verses in your library.',
    icon: 'book',
    color: '#2B4C7E',
  },
  {
    id: 'twenty_five_verses',
    title: 'Scripture Scholar',
    description: 'Learn 25 verses across your decks.',
    icon: 'school',
    color: '#7B4FA3',
  },
  {
    id: 'streak_3',
    title: 'Faithful Start',
    description: 'Reach a 3-day study streak.',
    icon: 'flame',
    color: '#D97706',
  },
  {
    id: 'streak_7',
    title: 'Week of the Word',
    description: 'Keep a 7-day study streak alive.',
    icon: 'ribbon',
    color: '#C48324',
  },
  {
    id: 'streak_30',
    title: 'Steadfast Heart',
    description: 'Reach a 30-day study streak.',
    icon: 'trophy',
    color: '#B83A3A',
  },
  {
    id: 'first_book',
    title: 'First Pack or Book Completed',
    description: 'Learn every verse in a starter pack, custom deck, or Bible book.',
    icon: 'library',
    color: '#1F6E8C',
  },
  {
    id: 'quiz_ace',
    title: 'Quiz Ace',
    description: 'Score 100% on a verse quiz or trivia round (5+ questions).',
    icon: 'checkmark-done-circle',
    color: '#2E7D5B',
  },
  {
    id: 'daily_challenger',
    title: 'Daily Challenger',
    description: 'Complete a 5-question Daily Bible Trivia challenge.',
    icon: 'sunny',
    color: '#D97706',
  },
  {
    id: 'light_bearer',
    title: 'Light Bearer',
    description: 'Share a verse card or scripture with someone.',
    icon: 'share-social',
    color: '#2B4C7E',
  },
];

export function evaluateUnlockedBadgeIds(params: {
  verses: MemorizedVerse[];
  decks: Deck[];
  streak: StreakInfo;
  quizSessions: QuizSession[];
  hasSharedCard: boolean;
  existingIds: Set<string>;
}): string[] {
  const { verses, decks, streak, quizSessions, hasSharedCard, existingIds } = params;
  const newlyUnlocked: string[] = [];

  const learnedCount = verses.filter((v) => v.learned).length;
  const reviewedAny = verses.some((v) => v.totalReviews > 0);

  const check = (id: string, condition: boolean) => {
    if (condition && !existingIds.has(id)) {
      newlyUnlocked.push(id);
    }
  };

  check('first_verse', learnedCount >= 1 || reviewedAny);
  check('ten_verses', learnedCount >= 10);
  check('twenty_five_verses', learnedCount >= 25);
  check('streak_3', streak.longestStreak >= 3 || streak.currentStreak >= 3);
  check('streak_7', streak.longestStreak >= 7 || streak.currentStreak >= 7);
  check('streak_30', streak.longestStreak >= 30 || streak.currentStreak >= 30);

  // Check if any deck with >= 3 verses has 100% learned verses
  const deckCompleted = decks.some((d) => {
    const deckVerses = verses.filter((v) => v.deckId === d.id);
    return deckVerses.length >= 3 && deckVerses.every((v) => v.learned);
  });
  check('first_book', deckCompleted);

  const hasAce = quizSessions.some((q) => q.total >= 5 && q.score === q.total);
  check('quiz_ace', hasAce);

  const hasDaily = quizSessions.some(
    (q) => q.quizType === 'trivia' && q.category === 'Daily Challenge'
  );
  check('daily_challenger', hasDaily);

  check('light_bearer', hasSharedCard);

  return newlyUnlocked;
}
