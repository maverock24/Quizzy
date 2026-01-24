/**
 * XPProgress Component
 * Shows XP bar, current level, and level title
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useGamification } from './GamificationProvider';
import { useTranslation } from 'react-i18next';

interface XPProgressProps {
    size?: 'compact' | 'full';
    showTitle?: boolean;
    style?: any;
}

export const XPProgress: React.FC<XPProgressProps> = ({
    size = 'full',
    showTitle = true,
    style,
}) => {
    const { xp, levelTitle } = useGamification();
    const { t } = useTranslation();
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const [displayXP, setDisplayXP] = useState(0);

    // Progress calculation
    const progressPercentage = xp.xpForNextLevel > 0
        ? Math.min((xp.xpInCurrentLevel / xp.xpForNextLevel) * 100, 100)
        : 100;

    // Animate progress bar
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progressPercentage,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();

        // Animate XP counter
        const duration = 1000;
        const startTime = Date.now();
        const startXP = displayXP;
        const targetXP = xp.xpInCurrentLevel;

        const animateXP = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            setDisplayXP(Math.round(startXP + (targetXP - startXP) * eased));

            if (progress < 1) {
                requestAnimationFrame(animateXP);
            }
        };
        animateXP();
    }, [xp.xpInCurrentLevel, xp.xpForNextLevel]);

    // Level up pulse animation
    useEffect(() => {
        Animated.sequence([
            Animated.timing(pulseAnim, {
                toValue: 1.2,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [xp.currentLevel]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    // Get level badge color based on level
    const getLevelColor = () => {
        if (xp.currentLevel >= 15) return '#FF00FF'; // Legendary purple
        if (xp.currentLevel >= 12) return '#00FFFF'; // Diamond cyan
        if (xp.currentLevel >= 9) return '#FFD700'; // Gold
        if (xp.currentLevel >= 6) return '#C0C0C0'; // Silver
        if (xp.currentLevel >= 3) return '#CD7F32'; // Bronze
        return '#4ECDC4'; // Default teal
    };

    if (size === 'compact') {
        return (
            <View style={[styles.compactContainer, style]}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <View style={[styles.levelBadgeSmall, { backgroundColor: getLevelColor() }]}>
                        <Text style={styles.levelTextSmall}>{xp.currentLevel}</Text>
                    </View>
                </Animated.View>
                <View style={styles.compactBarContainer}>
                    <View style={styles.compactProgressBackground}>
                        <Animated.View
                            style={[
                                styles.compactProgressFill,
                                {
                                    width: progressWidth,
                                    backgroundColor: getLevelColor(),
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.compactXPText}>
                        {displayXP}/{xp.xpForNextLevel}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            {/* Level Badge */}
            <View style={styles.header}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
                        <Text style={styles.levelNumber}>{xp.currentLevel}</Text>
                    </View>
                </Animated.View>
                <View style={styles.headerText}>
                    {showTitle && (
                        <Text style={[styles.levelTitle, { color: getLevelColor() }]}>
                            {levelTitle}
                        </Text>
                    )}
                    <Text style={styles.totalXP}>
                        {xp.totalXP.toLocaleString()} {t('total_xp')}
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                width: progressWidth,
                                backgroundColor: getLevelColor(),
                            },
                        ]}
                    />
                    {/* Shimmer effect */}
                    <Animated.View
                        style={[
                            styles.shimmer,
                            {
                                width: progressWidth,
                            },
                        ]}
                    />
                </View>
                <View style={styles.progressLabels}>
                    <Text style={styles.xpCurrent}>{displayXP} XP</Text>
                    <Text style={styles.xpNext}>
                        {xp.xpForNextLevel > 0
                            ? `${xp.xpForNextLevel - xp.xpInCurrentLevel} ${t('xp_to_next')}`
                            : t('max_level')
                        }
                    </Text>
                </View>
            </View>

            {/* Next Level Preview */}
            {xp.xpForNextLevel > 0 && (
                <View style={styles.nextLevelPreview}>
                    <Text style={styles.nextLevelLabel}>{t('next_level')}:</Text>
                    <View style={[styles.nextLevelBadge, { borderColor: getLevelColor() }]}>
                        <Text style={[styles.nextLevelNumber, { color: getLevelColor() }]}>
                            {xp.currentLevel + 1}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // Full size container
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    levelNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    headerText: {
        marginLeft: 16,
        flex: 1,
    },
    levelTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    totalXP: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 2,
    },

    // Progress bar
    progressContainer: {
        marginTop: 8,
    },
    progressBackground: {
        height: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 8,
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    xpCurrent: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    xpNext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },

    // Next level preview
    nextLevelPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    nextLevelLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        marginRight: 8,
    },
    nextLevelBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    nextLevelNumber: {
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Compact size
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    levelBadgeSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelTextSmall: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    compactBarContainer: {
        marginLeft: 10,
        flex: 1,
    },
    compactProgressBackground: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    compactProgressFill: {
        height: '100%',
        borderRadius: 4,
    },
    compactXPText: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 2,
        textAlign: 'right',
    },
});

export default XPProgress;
