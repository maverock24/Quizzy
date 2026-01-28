import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Happy from '../assets/images/happy.svg';
import Sad from '../assets/images/sad.svg';
import { useQuiz } from './Quizprovider';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Confetti particle component
const ConfettiPiece: React.FC<{
  delay: number;
  startX: number;
  color: string;
  size: number;
  rotation: number;
}> = ({ delay, startX, color, size, rotation }) => {
  const fallAnim = useRef(new Animated.Value(-50)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 3000 + Math.random() * 2000;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        // Fade in quickly
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Fall down
        Animated.timing(fallAnim, {
          toValue: SCREEN_HEIGHT + 100,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Sway left and right
        Animated.loop(
          Animated.sequence([
            Animated.timing(swayAnim, {
              toValue: 30,
              duration: 500 + Math.random() * 500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(swayAnim, {
              toValue: -30,
              duration: 500 + Math.random() * 500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ),
        // Rotate
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000 + Math.random() * 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ),
      ]),
    ]).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rotation}deg`, `${rotation + 360}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
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
        },
      ]}
    />
  );
};

// Star burst component for extra celebration
const StarBurst: React.FC<{ delay: number }> = ({ delay }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.starBurst,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={styles.starEmoji}>⭐</Text>
    </Animated.View>
  );
};

type ScoreProps = {
  score: number;
  selectedQuizAnswersAmount: number;
  timeExpired?: boolean;
  wrongAnswerCount?: number;
  onRetryWrongAnswers?: () => void;
};

