import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borders, colors, radii, spacing, typography } from '@/theme';

export type StatEmphasis = 'default' | 'primary' | 'accent' | 'alert';

export interface StatProps {
  /** Uppercase hairline kicker describing the measurement or metric */
  label: string;
  /** Primary display reading (Fraunces serif by default, or IBM Plex Mono when mono=true) */
  value: string;
  /** Optional unit placed neatly alongside the figure (e.g. mmHg, mg/dL, °F) */
  unit?: string;
  /** Reassuring human context (minimum 16px body) */
  caption?: string;
  /** Use tabular monospace numerals for clinical measurements */
  mono?: boolean;
  /** Frame inside a #FFFDF8 hairline sheet (false keeps it open on warm paper) */
  framed?: boolean;
  emphasis?: StatEmphasis;
  style?: StyleProp<ViewStyle>;
}

const emphasisColors: Record<StatEmphasis, string> = {
  default: colors.ink,
  primary: colors.primary,
  accent: colors.accentInk,
  alert: colors.alert,
};

export function Stat({
  label,
  value,
  unit,
  caption,
  mono = false,
  framed = false,
  emphasis = 'default',
  style,
}: StatProps) {
  const valueColor = emphasisColors[emphasis];

  return (
    <View style={[styles.container, framed && styles.framed, style]}>
      <Text style={typography.kicker}>{label}</Text>

      <View style={styles.valueRow}>
        <Text
          style={[
            mono ? typography.monoReading : typography.displayStat,
            mono && styles.monoLarge,
            { color: valueColor },
          ]}
        >
          {value}
        </Text>
        {unit ? <Text style={[typography.label, styles.unit]}>{unit}</Text> : null}
      </View>

      {caption ? <Text style={typography.bodyMuted}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
  },
  framed: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  monoLarge: {
    fontSize: 28,
    lineHeight: 34,
  },
  unit: {
    color: colors.inkSubtle,
  },
});
