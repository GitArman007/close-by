import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Check, UserRound, X } from 'lucide-react-native';
import {
  borders,
  colors,
  icons,
  motion,
  radii,
  safetyCopy,
  spacing,
  typography,
} from '@/theme';
import { Pill } from './Pill';

export type TimelineStepState = 'completed' | 'current' | 'upcoming' | 'cancelled';

export interface TimelineStaffInfo {
  name: string;
  designation?: string;
  clinicName: string;
}

export interface TimelineStepProps {
  /** Stage title: e.g. Requested, Assigned, In progress, Completed */
  title: string;
  /** Reassuring plain-language explanation of the stage (16px body) */
  subtitle?: string;
  /** Timestamp rendered in compact tabular mono */
  timestamp?: string;
  state: TimelineStepState;
  isLast?: boolean;
  /**
   * Uses marigold (#E8A317) as the single subtle pulse accent for the active stage.
   * Set false if another element already holds the screen's single marigold accent.
   */
  accentCurrent?: boolean;
  /** Assigned staff member shown with an official "Verified by <Clinic>" stamp */
  staff?: TimelineStaffInfo;
  style?: StyleProp<ViewStyle>;
}

export function TimelineStep({
  title,
  subtitle,
  timestamp,
  state,
  isLast = false,
  accentCurrent = true,
  staff,
  style,
}: TimelineStepProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (state === 'current') {
      pulse.value = 0;
      pulse.value = withRepeat(
        withTiming(1, {
          duration: motion.pulseCycle,
          easing: Easing.out(Easing.cubic),
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }

    return () => {
      cancelAnimation(pulse);
    };
  }, [state, pulse]);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.75 }],
    opacity: (1 - pulse.value) * 0.45,
  }));

  const currentColor = accentCurrent ? colors.accent : colors.primary;

  const isCompleted = state === 'completed';
  const isCurrent = state === 'current';
  const isCancelled = state === 'cancelled';
  const isUpcoming = state === 'upcoming';

  const connectorColor = isCompleted ? colors.primary : colors.borderStrong;

  return (
    <View style={[styles.row, style]}>
      {/* Left rail: node + vertical hairline connector */}
      <View style={styles.railColumn}>
        <View style={styles.nodeWrapper}>
          {isCurrent && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseHalo,
                { backgroundColor: currentColor },
                pulseRingStyle,
              ]}
            />
          )}

          <View
            style={[
              styles.node,
              isCompleted && styles.nodeCompleted,
              isCurrent && {
                backgroundColor: colors.surface,
                borderColor: currentColor,
                borderWidth: 2,
              },
              isCancelled && styles.nodeCancelled,
              isUpcoming && styles.nodeUpcoming,
            ]}
          >
            {isCompleted && (
              <Check
                size={13}
                color={colors.onPrimary}
                strokeWidth={icons.strokeWidth}
              />
            )}
            {isCurrent && (
              <View
                style={[styles.currentDot, { backgroundColor: currentColor }]}
              />
            )}
            {isCancelled && (
              <X
                size={13}
                color={colors.onAlert}
                strokeWidth={icons.strokeWidth}
              />
            )}
          </View>
        </View>

        {!isLast && (
          <View
            style={[
              styles.connector,
              { backgroundColor: connectorColor },
              isUpcoming && styles.connectorUpcoming,
            ]}
          />
        )}
      </View>

      {/* Right content column */}
      <View style={[styles.contentColumn, !isLast && styles.contentSpacing]}>
        <View style={styles.headerRow}>
          <Text
            style={[
              typography.bodyMedium,
              styles.title,
              isUpcoming && styles.titleUpcoming,
              isCancelled && styles.titleCancelled,
            ]}
          >
            {title}
          </Text>
          {timestamp ? (
            <Text style={[typography.monoMeta, styles.timestamp]}>
              {timestamp}
            </Text>
          ) : null}
        </View>

        {subtitle ? (
          <Text
            style={[
              typography.body,
              styles.subtitle,
              isUpcoming && styles.subtitleUpcoming,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}

        {staff ? (
          <View style={styles.staffStampCard}>
            <View style={styles.staffIdentity}>
              <View style={styles.staffIconWell}>
                <UserRound
                  size={icons.sm}
                  color={colors.primary}
                  strokeWidth={icons.strokeWidth}
                />
              </View>
              <View style={styles.staffText}>
                <Text style={typography.bodyMedium}>{staff.name}</Text>
                {staff.designation ? (
                  <Text style={[typography.label, styles.staffDesignation]}>
                    {staff.designation}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pill
              label={`${safetyCopy.verifiedPrefix} ${staff.clinicName}`}
              tone="verified"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  railColumn: {
    width: 32,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  nodeWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseHalo: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: radii.pill,
  },
  node: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCompleted: {
    backgroundColor: colors.primary,
    borderWidth: borders.hairline,
    borderColor: colors.primary,
  },
  nodeCancelled: {
    backgroundColor: colors.alert,
    borderWidth: borders.hairline,
    borderColor: colors.alert,
  },
  nodeUpcoming: {
    backgroundColor: colors.background,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  connector: {
    flex: 1,
    width: borders.hairline,
    minHeight: 28,
    marginVertical: 4,
  },
  connectorUpcoming: {
    backgroundColor: colors.border,
  },
  contentColumn: {
    flex: 1,
    paddingTop: 2,
  },
  contentSpacing: {
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
  },
  titleUpcoming: {
    color: colors.inkSubtle,
  },
  titleCancelled: {
    color: colors.alert,
  },
  timestamp: {
    color: colors.inkSubtle,
  },
  subtitle: {
    color: colors.inkMuted,
    marginTop: 4,
  },
  subtitleUpcoming: {
    color: colors.inkSubtle,
  },
  staffStampCard: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  staffIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  staffIconWell: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffText: {
    flex: 1,
  },
  staffDesignation: {
    color: colors.inkMuted,
  },
});
