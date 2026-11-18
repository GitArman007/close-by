import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { PhoneCall } from 'lucide-react-native';
import { borders, colors, icons, radii, safetyCopy, spacing, typography } from '@/theme';

export function EmergencyBanner({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.banner, style]} accessibilityRole="text">
      <PhoneCall
        size={icons.sm}
        color={colors.alert}
        strokeWidth={icons.strokeWidth}
      />
      <Text style={[typography.label, styles.text]}>
        {safetyCopy.emergencyNotice}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.alertSoft,
    borderWidth: borders.hairline,
    borderColor: 'rgba(196, 69, 45, 0.24)',
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    color: colors.alert,
    flex: 1,
  },
});