export const Score: React.FC<ScoreProps> = ({
  score,
  selectedQuizAnswersAmount,
  timeExpired = false,
  wrongAnswerCount = 0,
  onRetryWrongAnswers,
}) => {
  const { t } = useTranslation();
  const { flashcardsEnabled } = useQuiz();

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scoreCountAnim = useRef(new Animated.Value(0)).current;
  const headingOpacity = useRef(new Animated.Value(0)).current;
  const headingScale = useRef(new Animated.Value(0.5)).current;
  const emojiRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [displayScore, setDisplayScore] = useState(0);
  const isWinner = score === selectedQuizAnswersAmount;
  const isPerfect = isWinner;

  // Generate confetti pieces
  const confettiColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#FFE66D',
    '#95E1D3',
    '#F38181',
    '#AA96DA',
    '#FCBAD3',
    '#A8D8EA',
  ];
  const confettiPieces = isWinner
    ? Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 1000,
      startX: Math.random() * SCREEN_WIDTH,
      color:
        confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360,
    }))
    : [];

  useEffect(() => {
    // Entrance animation sequence
    Animated.sequence([
      // First: heading appears with bounce
      Animated.parallel([
        Animated.spring(headingOpacity, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(headingScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Then: emoji/image appears with bounce
      Animated.delay(200),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      // Then: score counter
      Animated.timing(scoreCountAnim, {
        toValue: score,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    // Score counter animation
    scoreCountAnim.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });

    // Continuous pulse animation for winner
    if (isWinner) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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
        ]),
      ).start();

      // Emoji celebration rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(emojiRotate, {
            toValue: 0.05,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(emojiRotate, {
            toValue: -0.05,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(emojiRotate, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }

    return () => {
      scoreCountAnim.removeAllListeners();
    };
  }, [score, isWinner]);

  const spin = emojiRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const celebrationEmojis = ['🎉', '🏆', '⭐', '🌟', '✨', '🎊'];

  return (
    <View style={styles.scoreContainer}>
      {/* Confetti layer */}
      {isWinner &&
        confettiPieces.map((piece) => (
          <ConfettiPiece
            key={piece.id}
            delay={piece.delay}
            startX={piece.startX}
            color={piece.color}
            size={piece.size}
            rotation={piece.rotation}
          />
        ))}

      {/* Star bursts for perfect score */}
      {isPerfect && (
        <>
          <StarBurst delay={300} />
          <StarBurst delay={600} />
          <StarBurst delay={900} />
        </>
      )}

      {!flashcardsEnabled && (
        <>
          {/* Animated heading */}
          <Animated.View
            style={{
              opacity: headingOpacity,
              transform: [
                { scale: headingScale },
                { rotate: isWinner ? spin : '0deg' },
              ],
            }}
          >
            <Text style={[styles.heading, isWinner && styles.winnerHeading]}>
              {timeExpired ? `⏰ ${t('time_up')} ⏰` : isWinner ? '🎉 Well Done! 🎉' : '💪 Try again!'}
            </Text>
            {isWinner && (
              <Text style={styles.subHeading}>
                {isPerfect ? '✨ Perfect Score! ✨' : 'Great job!'}
              </Text>
            )}
          </Animated.View>

          {/* Animated emoji/image */}
          <Animated.View
            style={{
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
                { rotate: spin },
              ],
            }}
          >
            {!isWinner && <Sad width={150} height={150} />}
            {isWinner && <Happy width={180} height={180} />}
          </Animated.View>

          {/* Celebration emojis floating around for winners */}
          {isWinner && (
            <View style={styles.celebrationRow}>
              {celebrationEmojis.map((emoji, index) => (
                <FloatingEmoji key={index} emoji={emoji} delay={index * 100} />
              ))}
            </View>
          )}

          {/* Animated score counter */}
          <Animated.View
            style={{
              opacity: headingOpacity,
              transform: [{ scale: headingScale }],
            }}
          >
            <View style={[styles.scoreBox, isWinner && styles.winnerScoreBox]}>
              <Text style={styles.scoreLabel}>{t('score')}</Text>
              <Text
                style={[styles.scoreText, isWinner && styles.winnerScoreText]}
              >
                {displayScore} / {selectedQuizAnswersAmount}
              </Text>
              {isWinner && (
                <Text style={styles.percentText}>
                  🏆 {Math.round((score / selectedQuizAnswersAmount) * 100)}%
                </Text>
              )}
            </View>

            {/* Retry Wrong Answers Button */}
            {wrongAnswerCount > 0 && onRetryWrongAnswers && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={onRetryWrongAnswers}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>
                  🔄 {t('retry_wrong', 'Retry Wrong Answers')} ({wrongAnswerCount})
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </>
      )}

      {flashcardsEnabled && (
        <>
          <Animated.View
            style={{
              opacity: headingOpacity,
              transform: [{ scale: headingScale }],
            }}
          >
            <Text style={[styles.heading, styles.winnerHeading]}>
              🎉 Well Done! 🎉
            </Text>
          </Animated.View>
          <Animated.View
            style={{
              transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
            }}
          >
            <Happy width={180} height={180} />
          </Animated.View>
          <View style={styles.celebrationRow}>
            {celebrationEmojis.slice(0, 3).map((emoji, index) => (
              <FloatingEmoji key={index} emoji={emoji} delay={index * 100} />
            ))}
          </View>
        </>
      )}
    </View>
  );
};

// Floating emoji component
const FloatingEmoji: React.FC<{ emoji: string; delay: number }> = ({
  emoji,
  delay,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay + 500),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -10,
              duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        marginHorizontal: 8,
      }}
    >
      <Text style={styles.floatingEmoji}>{emoji}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
    textAlign: 'center',
  },
  winnerHeading: {
    fontSize: 36,
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subHeading: {
    fontSize: 20,
    color: '#4ECDC4',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  scoreContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  scoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'stretch',
    marginHorizontal: 8,
  },
  winnerScoreBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  scoreLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 5,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  winnerScoreText: {
    color: '#FFD700',
  },
  percentText: {
    fontSize: 18,
    color: '#4ECDC4',
    marginTop: 8,
    fontWeight: '600',
  },
  celebrationRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  floatingEmoji: {
    fontSize: 30,
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  starBurst: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starEmoji: {
    fontSize: 100,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
