import { addDaysToDateKey, toLocalDateKey } from '@/lib/date';
import type { MemorizedVerse, ReviewRating } from '@/types/models';

export interface SM2Update {
  ease: number;
  interval: number;
  repetitions: number;
  dueDate: string;
  mastery: number;
  learned: boolean;
  totalReviews: number;
  correctReviews: number;
  lastReviewedAt: string;
}

const RATING_QUALITY: Record<ReviewRating, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

/**
 * Standard SM-2 algorithm adapted for Scripture memorization:
 * - 'again' resets repetitions & interval to 0 (due immediately / today)
 * - 'hard' advances modestly (1d -> 3d -> interval * 1.2)
 * - 'good' follows classic SM-2 (1d -> 6d -> interval * ease)
 * - 'easy' boosts interval & ease
 */
export function computeSM2(
  verse: MemorizedVerse,
  rating: ReviewRating,
  todayKey: string = toLocalDateKey()
): SM2Update {
  const quality = RATING_QUALITY[rating];
  let { ease, interval, repetitions } = verse;

  if (quality < 3) {
    repetitions = 0;
    interval = 0;
  } else {
    if (repetitions === 0) {
      interval = rating === 'easy' ? 3 : 1;
    } else if (repetitions === 1) {
      interval = rating === 'hard' ? 3 : rating === 'easy' ? 8 : 6;
    } else {
      const multiplier = rating === 'hard' ? Math.max(1.2, ease * 0.8) : rating === 'easy' ? ease * 1.25 : ease;
      interval = Math.max(1, Math.round(interval * multiplier));
    }
    repetitions += 1;
  }

  // Update ease factor per SM-2 formula
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  ease = Math.max(1.3, Math.round((ease + delta) * 100) / 100);

  const dueDate = interval === 0 ? todayKey : addDaysToDateKey(todayKey, interval);
  const totalReviews = verse.totalReviews + 1;
  const correctReviews = verse.correctReviews + (quality >= 3 ? 1 : 0);
  const accuracy = totalReviews > 0 ? correctReviews / totalReviews : 0;

  // Compute 0..100 mastery blending repetitions, interval depth, and accuracy
  const repScore = Math.min(45, repetitions * 12);
  const intervalScore = Math.min(35, Math.round(Math.log2(interval + 1) * 7));
  const accuracyScore = Math.round(accuracy * 20);
  const mastery =
    quality < 3
      ? Math.max(10, Math.min(verse.mastery - 12, repScore + intervalScore + accuracyScore))
      : Math.min(100, Math.max(15, repScore + intervalScore + accuracyScore));

  return {
    ease,
    interval,
    repetitions,
    dueDate,
    mastery,
    learned: verse.learned || repetitions >= 1,
    totalReviews,
    correctReviews,
    lastReviewedAt: new Date().toISOString(),
  };
}

export function previewIntervalLabels(verse: MemorizedVerse): Record<ReviewRating, string> {
  const ratings: ReviewRating[] = ['again', 'hard', 'good', 'easy'];
  const result = {} as Record<ReviewRating, string>;
  for (const r of ratings) {
    const next = computeSM2(verse, r);
    if (next.interval === 0) result[r] = 'Now';
    else if (next.interval === 1) result[r] = '1d';
    else if (next.interval >= 30) result[r] = `${Math.round(next.interval / 30)}mo`;
    else result[r] = `${next.interval}d`;
  }
  return result;
}
