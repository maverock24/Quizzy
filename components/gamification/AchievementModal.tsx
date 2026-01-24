/**
 * AchievementModal Component
 * Celebration modal when achievements are unlocked
 */
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useGamification, NewlyUnlockedAchievement } from './GamificationProvider';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Confetti particle for celebration
const ConfettiPiece: React.FC<{
    delay: number;
    startX: number;
    color: string;
    size: number;
}> = ({ delay, startX, color, size }) => {
    const fallAnim = useRef(new Animated.Value(-50)).current;
    const swayAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const duration = 2500 + Math.random() * 1500;

        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fallAnim, {
                    toValue: SCREEN_HEIGHT + 100,
                    duration: duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(swayAnim, {
                            toValue: 25,
                            duration: 400 + Math.random() * 400,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(swayAnim, {
                            toValue: -25,
                            duration: 400 + Math.random() * 400,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ])
                ),
                Animated.loop(
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 800 + Math.random() * 800,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    })
                ),
            ]),
        ]).start();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: startX,
                width: size,
                height: size * 1.5,
                backgroundColor: color,
                borderRadius: size / 4,
                opacity: opacityAnim,
                transform: [
                    { translateY: fallAnim },
                    { translateX: swayAnim },
                    { rotate: spin },
                ],
            }}
        />
    );
};

export const AchievementModal: React.FC = () => {
    const { newlyUnlockedAchievements, clearNewlyUnlocked } = useGamification();
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(false);

    // Animation refs
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const iconBounceAnim = useRef(new Animated.Value(0)).current;
    const textOpacityAnim = useRef(new Animated.Value(0)).current;
    const xpCountAnim = useRef(new Animated.Value(0)).current;
    const [displayXP, setDisplayXP] = useState(0);

    const confettiColors = [
        '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3',
        '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA',
    ];

    const confettiPieces = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        delay: Math.random() * 800,
        startX: Math.random() * SCREEN_WIDTH,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        size: 6 + Math.random() * 8,
    }));

    useEffect(() => {
        if (newlyUnlockedAchievements.length > 0) {
            setCurrentIndex(0);
            setVisible(true);
            playAnimation();
        }
    }, [newlyUnlockedAchievements]);

    const playAnimation = () => {
        // Reset animations
        scaleAnim.setValue(0);
        iconBounceAnim.setValue(0);
        textOpacityAnim.setValue(0);
        xpCountAnim.setValue(0);
        setDisplayXP(0);

        const achievement = newlyUnlockedAchievements[currentIndex];
        if (!achievement) return;

        // Play animation sequence
        Animated.sequence([
            // Badge pops in
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
            // Icon bounces
            Animated.spring(iconBounceAnim, {
                toValue: 1,
                friction: 3,
                tension: 50,
                useNativeDriver: true,
            }),
            // Text fades in
            Animated.timing(textOpacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            // XP counter
            Animated.timing(xpCountAnim, {
                toValue: achievement.xpReward,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
        ]).start();

        // Animate XP counter display
        xpCountAnim.addListener(({ value }) => {
            setDisplayXP(Math.round(value));
        });
    };

    const handleNext = () => {
        if (currentIndex < newlyUnlockedAchievements.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setTimeout(playAnimation, 100);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setVisible(false);
        clearNewlyUnlocked();
    };

    const currentAchievement = newlyUnlockedAchievements[currentIndex];
    if (!currentAchievement) return null;

    const getCategoryColor = () => {
        switch (currentAchievement.category) {
            case 'streak': return '#FF6B35';
            case 'score': return '#FFD700';
            case 'speed': return '#00BFFF';
            case 'volume': return '#4ECDC4';
            case 'special': return '#FF00FF';
            default: return '#4ECDC4';
        }
    };

    const categoryColor = getCategoryColor();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                {/* Confetti */}
                {confettiPieces.map((piece) => (
                    <ConfettiPiece
                        key={piece.id}
                        delay={piece.delay}
                        startX={piece.startX}
                        color={piece.color}
                        size={piece.size}
                    />
                ))}

                <Animated.View
                    style={[
                        styles.modal,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    {/* Glow effect */}
                    <View style={[styles.glow, { backgroundColor: categoryColor }]} />

                    {/* Header */}
                    <Text style={styles.header}>🎉 {t('achievement_unlocked')} 🎉</Text>

                    {/* Achievement Icon */}
                    <Animated.View
                        style={[
                            styles.iconContainer,
                            {
                                backgroundColor: `${categoryColor}30`,
                                borderColor: categoryColor,
                                transform: [
                                    {
                                        scale: iconBounceAnim.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [0.5, 1.2, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <Text style={styles.icon}>{currentAchievement.icon}</Text>
                    </Animated.View>

                    {/* Achievement Name */}
                    <Animated.Text
                        style={[
                            styles.name,
                            { color: categoryColor, opacity: textOpacityAnim },
                        ]}
                    >
                        {currentAchievement.name}
                    </Animated.Text>

                    {/* Description */}
                    <Animated.Text
                        style={[styles.description, { opacity: textOpacityAnim }]}
                    >
                        {currentAchievement.description}
                    </Animated.Text>

                    {/* XP Reward */}
                    <Animated.View
                        style={[styles.xpContainer, { opacity: textOpacityAnim }]}
                    >
                        <Text style={[styles.xpLabel, { color: categoryColor }]}>
                            +{displayXP}
                        </Text>
                        <Text style={styles.xpText}>XP</Text>
                    </Animated.View>

                    {/* Progress indicator for multiple achievements */}
                    {newlyUnlockedAchievements.length > 1 && (
                        <View style={styles.progressDots}>
                            {newlyUnlockedAchievements.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === currentIndex && styles.activeDot,
                                        index === currentIndex && { backgroundColor: categoryColor },
                                    ]}
                                />
                            ))}
                        </View>
                    )}

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: categoryColor }]}
                            onPress={handleNext}
                        >
                            <Text style={styles.buttonText}>
                                {currentIndex < newlyUnlockedAchievements.length - 1
                                    ? t('next')
                                    : t('awesome')
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    modal: {
        width: '85%',
        maxWidth: 380,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        top: -100,
        width: 200,
        height: 200,
        borderRadius: 100,
        opacity: 0.3,
    },
    header: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        marginBottom: 24,
        textAlign: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        marginBottom: 20,
    },
    icon: {
        fontSize: 48,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    xpContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 24,
    },
    xpLabel: {
        fontSize: 42,
        fontWeight: 'bold',
    },
    xpText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
        marginLeft: 6,
    },
    progressDots: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
});

export default AchievementModal;
