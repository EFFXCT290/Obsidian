/**
 * Notification utilities
 * Provides consistent notification handling across the app
 */

import toast from 'react-hot-toast';

export function showNotification(message: string, type: 'success' | 'error' = 'success') {
  if (type === 'success') {
    toast.success(message);
  } else {
    toast.error(message);
  }
}
