import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { borders, colors, radii, spacing, typography } from '@/theme';

export interface InputFieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function InputField({
  label,
  hint,
  error,
  containerStyle,
  multiline,
  style,
  ...rest
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Text style={[typography.label, styles.label]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkSubtle}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          typography.body,
          multiline && styles.multiline,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={[typography.label, styles.errorText]}>{error}</Text>
      ) : hint ? (
        <Text style={[typography.label, styles.hintText]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    color: colors.ink,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: borders.hairline,
    borderColor: colors.borderStrong,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    color: colors.ink,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.alert,
  },
  errorText: {
    color: colors.alert,
  },
  hintText: {
    color: colors.inkSubtle,
  },
});
