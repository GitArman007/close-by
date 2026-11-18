import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { roleHomeRoute, useAuth } from '@/auth/AuthContext';
import { EmptyState } from '@/components';
import { colors, loadingStates, spacing } from '@/theme';

export default function Index() {
  const { user, isHydrating } = useAuth();

  if (isHydrating) {
    return (
      <View style={styles.loadingWrap}>
        <EmptyState
          mode="loading"
          title={loadingStates.diary.title}
          body={loadingStates.diary.body}
          style={styles.card}
        />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={roleHomeRoute(user.role) as never} />;
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 460,
  },
});
