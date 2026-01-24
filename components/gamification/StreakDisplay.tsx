/**
 * StreakDisplay Component
 * Shows current streak with flame indicators and animation
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useGamification } from './GamificationProvider';
import { useTranslation } from 'react-i18next';

interface StreakDisplayProps {
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    style?: any;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
    size = 'medium',
    showLabel = true,
    style,
}) => {
    const { streak } = useGamification();
    const { t } = useTranslation();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    // Flame animation
    useEffect(() => {
        if (streak.currentStreak > 0) {
            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 500,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Glow animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [streak.currentStreak]);

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    container: styles.containerSmall,
                    flame: styles.flameSmall,
                    count: styles.countSmall,
                    label: styles.labelSmall,
                };
            case 'large':
                return {
                    container: styles.containerLarge,
                    flame: styles.flameLarge,
                    count: styles.countLarge,
                    label: styles.labelLarge,
                };
            default:
                return {
                    container: styles.containerMedium,
                    flame: styles.flameMedium,
                    count: styles.countMedium,
                    label: styles.labelMedium,
                };
        }
    };

    const sizeStyles = getSizeStyles();

    // Multiple flames based on streak milestones
    const getFlameCount = () => {
        if (streak.currentStreak >= 100) return 5;
        if (streak.currentStreak >= 30) return 4;
        if (streak.currentStreak >= 7) return 3;
        if (streak.currentStreak >= 3) return 2;
        return 1;
    };

    const getFlameColor = () => {
        if (streak.currentStreak >= 100) return '#FF00FF'; // Purple fire
        if (streak.currentStreak >= 30) return '#00BFFF'; // Blue fire
        if (streak.currentStreak >= 7) return '#FFD700'; // Gold fire
        return '#FF6B35'; // Orange fire
    };

    const renderFlames = () => {
        const flameCount = getFlameCount();
        const flames = [];

        for (let i = 0; i < flameCount; i++) {
            const isCenter = i === Math.floor(flameCount / 2);
            const delay = i * 100;

            flames.push(
                <Animated.Text
                    key={i}
                    style={[
                        sizeStyles.flame,
                        {
                            transform: [
                                { scale: isCenter ? pulseAnim : Animated.multiply(pulseAnim, 0.85) },
                            ],
                            opacity: isCenter ? 1 : 0.7,
                            marginHorizontal: size === 'small' ? -2 : -4,
                        },
                    ]}
                >
                    🔥
                </Animated.Text>
            );
        }

        return flames;
    };

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    if (streak.currentStreak === 0) {
        return (
            <View style={[sizeStyles.container, styles.inactiveContainer, style]}>
                <Text style={[sizeStyles.flame, styles.inactiveFlame]}>🔥</Text>
                <Text style={[sizeStyles.count, styles.inactiveCount]}>0</Text>
                {showLabel && (
                    <Text style={[sizeStyles.label, styles.inactiveLabel]}>
                        {t('streak')}
                    </Text>
                )}
            </View>
        );
    }

    return (
        <View style={[sizeStyles.container, style]}>
            <Animated.View
                style={[
                    styles.glowBackground,
                    {
                        opacity: glowOpacity,
                        backgroundColor: getFlameColor(),
                    },
                ]}
            />
            <View style={styles.flameContainer}>{renderFlames()}</View>
            <Text style={[sizeStyles.count, { color: getFlameColor() }]}>
                {streak.currentStreak}
            </Text>
            {showLabel && (
                <Text style={sizeStyles.label}>
                    {t('day_streak')}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // Size variants - Container
    containerSmall: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        minWidth: 60,
    },
    containerMedium: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        minWidth: 100,
    },
    containerLarge: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        minWidth: 140,
    },

    // Size variants - Flame
    flameSmall: {
        fontSize: 20,
    },
    flameMedium: {
        fontSize: 32,
    },
    flameLarge: {
        fontSize: 48,
    },

    // Size variants - Count
    countSmall: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B35',
        marginTop: 2,
    },
    countMedium: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF6B35',
        marginTop: 4,
    },
    countLarge: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FF6B35',
        marginTop: 8,
    },

    // Size variants - Label
    labelSmall: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
    },
    labelMedium: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    labelLarge: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 8,
    },

    // Inactive styles
    inactiveContainer: {
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
    },
    inactiveFlame: {
        opacity: 0.3,
    },
    inactiveCount: {
        color: 'rgba(255, 255, 255, 0.3)',
    },
    inactiveLabel: {
        color: 'rgba(255, 255, 255, 0.3)',
    },

    // Common styles
    flameContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    glowBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16,
        opacity: 0.3,
    },
});

export default StreakDisplay;
