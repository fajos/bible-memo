import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

export interface UpdateStatus {
  isEnabled: boolean;
  channel: string | null;
  runtimeVersion: string | null;
  updateId: string | null;
  isEmbeddedLaunch: boolean;
}

export function getUpdateStatus(): UpdateStatus {
  return {
    isEnabled: Updates.isEnabled,
    channel: Updates.channel,
    runtimeVersion: Updates.runtimeVersion,
    updateId: Updates.updateId,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}

export async function checkAndFetchUpdateAsync(): Promise<{
  isAvailable: boolean;
  message: string;
}> {
  if (Platform.OS === 'web' || !Updates.isEnabled) {
    return {
      isAvailable: false,
      message: 'Expo Updates is active for native builds (development/web runs live bundle).',
    };
  }

  try {
    const check = await Updates.checkForUpdateAsync();
    if (check.isAvailable) {
      await Updates.fetchUpdateAsync();
      return {
        isAvailable: true,
        message: 'New update downloaded! Restart the app to apply it.',
      };
    }
    return {
      isAvailable: false,
      message: 'You are already running the latest version.',
    };
  } catch (err) {
    return {
      isAvailable: false,
      message: err instanceof Error ? err.message : 'Unable to check for updates.',
    };
  }
}

export async function applyUpdateAsync(): Promise<void> {
  if (Updates.isEnabled) {
    await Updates.reloadAsync();
  }
}
