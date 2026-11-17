import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { BadgeBanner } from '@/components/BadgeBanner';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/store/useAppStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const initApp = useAppStore((s) => s.initApp);
  const initialized = useAppStore((s) => s.initialized);

  useEffect(() => {
    async function checkStartupUpdate() {
      if (!Updates.isEnabled) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
        }
      } catch {
        // Silently ignore network or dev errors
      }
    }
    void checkStartupUpdate();
  }, []);

  useEffect(() => {
    void initApp();
  }, [initApp]);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && initialized) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, initialized]);

  if (!fontsLoaded || !initialized) {
    return null;
  }

  return <RootNavigator />;
}

function RootNavigator() {
  const { isDark, colors } = useAppTheme();

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Back' }} />
        <Stack.Screen name="review" options={{ title: 'Daily Review', headerBackTitle: 'Back' }} />
        <Stack.Screen name="learn/[verseId]" options={{ title: 'Learn Verse', headerBackTitle: 'Back' }} />
        <Stack.Screen name="deck/[id]" options={{ title: 'Deck', headerBackTitle: 'Back' }} />
        <Stack.Screen name="verse-quiz" options={{ title: 'Verse Quiz', headerBackTitle: 'Back' }} />
        <Stack.Screen name="trivia" options={{ title: 'Bible Trivia', headerBackTitle: 'Back' }} />
        <Stack.Screen
          name="share-card"
          options={{ title: 'Share Verse Card', presentation: 'modal' }}
        />
      </Stack>
      <BadgeBanner />
    </ThemeProvider>
  );
}
