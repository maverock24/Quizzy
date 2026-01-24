/**
 * AchievementBadge Component
 * Displays individual achievement with progress
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Achievement, AchievementProgress } from './types';
import { useTranslation } from 'react-i18next';

interface AchievementBadgeProps {
    achievement: Achievement;
    progress?: AchievementProgress;
    size?: 'small' | 'medium' | 'large';
    showProgress?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
    achievement,
    progress,
    size = 'medium',
    showProgress = true,
}) => {
    const { t } = useTranslation();
    const isUnlocked = progress?.isUnlocked ?? false;
    const currentProgress = progress?.currentProgress ?? 0;

    const progressPercentage = Math.min(
        (currentProgress / achievement.requirement) * 100,
        100
    );

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    container: styles.containerSmall,
                    icon: styles.iconSmall,
                    name: styles.nameSmall,
                    description: styles.descriptionSmall,
                    xp: styles.xpSmall,
                };
            case 'large':
                return {
                    container: styles.containerLarge,
                    icon: styles.iconLarge,
                    name: styles.nameLarge,
                    description: styles.descriptionLarge,
                    xp: styles.xpLarge,
                };
            default:
                return {
                    container: styles.containerMedium,
                    icon: styles.iconMedium,
                    name: styles.nameMedium,
                    description: styles.descriptionMedium,
                    xp: styles.xpMedium,
                };
        }
    };

    const sizeStyles = getSizeStyles();

    const getCategoryColor = () => {
        switch (achievement.category) {
            case 'streak':
                return '#FF6B35'; // Orange
            case 'score':
                return '#FFD700'; // Gold
            case 'speed':
                return '#00BFFF'; // Electric blue
            case 'volume':
                return '#4ECDC4'; // Teal
            case 'special':
                return '#FF00FF'; // Magenta
            default:
                return '#4ECDC4';
        }
    };

    const categoryColor = getCategoryColor();

    if (achievement.isSecret && !isUnlocked) {
        return (
            <View style={[sizeStyles.container, styles.lockedContainer]}>
                <View style={[styles.iconContainer, styles.secretIconContainer]}>
                    <Text style={sizeStyles.icon}>❓</Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={[sizeStyles.name, styles.lockedText]}>
                        {t('secret_achievement')}
                    </Text>
                    <Text style={[sizeStyles.description, styles.lockedText]}>
                        {t('keep_playing')}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View
            style={[
                sizeStyles.container,
                isUnlocked ? styles.unlockedContainer : styles.lockedContainer,
                isUnlocked && { borderColor: categoryColor },
            ]}
        >
            {/* Icon */}
            <View
                style={[
                    styles.iconContainer,
                    isUnlocked
                        ? [styles.unlockedIconContainer, { backgroundColor: `${categoryColor}30` }]
                        : styles.lockedIconContainer,
                ]}
            >
                <Text style={[sizeStyles.icon, !isUnlocked && styles.lockedIcon]}>
                    {achievement.icon}
                </Text>
                {isUnlocked && (
                    <View style={[styles.checkmark, { backgroundColor: categoryColor }]}>
                        <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                )}
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
                <Text
                    style={[
                        sizeStyles.name,
                        isUnlocked ? { color: categoryColor } : styles.lockedText,
                    ]}
                    numberOfLines={1}
                >
                    {achievement.name}
                </Text>
                <Text
                    style={[
                        sizeStyles.description,
                        !isUnlocked && styles.lockedText,
                    ]}
                    numberOfLines={2}
                >
                    {achievement.description}
                </Text>

                {/* Progress Bar (for locked achievements) */}
                {!isUnlocked && showProgress && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBackground}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${progressPercentage}%`,
                                        backgroundColor: categoryColor,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {currentProgress}/{achievement.requirement}
                        </Text>
                    </View>
                )}

                {/* XP Reward */}
                <View style={styles.xpContainer}>
                    <Text
                        style={[
                            sizeStyles.xp,
                            isUnlocked ? { color: categoryColor } : styles.lockedText,
                        ]}
                    >
                        +{achievement.xpReward} XP
                    </Text>
                    {isUnlocked && progress?.unlockedAt && (
                        <Text style={styles.unlockedDate}>
                            {new Date(progress.unlockedAt).toLocaleDateString()}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Size variants - Container
    containerSmall: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    containerMedium: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    containerLarge: {
        flexDirection: 'row',
        padding: 18,
        borderRadius: 16,
        borderWidth: 2,
    },

    // Size variants - Icon
    iconSmall: {
        fontSize: 24,
    },
    iconMedium: {
        fontSize: 32,
    },
    iconLarge: {
        fontSize: 40,
    },

    // Size variants - Name
    nameSmall: {
        fontSize: 13,
        fontWeight: '600',
        color: 'white',
    },
    nameMedium: {
        fontSize: 15,
        fontWeight: '600',
        color: 'white',
    },
    nameLarge: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },

    // Size variants - Description
    descriptionSmall: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
    },
    descriptionMedium: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
    },
    descriptionLarge: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 6,
    },

    // Size variants - XP
    xpSmall: {
        fontSize: 11,
        fontWeight: '600',
    },
    xpMedium: {
        fontSize: 12,
        fontWeight: '600',
    },
    xpLarge: {
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Container states
    unlockedContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    lockedContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },

    // Icon container
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    unlockedIconContainer: {
        position: 'relative',
    },
    lockedIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    secretIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    lockedIcon: {
        opacity: 0.3,
        // Grayscale effect via desaturation isn't available, so we use opacity
    },

    // Checkmark
    checkmark: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#1a1a1a',
    },
    checkmarkText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },

    // Text container
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    lockedText: {
        color: 'rgba(255, 255, 255, 0.4)',
    },

    // Progress
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    progressBackground: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        marginRight: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.5)',
        minWidth: 40,
        textAlign: 'right',
    },

    // XP container
    xpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    unlockedDate: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
    },
});

export default AchievementBadge;
