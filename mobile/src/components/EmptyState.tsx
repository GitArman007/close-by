import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AlertCircle, BookOpen } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  borders,
  colors,
  icons,
  motion,
  radii,
  spacing,
  typography,
} from '@/theme';
import { Button } from './Button';

export type EmptyStateMode = 'empty' | 'loading' | 'error';

export interface EmptyStateProps {
  mode?: EmptyStateMode;
  /** Real, calm editorial heading — never generic placeholders */
  title: string;
  /** Reassuring human explanation (minimum 16px body) */
  body: string;
  /** Single icon from lucide-react-native (rendered at 1.75 stroke) */
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  /** Optional hairline surface frame (defaults to true) */
  framed?: boolean;
  style?: StyleProp<ViewStyle>;
}

function SkeletonBar({
  width,
  height = 14,
  opacity,
}: {
  width: `${number}%`;
  height?: number;
  opacity: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeletonBar,
        { width, height },
        animatedStyle,
      ]}
    />
  );
}

export function EmptyState({
  mode = 'empty',
  title,
  body,
  icon,
  actionLabel,
  onAction,
  framed = true,
  style,
}: EmptyStateProps) {
  const skeletonOpacity = useSharedValue(0.45);

  useEffect(() => {
    if (mode === 'loading') {
      skeletonOpacity.value = withRepeat(
        withSequence(
          withTiming(0.95, {
            duration: motion.skeletonCycle / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.45, {
            duration: motion.skeletonCycle / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(skeletonOpacity);
      skeletonOpacity.value = 1;
    }

    return () => {
      cancelAnimation(skeletonOpacity);
    };
  }, [mode, skeletonOpacity]);

  const isError = mode === 'error';
  const isLoading = mode === 'loading';
  const ResolvedIcon = icon ?? (isError ? AlertCircle : BookOpen);

  return (
    <View
      style={[
        styles.container,
        framed && styles.framed,
        isError && framed && styles.framedError,
        style,
      ]}
      accessibilityRole={isError ? 'alert' : 'summary'}
    >
      {isLoading ? (
        <View style={styles.skeletonGroup}>
          <SkeletonBar width="42%" height={12} opacity={skeletonOpacity} />
          <SkeletonBar width="78%" height={22} opacity={skeletonOpacity} />
          <SkeletonBar width="100%" height={14} opacity={skeletonOpacity} />
          <SkeletonBar width="86%" height={14} opacity={skeletonOpacity} />
        </View>
      ) : (
        <View
          style={[
            styles.iconWell,
            isError ? styles.iconWellError : styles.iconWellDefault,
          ]}
        >
          <ResolvedIcon
            size={icons.lg}
            color={isError ? colors.alert : colors.primary}
            strokeWidth={icons.strokeWidth}
          />
        </View>
      )}

      <Text style={[typography.subheading, styles.title]}>{title}</Text>
      <Text style={[typography.bodyMuted, styles.body]}>{body}</Text>

      {!isLoading && actionLabel && onAction ? (
        <View style={styles.actionRow}>
          <Button
            label={actionLabel}
            variant={isError ? 'secondary' : 'primary'}
            onPress={onAction}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  framed: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  framedError: {
    borderColor: 'rgba(196, 69, 45, 0.28)',
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: borders.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  iconWellDefault: {
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(31, 77, 69, 0.18)',
  },
  iconWellError: {
    backgroundColor: colors.alertSoft,
    borderColor: 'rgba(196, 69, 45, 0.24)',
  },
  skeletonGroup: {
    width: '100%',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  skeletonBar: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 6,
  },
  title: {
    color: colors.ink,
  },
  body: {
    maxWidth: 560,
  },
  actionRow: {
    marginTop: spacing.sm,
  },
});
