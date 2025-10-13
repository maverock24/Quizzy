import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Animated, Platform } from 'react-native';
import { useOfflineDetection } from '../hooks/useOfflineDetection';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useOfflineDetection();
  const [slideAnim] = useState(new Animated.Value(-100));
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    if (!isOnline) {
      // Show offline indicator
      setShowBackOnline(false);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else if (wasOffline) {
      // Show "back online" message briefly
      setShowBackOnline(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Hide after 3 seconds
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowBackOnline(false);
        });
      }, 3000);
    } else {
      // Hide indicator
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, wasOffline, slideAnim]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: showBackOnline ? '#4caf50' : '#ff9800',
        },
      ]}
    >
      <Text style={styles.text}>
        {showBackOnline ? '✓ Back online' : 'Offline - Using cached data'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
