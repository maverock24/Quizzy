import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { remainingSeconds } from '@/services/timedRound';

type QuizTimerProps = {
  durationMinutes: number;
  onTimeUp: () => void;
  isActive: boolean;
  /** Absolute deadline in ms. When set, this component is a pure display. */
  deadline?: number;
};

export const QuizTimer: React.FC<QuizTimerProps> = ({
  durationMinutes,
  onTimeUp,
  isActive,
  deadline,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60); // Convert to seconds
  // Bumped once a second in deadline mode to force a re-render; the value is unused.
  const [, setClockTick] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const secondsLeft =
    deadline === undefined
      ? timeRemaining
      : remainingSeconds(deadline, Date.now());
  const isWarning = secondsLeft <= 30; // Last 30 seconds warning
  const isCritical = secondsLeft <= 10; // Last 10 seconds critical

  // Reset timer when duration changes or becomes active
  useEffect(() => {
    if (isActive) {
      setTimeRemaining(durationMinutes * 60);
    }
  }, [durationMinutes, isActive]);

  // Countdown timer (count mode only; a deadline means the parent owns the clock)
  useEffect(() => {
    if (deadline !== undefined) return;
    if (!isActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline, isActive, timeRemaining, onTimeUp]);

  // Deadline mode is display only: tick to re-render, never count down, never
  // call onTimeUp.
  useEffect(() => {
    if (deadline === undefined) return;

    const interval = setInterval(() => {
      setClockTick((tick) => tick + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  // Pulse animation for warning state
  useEffect(() => {
    if (isWarning && isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isWarning, isActive, pulseAnim]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        isCritical && styles.containerCritical,
        isWarning && !isCritical && styles.containerWarning,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Ionicons
        name="timer-outline"
        size={20}
        color={isCritical ? '#ff4444' : isWarning ? '#ffaa00' : 'white'}
        style={styles.icon}
      />
      <Text
        style={[
          styles.timerText,
          isCritical && styles.timerTextCritical,
          isWarning && !isCritical && styles.timerTextWarning,
        ]}
      >
        {formatTime(secondsLeft)}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    alignSelf: 'center',
  },
  containerWarning: {
    backgroundColor: 'rgba(255, 170, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#ffaa00',
  },
  containerCritical: {
    backgroundColor: 'rgba(255, 68, 68, 0.3)',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  icon: {
    marginRight: 8,
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontVariant: ['tabular-nums'],
  },
  timerTextWarning: {
    color: '#ffaa00',
  },
  timerTextCritical: {
    color: '#ff4444',
  },
});
