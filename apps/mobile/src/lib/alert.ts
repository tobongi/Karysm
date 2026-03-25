import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert that works on web and native.
 * On web, uses window.confirm/alert. On native, uses Alert.alert.
 */
export function showAlert(
  title: string,
  message?: string,
  onOk?: () => void,
) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(message ? `${title}\n\n${message}` : title);
      onOk?.();
    }
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const result = window.confirm(`${title}\n\n${message}`);
      if (result) onConfirm();
      else onCancel?.();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Non', style: 'cancel', onPress: onCancel },
      { text: 'Oui', onPress: onConfirm },
    ]);
  }
}
