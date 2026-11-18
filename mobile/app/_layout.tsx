import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/auth/AuthContext';
import { DemoSwitcherModal } from '@/components';
import { colors, useCloseByFonts } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useCloseByFonts();

  if (!fontsLoaded && !fontError) {
    return <View style={styles.splashPaper} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}
        />
        <DemoSwitcherModal />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashPaper: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
