import {
  addDaysToDateKey,
  diffDaysBetweenKeys,
  formatShortWeekday,
  toLocalDateKey,
} from '@/lib/date';
import type { DailyActivity, StreakInfo } from '@/types/models';

/**
 * Computes study streak with a gentle freeze rule:
 * - A single missed day between active days does NOT break the streak (uses freeze).
 * - Freeze recharges after 7 active days (or starts available for any single-day gap).
 * - Missing 2+ consecutive days resets the current streak.
 */
export function calculateStreak(
  activities: DailyActivity[],
  todayKey: string = toLocalDateKey()
): StreakInfo {
  const activeSet = new Set(
    activities
      .filter(
        (a) =>
          (a.reviewsCount || 0) > 0 ||
          (a.quizzesCount || 0) > 0 ||
          (a.learnedCount || 0) > 0 ||
          (a.visitsCount || 0) > 0
      )
      .map((a) => a.dateKey)
  );

  const sortedDates = Array.from(activeSet).sort();
  const lastActiveDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;
  const practicedToday = activeSet.has(todayKey);

  // Compute longest streak across all history (allowing single-day freeze gaps)
  let longestStreak = 0;
  let running = 0;
  let daysSinceFreeze = 7;

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      running = 1;
      daysSinceFreeze = 1;
    } else {
      const gap = diffDaysBetweenKeys(sortedDates[i - 1], sortedDates[i]);
      if (gap === 1) {
        running += 1;
        daysSinceFreeze += 1;
      } else if (gap === 2 && daysSinceFreeze >= 3) {
        // Gentle freeze bridges 1 missed day!
        running += 1;
        daysSinceFreeze = 0;
      } else {
        running = 1;
        daysSinceFreeze = 1;
      }
    }
    if (running > longestStreak) longestStreak = running;
  }

  // Compute current streak ending today or yesterday (or 2 days ago via gentle freeze)
  let currentStreak = 0;
  let freezeUsedRecently = false;
  let freezeAvailable = true;

  if (lastActiveDate) {
    const gapFromToday = diffDaysBetweenKeys(lastActiveDate, todayKey);
    if (gapFromToday <= 2) {
      if (gapFromToday === 2) {
        freezeUsedRecently = true;
      }

      // Walk backwards from lastActiveDate
      let idx = sortedDates.length - 1;
      currentStreak = 1;
      let freezesUsedInRun = gapFromToday === 2 ? 1 : 0;

      while (idx > 0) {
        const gap = diffDaysBetweenKeys(sortedDates[idx - 1], sortedDates[idx]);
        if (gap === 1) {
          currentStreak += 1;
          idx -= 1;
        } else if (gap === 2 && freezesUsedInRun === 0) {
          currentStreak += 1;
          freezesUsedInRun += 1;
          freezeUsedRecently = true;
          idx -= 1;
        } else {
          break;
        }
      }
      freezeAvailable = freezesUsedInRun === 0 || currentStreak >= 7;
    }
  }

  const weekDays = [];
  for (let offset = -6; offset <= 0; offset++) {
    const dateKey = addDaysToDateKey(todayKey, offset);
    weekDays.push({
      dateKey,
      label: formatShortWeekday(dateKey),
      active: activeSet.has(dateKey),
      isToday: offset === 0,
    });
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    practicedToday,
    freezeAvailable,
    freezeUsedRecently,
    lastActiveDate,
    weekDays,
  };
}
