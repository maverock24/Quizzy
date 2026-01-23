import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

type QuizTimerProps = {
    durationMinutes: number;
    onTimeUp: () => void;
    isActive: boolean;
};

export const QuizTimer: React.FC<QuizTimerProps> = ({
    durationMinutes,
    onTimeUp,
    isActive,
}) => {
    const { t } = useTranslation();
    const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60); // Convert to seconds
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const isWarning = timeRemaining <= 30; // Last 30 seconds warning
    const isCritical = timeRemaining <= 10; // Last 10 seconds critical

    // Reset timer when duration changes or becomes active
    useEffect(() => {
        if (isActive) {
            setTimeRemaining(durationMinutes * 60);
        }
    }, [durationMinutes, isActive]);

    // Countdown timer
    useEffect(() => {
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
    }, [isActive, timeRemaining, onTimeUp]);

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
                ])
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
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                {formatTime(timeRemaining)}
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
