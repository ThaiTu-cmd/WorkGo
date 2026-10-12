import * as Haptics from 'expo-haptics';

export const hapticFeedback = {
  selection: async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Safely ignored on unsupported platforms or tests
    }
  },
  success: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Safely ignored
    }
  },
  error: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Safely ignored
    }
  },
  warning: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Safely ignored
    }
  },
};
