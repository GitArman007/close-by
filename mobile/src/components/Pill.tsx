import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { borders, colors, icons, radii, spacing, typography } from '@/theme';

export type PillTone =
  | 'neutral'
  | 'primary'
  | 'verified'
  | 'requested'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'accent'
  | 'alert';

export interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: LucideIcon;
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
}

const toneMap: Record<
  PillTone,
  {
    bg: string;
    border: string;
    text: string;
    dot: string;
  }
> = {
  neutral: {
    bg: colors.surfaceSubtle,
    border: colors.border,
    text: colors.inkMuted,
    dot: colors.inkSubtle,
  },
  primary: {
    bg: colors.primarySoft,
    border: 'rgba(31, 77, 69, 0.22)',
    text: colors.primary,
    dot: colors.primary,
  },
  verified: {
    bg: colors.primarySoft,
    border: 'rgba(31, 77, 69, 0.28)',
    text: colors.primary,
    dot: colors.primary,
  },
  requested: {
    bg: colors.surface,
    border: colors.borderStrong,
    text: colors.inkMuted,
    dot: colors.inkSubtle,
  },
  assigned: {
    bg: colors.primarySoft,
    border: 'rgba(31, 77, 69, 0.20)',
    text: colors.primary,
    dot: colors.primary,
  },
  in_progress: {
    bg: colors.accentSoft,
    border: 'rgba(232, 163, 23, 0.42)',
    text: colors.accentInk,
    dot: colors.accent,
  },
  completed: {
    bg: colors.primarySoft,
    border: 'rgba(31, 77, 69, 0.24)',
    text: colors.primary,
    dot: colors.primary,
  },
  cancelled: {
    bg: colors.alertSoft,
    border: 'rgba(196, 69, 45, 0.28)',
    text: colors.alert,
    dot: colors.alert,
  },
  accent: {
    bg: colors.accentSoft,
    border: 'rgba(232, 163, 23, 0.42)',
    text: colors.accentInk,
    dot: colors.accent,
  },
  alert: {
    bg: colors.alertSoft,
    border: 'rgba(196, 69, 45, 0.28)',
    text: colors.alert,
    dot: colors.alert,
  },
};

export function Pill({
  label,
  tone = 'neutral',
  icon,
  showDot = false,
  style,
}: PillProps) {
  const palette = toneMap[tone];
  const ResolvedIcon = icon ?? (tone === 'verified' ? ShieldCheck : undefined);

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      {showDot && !ResolvedIcon && (
        <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      )}
      {ResolvedIcon && (
        <ResolvedIcon
          size={14}
          color={palette.text}
          strokeWidth={icons.strokeWidth}
        />
      )}
      <Text style={[typography.label, styles.text, { color: palette.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: radii.pill,
    borderWidth: borders.hairline,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radii.pill,
  },
  text: {
    fontSize: 13,
    lineHeight: 17,
  },
});
