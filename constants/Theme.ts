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
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#0A3960',
  primaryText: '#FFFFFF',
  primarySoft: '#E0F2FE',
  accent: '#D97706',
  accentSoft: '#FEF3C7',
  success: '#059669',
  successSoft: '#D1FAE5',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  tabBar: '#FFFFFF',
  tabInactive: '#94A3B8',
};

export const DarkPalette: Palette = {
  background: '#070D18',
  surface: '#0E182A',
  surfaceElevated: '#14223A',
  surfaceMuted: '#1A2A46',
  border: '#1E3456',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#38BDF8',
  primaryText: '#070D18',
  primarySoft: '#0C2B4E',
  accent: '#FBBF24',
  accentSoft: '#2D2008',
  success: '#34D399',
  successSoft: '#063D2B',
  warning: '#FBBF24',
  warningSoft: '#2D2008',
  danger: '#F87171',
  dangerSoft: '#3D1414',
  tabBar: '#0A1220',
  tabInactive: '#64748B',
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
    id: 'midnight',
    name: 'Selah Midnight',
    bg: '#080F1D',
    bgSecondary: '#13223D',
    text: '#F8FAFC',
    accent: '#FBBF24',
    muted: '#94A3B8',
    border: '#1E3456',
  },
  {
    id: 'emerald',
    name: 'Tree of Life',
    bg: '#05221B',
    bgSecondary: '#0A382D',
    text: '#F8FAFC',
    accent: '#34D399',
    muted: '#A7F3D0',
    border: '#115E59',
  },
  {
    id: 'celestial_dawn',
    name: 'Celestial Dawn',
    bg: '#F8FAFC',
    bgSecondary: '#F1F5F9',
    text: '#0F172A',
    accent: '#D97706',
    muted: '#475569',
    border: '#E2E8F0',
  },
  {
    id: 'royal',
    name: 'Royal Sanctuary',
    bg: '#1E1B4B',
    bgSecondary: '#2E286D',
    text: '#F8FAFC',
    accent: '#FDE047',
    muted: '#C7D2FE',
    border: '#4338CA',
  },
];
