import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { getVerseOfTheDay } from '@/lib/bible';
import type { Translation } from '@/types/models';

const CHANNEL_ID = 'daily-scripture-reminder';
const REMINDER_IDENTIFIER = 'selah-daily-reminder';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannelAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily Scripture Reminder',
      importance: AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#C48324',
    });
  }
}

export async function requestNotificationPermissionAsync(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  await ensureChannelAsync();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function syncDailyReminderAsync(params: {
  enabled: boolean;
  hour: number;
  minute: number;
  dueCount: number;
  translation: Translation;
}): Promise<{ ok: boolean; reason?: string }> {
  if (Platform.OS === 'web') {
    return { ok: true };
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
    if (!params.enabled) {
      return { ok: true };
    }

    const granted = await requestNotificationPermissionAsync();
    if (!granted) {
      return { ok: false, reason: 'Notification permission was not granted.' };
    }

    const votd = getVerseOfTheDay(params.translation);
    const body =
      params.dueCount > 0
        ? `You have ${params.dueCount} verse${params.dueCount === 1 ? '' : 's'} due today. Today’s verse: ${votd.reference}`
        : `Spend a few quiet minutes in Scripture. Today’s verse: ${votd.reference}`;

    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: {
        title: 'Time for Scripture Memory',
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: params.hour,
        minute: params.minute,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'Unable to schedule reminder' };
  }
}

export async function sendTestReminderAsync(translation: Translation): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const granted = await requestNotificationPermissionAsync();
  if (!granted) return false;
  const votd = getVerseOfTheDay(translation);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Verse of the Day • ${votd.reference}`,
      body: votd.text,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      repeats: false,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
  return true;
}
