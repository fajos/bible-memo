import type { FontSizeOption } from '@/types/models';

export interface Palette {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  tabBar: string;
  tabInactive: string;
}

export const LightPalette: Palette = {
  background: '#FAF6EE',
  surface: '#FFFDF9',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F1EADF',
  border: '#E6DCCB',
  text: '#1F1A14',
  textSecondary: '#5B5145',
  textMuted: '#8B7E6E',
  primary: '#2B4C7E',
  primaryText: '#FFFFFF',
  primarySoft: '#E6EEF8',
  accent: '#C48324',
  accentSoft: '#FBF0D9',
  success: '#2E7D5B',
  successSoft: '#E3F3EC',
  warning: '#C97A16',
  warningSoft: '#FCEFD8',
  danger: '#B83A3A',
  dangerSoft: '#FBE6E6',
  tabBar: '#FFFDF9',
  tabInactive: '#9B8F80',
};

export const DarkPalette: Palette = {
  background: '#13110F',
  surface: '#1D1A16',
  surfaceElevated: '#26221D',
  surfaceMuted: '#2C2721',
  border: '#383129',
  text: '#F5EFE6',
  textSecondary: '#C5BBA9',
  textMuted: '#8E8475',
  primary: '#7FA8E0',
  primaryText: '#101824',
  primarySoft: '#1E2C40',
  accent: '#E2A648',
  accentSoft: '#342715',
  success: '#55B98A',
  successSoft: '#183326',
  warning: '#E69F42',
  warningSoft: '#332413',
  danger: '#E57373',
  dangerSoft: '#3B1E1E',
  tabBar: '#191613',
  tabInactive: '#7E7568',
};

export const VerseFontScales: Record<FontSizeOption, { fontSize: number; lineHeight: number }> = {
  small: { fontSize: 16, lineHeight: 25 },
  medium: { fontSize: 19, lineHeight: 30 },
  large: { fontSize: 22, lineHeight: 34 },
  xlarge: { fontSize: 26, lineHeight: 40 },
};

export interface ShareCardTheme {
  id: string;
  name: string;
  bg: string;
  bgSecondary: string;
  text: string;
  accent: string;
  muted: string;
  border: string;
}

export const SHARE_CARD_THEMES: ShareCardTheme[] = [
  {
    id: 'parchment',
    name: 'Parchment',
    bg: '#FAF5E8',
    bgSecondary: '#F0E6D0',
    text: '#221C14',
    accent: '#A96E1C',
    muted: '#6E6151',
    border: '#DFD1B4',
  },
  {
    id: 'midnight',
    name: 'Sanctuary',
    bg: '#162238',
    bgSecondary: '#1F3150',
    text: '#F7F3EA',
    accent: '#E4B258',
    muted: '#B4C3D9',
    border: '#2E456B',
  },
  {
    id: 'olive',
    name: 'Olive Grove',
    bg: '#1E3329',
    bgSecondary: '#284336',
    text: '#F5F2EA',
    accent: '#DFB668',
    muted: '#B5CBBF',
    border: '#395C4B',
  },
  {
    id: 'burgundy',
    name: 'Royal Crimson',
    bg: '#3B1822',
    bgSecondary: '#4E212E',
    text: '#FDF6EC',
    accent: '#EBB767',
    muted: '#D4B6BE',
    border: '#662D3E',
  },
];
