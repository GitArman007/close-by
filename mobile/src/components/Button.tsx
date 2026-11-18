import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import {
  borders,
  colors,
  icons,
  layout,
  motion,
  radii,
  spacing,
  triggerLightHaptic,
  typography,
} from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'alert' | 'accent';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  /**
   * Note: 'accent' (marigold #E8A317) should be used at most ONCE per screen.
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const variantStyles: Record<
  ButtonVariant,
  {
    bg: string;
    borderColor: string;
    textColor: string;
    spinnerColor: string;
  }
> = {
  primary: {
    bg: colors.primary,
    borderColor: colors.primary,
    textColor: colors.onPrimary,
    spinnerColor: colors.onPrimary,
  },
  secondary: {
    bg: colors.surface,
    borderColor: colors.borderStrong,
    textColor: colors.ink,
    spinnerColor: colors.primary,
  },
  ghost: {
    bg: 'transparent',
    borderColor: 'transparent',
    textColor: colors.primary,
    spinnerColor: colors.primary,
  },
  alert: {
    bg: colors.alert,
    borderColor: colors.alert,
    textColor: colors.onAlert,
    spinnerColor: colors.onAlert,
  },
  accent: {
    bg: colors.accent,
    borderColor: colors.accent,
    textColor: colors.ink,
    spinnerColor: colors.ink,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = true,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const palette = variantStyles[variant];

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withTiming(0.985, {
      duration: motion.fast,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(0.88, {
      duration: motion.fast,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: motion.fast,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration: motion.fast,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handlePress = () => {
    if (isDisabled) return;
    if (haptic) {
      void triggerLightHaptic();
    }
    onPress?.();
  };

  const iconSize = size === 'sm' ? icons.sm : icons.md;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        {
          backgroundColor: palette.bg,
          borderColor: palette.borderColor,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={palette.spinnerColor} />
        ) : (
          Icon &&
          iconPosition === 'left' && (
            <Icon
              size={iconSize}
              color={palette.textColor}
              strokeWidth={icons.strokeWidth}
            />
          )
        )}

        <Text
          style={[
            typography.button,
            { color: palette.textColor },
            size === 'sm' && styles.labelSm,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {!loading && Icon && iconPosition === 'right' && (
          <Icon
            size={iconSize}
            color={palette.textColor}
            strokeWidth={icons.strokeWidth}
          />
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.button,
    borderWidth: borders.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  sizeMd: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sizeSm: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  disabled: {
    opacity: 0.48,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  labelSm: {
    fontSize: 15,
  },
});
