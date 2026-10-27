import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGamification } from '@/components/gamification';

type StreakPetProps = {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
};

// Module scope may only hold keys: a `t()` here would freeze the language at
// import time. The words are resolved inside the component.
type PetStage = {
  minStreak: number;
  emoji: string;
  nameKey: `kids_pet_${number}_name`;
  color: string;
  messageKey: `kids_pet_${number}_message`;
};

const PET_STAGES: PetStage[] = [
  {
    minStreak: 0,
    emoji: '🥚',
    nameKey: 'kids_pet_0_name',
    color: '#FFEAA7',
    messageKey: 'kids_pet_0_message',
  },
  {
    minStreak: 1,
    emoji: '🐣',
    nameKey: 'kids_pet_1_name',
    color: '#FFD93D',
    messageKey: 'kids_pet_1_message',
  },
  {
    minStreak: 3,
    emoji: '🐥',
    nameKey: 'kids_pet_3_name',
    color: '#FFC107',
    messageKey: 'kids_pet_3_message',
  },
  {
    minStreak: 7,
    emoji: '🦉',
    nameKey: 'kids_pet_7_name',
    color: '#8D6E63',
    messageKey: 'kids_pet_7_message',
  },
  {
    minStreak: 14,
    emoji: '🦄',
    nameKey: 'kids_pet_14_name',
    color: '#E1BEE7',
    messageKey: 'kids_pet_14_message',
  },
  {
    minStreak: 30,
    emoji: '🐉',
    nameKey: 'kids_pet_30_name',
    color: '#4CAF50',
    messageKey: 'kids_pet_30_message',
  },
  {
    minStreak: 60,
    emoji: '🌟',
    nameKey: 'kids_pet_60_name',
    color: '#FFD700',
    messageKey: 'kids_pet_60_message',
  },
  {
    minStreak: 100,
    emoji: '👑',
    nameKey: 'kids_pet_100_name',
    color: '#FF4081',
    messageKey: 'kids_pet_100_message',
  },
];

export const StreakPet: React.FC<StreakPetProps> = ({
  size = 'medium',
  showLabel = true,
}) => {
  const { t } = useTranslation();
  const { streak } = useGamification();
  const currentStreak = streak.currentStreak;
  const hasPlayedToday =
    streak.lastQuizDate === new Date().toISOString().split('T')[0];

  const bounceAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const happyAnim = useRef(new Animated.Value(0)).current;

  const stage = useMemo(() => {
    let s = PET_STAGES[0];
    for (const stage of PET_STAGES) {
      if (currentStreak >= stage.minStreak) s = stage;
    }
    return s;
  }, [currentStreak]);

  const nextStage = useMemo(() => {
    const idx = PET_STAGES.indexOf(stage);
    return idx < PET_STAGES.length - 1 ? PET_STAGES[idx + 1] : null;
  }, [stage]);

  const daysToNext = nextStage ? nextStage.minStreak - currentStreak : 0;

  // Bounce animation
  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  // Float animation
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    float.start();
    return () => float.stop();
  }, []);

  // Sparkle animation
  useEffect(() => {
    const sparkle = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    sparkle.start();
    return () => sparkle.stop();
  }, []);

  // Happy pulse when played today
  useEffect(() => {
    if (hasPlayedToday) {
      Animated.sequence([
        Animated.timing(happyAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(happyAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasPlayedToday]);

  const sizeMap = { small: 50, medium: 80, large: 120 };
  const fontSizeMap = { small: 30, medium: 55, large: 85 };
  const petSize = sizeMap[size];
  const fontSize = fontSizeMap[size];

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.petContainer,
          {
            width: petSize + 20,
            height: petSize + 20,
            transform: [{ translateY: floatAnim }, { scale: bounceAnim }],
          },
        ]}
      >
        {/* Sparkles around pet */}
        <Animated.Text
          style={[
            styles.sparkleLeft,
            { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
          ]}
        >
          ✨
        </Animated.Text>
        <Animated.Text
          style={[
            styles.sparkleRight,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
              transform: [{ scale: sparkleScale }],
            },
          ]}
        >
          ⭐
        </Animated.Text>

        {/* The pet */}
        <Animated.Text
          style={[
            styles.petEmoji,
            {
              fontSize,
              transform: [
                {
                  scale: hasPlayedToday
                    ? happyAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.3, 1],
                      })
                    : 1,
                },
              ],
            },
          ]}
        >
          {hasPlayedToday ? stage.emoji : '😴'}
        </Animated.Text>
      </Animated.View>

      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.petName, { color: stage.color }]}>
            {hasPlayedToday ? t(stage.nameKey) : t('kids_pet_sleeping')}
          </Text>
          <Text style={styles.streakText}>
            {`🔥 `}
            {currentStreak}{' '}
            {currentStreak === 1
              ? t('kids_pet_day_in_streak')
              : t('kids_pet_days_in_streak')}
          </Text>
          {!hasPlayedToday && currentStreak > 0 && (
            <Text style={styles.warningText}>
              {`⚠️ `}
              {t('kids_pet_not_played_today')}
            </Text>
          )}
          {hasPlayedToday && nextStage && daysToNext > 0 && (
            <Text style={styles.nextStageText}>
              {t(
                daysToNext === 1
                  ? 'kids_pet_next_stage_one'
                  : 'kids_pet_next_stage_other',
                {
                  days: daysToNext,
                  next: `${nextStage.emoji} ${t(nextStage.nameKey)}`,
                },
              )}
            </Text>
          )}
          {hasPlayedToday && stage.emoji === '👑' && (
            <Text style={[styles.nextStageText, { color: '#FFD700' }]}>
              {`👑 `}
              {t('kids_pet_all_levels')}
            </Text>
          )}
          <Text style={styles.messageText}>
            {hasPlayedToday
              ? t(stage.messageKey)
              : t('kids_pet_sleeping_message')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 12,
  },
  petContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  petEmoji: {
    textAlign: 'center',
  },
  sparkleLeft: {
    position: 'absolute',
    top: -5,
    left: 0,
    fontSize: 16,
  },
  sparkleRight: {
    position: 'absolute',
    top: 5,
    right: 0,
    fontSize: 14,
  },
  labelContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
  },
  streakText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  warningText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nextStageText: {
    color: '#FFD93D',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  messageText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
