import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { toLocalDateKey } from '@/lib/date';
import type { MemorizedVerse } from '@/types/models';

interface ReviewForecastChartProps {
  verses: MemorizedVerse[];
}

export function ReviewForecastChart({ verses }: ReviewForecastChartProps) {
  const { colors } = useAppTheme();

  const days = React.useMemo(() => {
    const today = new Date();
    const list: { key: string; label: string; count: number; isToday: boolean }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = toLocalDateKey(d);
      const isToday = i === 0;

      // For today: count all verses due on or before today
      // For future days: count verses due on that specific date
      let count = 0;
      if (isToday) {
        count = verses.filter((v) => v.dueDate <= key).length;
      } else {
        count = verses.filter((v) => v.dueDate === key).length;
      }

      list.push({
        key,
        label: isToday ? 'Today' : dayNames[d.getDay()],
        count,
        isToday,
      });
    }
    return list;
  }, [verses]);

  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const totalUpcoming = days.reduce((acc, d) => acc + d.count, 0);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>7-Day Review Forecast</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {totalUpcoming} review{totalUpcoming === 1 ? '' : 's'} scheduled this week
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {days.map((day) => {
          const heightPct = Math.max(8, Math.round((day.count / maxCount) * 100));
          return (
            <View key={day.key} style={styles.barCol}>
              <Text
                style={[
                  styles.countLabel,
                  { color: day.isToday ? colors.accent : colors.textMuted },
                ]}>
                {day.count}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPct}%`,
                      backgroundColor: day.isToday ? colors.accent : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: day.isToday ? colors.accent : colors.textSecondary,
                    fontWeight: day.isToday ? '800' : '600',
                  },
                ]}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2 },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  countLabel: { fontSize: 11, fontWeight: '700' },
  barTrack: {
    width: 22,
    flex: 1,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 8 },
  dayLabel: { fontSize: 11 },
});
