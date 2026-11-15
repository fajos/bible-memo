import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { BADGE_DEFINITIONS } from '@/data/badges';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/store/useAppStore';

export function BadgeBanner() {
  const { colors } = useAppTheme();
  const recentBadgeIds = useAppStore((s) => s.recentBadgeIds);
  const dismiss = useAppStore((s) => s.dismissRecentBadges);

  if (recentBadgeIds.length === 0) return null;

  const badge = BADGE_DEFINITIONS.find((b) => b.id === recentBadgeIds[0]);
  if (!badge) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.accent,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: `${badge.color}22` }]}>
        <Ionicons name={badge.icon as never} size={22} color={badge.color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.kicker, { color: colors.accent }]}>BADGE UNLOCKED</Text>
        <Text style={[styles.title, { color: colors.text }]}>{badge.title}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
          {badge.description}
        </Text>
      </View>
      <Pressable onPress={dismiss} hitSlop={10} style={styles.closeBtn}>
        <Ionicons name="close" size={20} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  desc: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
