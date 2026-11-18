import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Light tactile feedback on key actions (booking, starting/completing visits,
 * exporting PDF slips). Safely no-ops on Expo Web or unsupported devices.
 */
export async function triggerLightHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Ignore on simulators or devices without haptic engine
  }
}

export async function triggerSelectionHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignore on simulators or devices without haptic engine
  }
}
