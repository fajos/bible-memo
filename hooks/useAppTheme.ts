import { useColorScheme } from 'react-native';

import { DarkPalette, LightPalette, VerseFontScales, type Palette } from '@/constants/Theme';
import { useAppStore } from '@/store/useAppStore';

export function useAppTheme(): {
  isDark: boolean;
  colors: Palette;
  verseTypography: { fontSize: number; lineHeight: number };
} {
  const systemScheme = useColorScheme();
  const themeMode = useAppStore((s) => s.settings.themeMode);
  const fontSize = useAppStore((s) => s.settings.fontSize);

  const isDark =
    themeMode === 'dark' ? true : themeMode === 'light' ? false : systemScheme === 'dark';

  return {
    isDark,
    colors: isDark ? DarkPalette : LightPalette,
    verseTypography: VerseFontScales[fontSize] ?? VerseFontScales.medium,
  };
}
