import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web') {
      return;
    }

    // Check initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      console.log('[Offline Detection] Connection restored');
      setWasOffline(!isOnline); // Mark that we were offline
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[Offline Detection] Connection lost');
      setIsOnline(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
};
