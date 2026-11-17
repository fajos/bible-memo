import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { toLocalDateKey } from '@/lib/date';
import type { DailyActivity } from '@/types/models';

interface ActivityHeatmapProps {
  activity: DailyActivity[];
}

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const { colors } = useAppTheme();

  // Generate 12 weeks of historical days ending today
  const activityMap = React.useMemo(() => {
    const map = new Map<string, number>();
    activity.forEach((a) => {
      map.set(a.dateKey, (a.reviewsCount || 0) + (a.quizzesCount || 0) + (a.learnedCount || 0));
    });
    return map;
  }, [activity]);

  const weeks = React.useMemo(() => {
    const today = new Date();
    const result: { dateKey: string; count: number; dayOfWeek: number }[][] = [];
    const totalDays = 12 * 7; // 12 weeks

    const days: { dateKey: string; count: number; dayOfWeek: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toLocalDateKey(d);
      const dayOfWeek = d.getDay(); // 0 is Sunday
      days.push({
        dateKey: key,
        count: activityMap.get(key) ?? 0,
        dayOfWeek,
      });
    }

    // Group into 12 chunks of 7 days
    for (let w = 0; w < 12; w++) {
      result.push(days.slice(w * 7, (w + 1) * 7));
    }
    return result;
  }, [activityMap]);

  const totalActiveDays = React.useMemo(() => {
    let count = 0;
    weeks.forEach((week) => {
      week.forEach((day) => {
        if (day.count > 0) count++;
      });
    });
    return count;
  }, [weeks]);

  const getColor = (count: number) => {
    if (count === 0) return colors.surfaceMuted;
    if (count <= 2) return `${colors.primary}45`;
    if (count <= 5) return `${colors.primary}85`;
    return colors.primary;
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Activity Grid</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {totalActiveDays} active days over the last 12 weeks
          </Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
          <View style={[styles.legendDot, { backgroundColor: colors.surfaceMuted }]} />
          <View style={[styles.legendDot, { backgroundColor: `${colors.primary}45` }]} />
          <View style={[styles.legendDot, { backgroundColor: `${colors.primary}85` }]} />
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
        </View>
      </View>

      <View style={styles.gridContainer}>
        {/* Row labels */}
        <View style={styles.dayLabelsCol}>
          {dayLabels.map((lbl, idx) => (
            <Text key={idx} style={[styles.dayLabel, { color: colors.textMuted }]}>
              {idx % 2 === 1 ? lbl : ''}
            </Text>
          ))}
        </View>

        {/* 12 columns of weeks */}
        <View style={styles.weeksRow}>
          {weeks.map((week, wIdx) => (
            <View key={wIdx} style={styles.weekCol}>
              {week.map((day) => (
                <View
                  key={day.dateKey}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: getColor(day.count),
                      borderColor: day.dateKey === toLocalDateKey() ? colors.accent : 'transparent',
                      borderWidth: day.dateKey === toLocalDateKey() ? 1 : 0,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  legendText: { fontSize: 10, fontWeight: '600' },
  legendDot: { width: 9, height: 9, borderRadius: 2 },
  gridContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  dayLabelsCol: { gap: 3.5 },
  dayLabel: { fontSize: 9.5, fontWeight: '700', height: 13, textAlign: 'center' },
  weeksRow: { flexDirection: 'row', flex: 1, justifyContent: 'space-between' },
  weekCol: { gap: 3.5 },
  cell: { width: 13, height: 13, borderRadius: 3 },
});
