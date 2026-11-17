import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

function canHaptic(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    const enabled = useAppStore.getState().settings.hapticsEnabled;
    return enabled !== false;
  } catch {
    return true;
  }
}

export function hapticLight(): void {
  if (!canHaptic()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticMedium(): void {
  if (!canHaptic()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticHeavy(): void {
  if (!canHaptic()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

export function hapticSelection(): void {
  if (!canHaptic()) return;
  Haptics.selectionAsync().catch(() => {});
}

export function hapticSuccess(): void {
  if (!canHaptic()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticWarning(): void {
  if (!canHaptic()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export function hapticError(): void {
  if (!canHaptic()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
