import { TextStyle } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from '@expo-google-fonts/ibm-plex-mono';
import { colors } from './tokens';

export const fontFamilies = {
  displayRegular: 'Fraunces_400Regular',
  displayMedium: 'Fraunces_500Medium',
  displaySemiBold: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',

  sansRegular: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',

  monoRegular: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoSemiBold: 'IBMPlexMono_600SemiBold',
} as const;

export const fontMap = {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
};

/**
 * Loads closeBy's Fraunces (display serif), DM Sans (UI sans),
 * and IBM Plex Mono (tabular medical slip numerals) via expo-font.
 */
export function useCloseByFonts() {
  return useFonts(fontMap);
}

/**
 * Editorial type scale.
 * Rule: Minimum body font size is 16px across the entire app.
 */
export const typography: Record<string, TextStyle> = {
  displayHero: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  displayStat: {
    fontFamily: fontFamilies.displayMedium,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  heading: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  subheading: {
    fontFamily: fontFamilies.displayMedium,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
    color: colors.ink,
  },
  bodyLarge: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 18,
    lineHeight: 26,
    color: colors.ink,
  },
  body: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  bodyMedium: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  bodyMuted: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkMuted,
  },
  button: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  /** Compact metadata & pill labels only — never used for body paragraphs */
  label: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
  },
  kicker: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.inkSubtle,
  },
  monoReading: {
    fontFamily: fontFamilies.monoMedium,
    fontSize: 20,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
    color: colors.ink,
  },
  monoMeta: {
    fontFamily: fontFamilies.monoRegular,
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
    color: colors.inkMuted,
  },
};
