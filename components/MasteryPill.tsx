import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

export function MasteryPill({ mastery }: { mastery: number }) {
  const { colors } = useAppTheme();

  let label = 'New';
  let bg = colors.surfaceMuted;
  let fg = colors.textMuted;

  if (mastery >= 80) {
    label = `Mastered ${mastery}%`;
    bg = colors.successSoft;
    fg = colors.success;
  } else if (mastery >= 40) {
    label = `Growing ${mastery}%`;
    bg = colors.primarySoft;
    fg = colors.primary;
  } else if (mastery > 0) {
    label = `Learning ${mastery}%`;
    bg = colors.accentSoft;
    fg = colors.accent;
  }

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
