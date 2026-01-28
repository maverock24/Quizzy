import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { decode } from 'html-entities';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useQuiz } from './Quizprovider';
import { useReadAloud } from './useReadAloud';
import { SettingsHeader } from './SettingsHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Answer = {
  answer: string;
};

type QuestionProps = {
  question: string;
  answers: Answer[];
  currentQuestionIndex: number;
  selectedQuizAnswersAmount: number;
  handleAnswerSelection: (answer: string) => void;
  correctAnswer: string;
};

// Mini confetti particle for correct answer celebration
const MiniConfetti: React.FC<{
  delay: number;
  startX: number;
  startY: number;
  color: string;
}> = ({ delay, startX, startY, color }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 100;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80 - Math.random() * 40,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: randomX,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${360 + Math.random() * 360}deg`],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        width: 8,
        height: 8,
        backgroundColor: color,
        borderRadius: 2,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
      }}
    />
  );
};

// Floating score indicator (+1, +XP, etc.)
const FloatingScore: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateY, {
        toValue: -60,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - 25,
        top: y,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      <Text style={styles.floatingScoreText}>+1 ✨</Text>
    </Animated.View>
  );
};

// Your improved renderRichText helper
export function renderRichText(text: string): React.ReactNode[] {
  // Added return type
  const decoded = decode(text); // Ensure 'html-entities' is imported if not global

  const latexToUnicode: { [key: string]: string } = {
    '\\times': '×',
    '\\sqrt': '√', // For basic square root symbol, not the bar
    '\\leq': '≤',
    '\\geq': '≥',
    '\\neq': '≠',
    '\\pm': '±',
    '\\div': '÷',
    '\\cdot': '·',
    '\\infty': '∞',
    '\\rightarrow': '→',
    '\\leftarrow': '←',
    '\\degree': '°',
    '\\%': '%', // If you need to escape % for LaTeX
    // Common Greek letters (add as needed)
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\pi': 'π',
    '\\theta': 'θ',
  };

  // Regex to find $...$ math (non-greedy)
  const mathRegex = /\$(.+?)\$/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Ensure text is a string
  const inputText = String(decoded);

  while ((match = mathRegex.exec(inputText))) {
    // Text part before the math block
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`}>
          {inputText.substring(lastIndex, match.index)}
        </Text>,
      );
    }

    // Math part
    let mathContent = match[1];

    // Replace \text{...} with just the content inside
    mathContent = mathContent.replace(/\\text\s*{([^}]*)}/g, '$1');

    mathContent = mathContent.replace(
      /\\frac\s*{([^}]*)}\s*{([^}]*)}/g,
      '$1/$2',
    );

    // Replace LaTeX commands with Unicode
    for (const [latex, uni] of Object.entries(latexToUnicode)) {
      const escapedLatex = latex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      mathContent = mathContent.replace(new RegExp(escapedLatex, 'g'), uni);
    }

    parts.push(
      <Text
        key={`math-${match.index}`}
        style={styles.mathText}
      >
        {mathContent}
      </Text>,
    );
    lastIndex = mathRegex.lastIndex;
  }

  // Text part after the last math block (if any)
  if (lastIndex < inputText.length) {
    parts.push(
      <Text key={`text-${lastIndex}-end`}>
        {inputText.substring(lastIndex)}
      </Text>,
    );
  }

  // If no math blocks were found, return the original text in a Text component
  if (parts.length === 0 && inputText.length > 0) {
    return [<Text key="full-text">{inputText}</Text>];
  }

  return parts;
}

export const Question: React.FC<QuestionProps> = ({
  question,
  answers,
  currentQuestionIndex,
  selectedQuizAnswersAmount,
  handleAnswerSelection,
  correctAnswer,
}) => {
  const {
    resetState,
    flashcardsEnabled,
    setFlashcardsEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    showExplanation,
    setShowExplanation,
    audioEnabled,
    setAudioEnabled,
    setLanguage,
    userQuizLoadEnabled,
    setUserQuizLoadEnabled,
    textInputAnswerMode,
  } = useQuiz();
  const { t, i18n } = useTranslation();
  const { readAloud, stopTTS } = useReadAloud();
  const answerLabels = ['A:', 'B:', 'C:', 'D:'];

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const questionSlideAnim = useRef(new Animated.Value(-30)).current;
  const questionOpacity = useRef(new Animated.Value(0)).current;

  // Correct answer celebration animations
  const correctGlowAnim = useRef(new Animated.Value(0)).current;
  const correctPulseAnim = useRef(new Animated.Value(1)).current;
  const screenFlashAnim = useRef(new Animated.Value(0)).current;

  // Wrong answer shake animation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Correct answer highlight (for wrong answers)
  const correctHighlightAnim = useRef(new Animated.Value(0)).current;

  // Use useState for animation arrays that need to update with answers
  const [fadeOutAnim, setFadeOutAnim] = useState<Animated.Value[]>([]);
  const [buttonSlideAnims, setButtonSlideAnims] = useState<Animated.Value[]>([]);
  const [buttonOpacityAnims, setButtonOpacityAnims] = useState<Animated.Value[]>([]);
  const [buttonScaleAnims, setButtonScaleAnims] = useState<Animated.Value[]>([]);
  const [answerSelected, setAnswerSelected] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [answerIsCorrect, setAnswerIsCorrect] = useState(false);
  const [answerIsWrong, setAnswerIsWrong] = useState(false);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [textInputSubmitted, setTextInputSubmitted] = useState(false);

  // Confetti state for celebration
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 });

  // Floating score state
  const [showFloatingScore, setShowFloatingScore] = useState(false);
  const [floatingScorePosition, setFloatingScorePosition] = useState({ x: 0, y: 0 });

  // Find correct answer index
  useEffect(() => {
    const correctIdx = answers.findIndex(a => a.answer === correctAnswer);
    setCorrectAnswerIndex(correctIdx);
  }, [answers, correctAnswer]);

  // Initialize animation arrays when answers change
  useEffect(() => {
    // Create fresh animation values for new question
    setFadeOutAnim(answers.map(() => new Animated.Value(1)));
    setButtonSlideAnims(answers.map(() => new Animated.Value(50)));
    setButtonOpacityAnims(answers.map(() => new Animated.Value(0)));
    setButtonScaleAnims(answers.map(() => new Animated.Value(1)));

    // Reset state
    setSelectedAnswerIndex(null);
    setAnswerSelected(false);
    setAnswerIsCorrect(false);
    setAnswerIsWrong(false);
    setShowConfetti(false);
    setShowFloatingScore(false);
    setTextInputValue('');
    setTextInputSubmitted(false);
  }, [answers, currentQuestionIndex]);

  // Question entrance animation - run after animation arrays are created
  useEffect(() => {
    if (buttonSlideAnims.length === 0 || buttonOpacityAnims.length === 0) return;

    // Reset question animations
    questionSlideAnim.setValue(-30);
    questionOpacity.setValue(0);
    correctGlowAnim.setValue(0);
    correctPulseAnim.setValue(1);
    screenFlashAnim.setValue(0);
    shakeAnim.setValue(0);
    correctHighlightAnim.setValue(0);

    // Question slide in
    Animated.parallel([
      Animated.timing(questionSlideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(questionOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered button entrance
    const buttonAnimations = buttonSlideAnims.map((slideAnim, index) => {
      return Animated.sequence([
        Animated.delay(200 + index * 80), // Stagger delay
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacityAnims[index], {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    if (buttonAnimations.length > 0) {
      Animated.parallel(buttonAnimations).start();
    }
  }, [buttonSlideAnims, buttonOpacityAnims]);

  // Clean up sound when component unmounts


  // Function to play sound
  const playSound = async (isCorrect: boolean) => {
    if (!audioEnabled) return; // Check if audio is enabled

    try {
      // Unload any existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Create and load new sound based on answer correctness
      const soundFile = isCorrect
        ? require('../assets/sounds/correct_answer.mp3')
        : require('../assets/sounds/wrong_answer.mp3');

      // Create and load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(soundFile);
      soundRef.current = newSound;

      // Set up auto-unload
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          try {
            await newSound.unloadAsync();
            if (soundRef.current === newSound) {
              soundRef.current = null;
            }
          } catch (e) {
            // Ignore unload errors
          }
        }
      });

      // Play the sound
      await newSound.setVolumeAsync(isCorrect ? 0.4 : 0.4);
      await newSound.playAsync();
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  };

  const playSoundAnswerSelected = async () => {
    if (!audioEnabled) return; // Check if audio is enabled

    try {
      // Unload any existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const soundFile = require('../assets/sounds/answer_selected.mp3');
      // Create and load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(soundFile);
      soundRef.current = newSound;

      // Set up auto-unload
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          try {
            await newSound.unloadAsync();
            if (soundRef.current === newSound) {
              soundRef.current = null;
            }
          } catch (e) {
            // Ignore
          }
        }
      });

      // Play the sound
      await newSound.playAsync();
    } catch (error) {
      console.warn('Error playing select sound:', error);
    }
  };

  // Trigger haptic feedback (only on native platforms, not web)
  const triggerHaptic = (type: 'success' | 'error' | 'light') => {
    // Haptics are not supported on web
    if (Platform.OS === 'web') return;

    try {
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      // Haptics not available
    }
  };

  // Correct answer celebration animation
  const playCorrectAnimation = (buttonIndex: number) => {
    // Haptic feedback
    triggerHaptic('success');

    // Button pulse animation
    Animated.sequence([
      Animated.timing(correctPulseAnim, {
        toValue: 1.03,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(correctPulseAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow animation
    Animated.sequence([
      Animated.timing(correctGlowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(correctGlowAnim, {
        toValue: 0.6,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();

    // Screen flash
    Animated.sequence([
      Animated.timing(screenFlashAnim, {
        toValue: 0.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(screenFlashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Wrong answer shake animation
  const playWrongAnimation = () => {
    // Haptic feedback
    triggerHaptic('error');

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // Highlight correct answer with pulsing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(correctHighlightAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(correctHighlightAnim, {
          toValue: 0.5,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
      { iterations: 2 }
    ).start();
  };

  // Button press animation
  const handleButtonPressIn = (index: number) => {
    triggerHaptic('light');
    if (buttonScaleAnims[index]) {
      Animated.spring(buttonScaleAnims[index], {
        toValue: 0.98,
        friction: 5,
        tension: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleButtonPressOut = (index: number) => {
    if (buttonScaleAnims[index]) {
      Animated.spring(buttonScaleAnims[index], {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    return () => {
      fadeAnim.setValue(0);
    };
  }, [answerSelected]);

  const handleAnswer = (answer: string, index: number, event?: any) => {
    stopTTS(); // Stop TTS when moving to next question
    playSoundAnswerSelected();
    setSelectedAnswerIndex(index); // Highlight the selected button

    // Get position for confetti/floating score
    if (event) {
      const { pageX, pageY } = event.nativeEvent;
      setConfettiPosition({ x: pageX - 50, y: pageY });
      setFloatingScorePosition({ x: pageX, y: pageY - 20 });
    }

    // Fade out other buttons except the clicked one
    fadeOutAnim.forEach((anim, i) => {
      // Stop any running animations first
      anim.stopAnimation();

      if (i !== index) {
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    });

    setTimeout(() => {
      const isCorrect = answer === correctAnswer;
      isCorrect ? playSound(true) : playSound(false);

      if (isCorrect) {
        setAnswerIsCorrect(true);
        playCorrectAnimation(index);
        setShowConfetti(true);
        setShowFloatingScore(true);
      } else {
        setAnswerIsWrong(true);
        playWrongAnimation();
      }
    }, 300);

    setTimeout(() => {
      handleAnswerSelection(answer);
      setAnswerSelected(false); // Reset to false instead of toggling
      // Reset the selected answer index
      setSelectedAnswerIndex(null);
      // Reset the fade out animation
      fadeOutAnim.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
      setAnswerIsCorrect(false);
      setAnswerIsWrong(false);
      setShowConfetti(false);
      setShowFloatingScore(false);
    }, 1400); // Slightly longer for animations to complete
  };

  // TTS: Read aloud question and answers
  const handleReadAloud = () => {
    const questionText = typeof question === 'string' ? question : '';
    const answersText = answers
      .map((a, i) => `${answerLabels[i]} ${a.answer}`)
      .join('. ');
    const fullText = `${questionText}.${answersText}`;
    readAloud(fullText);
  };

  // Handle text input answer submission
  const handleTextInputSubmit = () => {
    if (textInputSubmitted || !textInputValue.trim()) return;

    stopTTS();
    playSoundAnswerSelected();
    setTextInputSubmitted(true);

    // Normalize both answers for comparison (case-insensitive, trim whitespace)
    const normalizedInput = textInputValue.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();
    const isCorrect = normalizedInput === normalizedCorrect;

    setTimeout(() => {
      playSound(isCorrect);
      if (isCorrect) {
        setAnswerIsCorrect(true);
        triggerHaptic('success');
      } else {
        setAnswerIsWrong(true);
        triggerHaptic('error');
      }
    }, 400);

    setTimeout(() => {
      handleAnswerSelection(isCorrect ? correctAnswer : textInputValue);
      setTextInputSubmitted(false);
      setTextInputValue('');
      setAnswerIsCorrect(false);
      setAnswerIsWrong(false);
    }, 1200);
  };

  // Confetti colors
  const confettiColors = ['#FFD700', '#4ECDC4', '#FF6B6B', '#95E1D3', '#AA96DA', '#45B7D1'];

  // Interpolate glow color for correct answer
  const correctGlowColor = correctGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 216, 0, 0)', 'rgba(0, 216, 0, 0.4)'],
  });

  // Interpolate highlight for showing correct answer on wrong
  const correctHighlightColor = correctHighlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 216, 0, 0)', 'rgba(0, 216, 0, 0.5)'],
  });

  return (
    <ScrollView
      style={styles.contentContainer}
      contentContainerStyle={{ overflow: 'visible' }}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      {/* Screen flash overlay for correct answer */}
      <Animated.View
        style={[
          styles.screenFlash,
          { opacity: screenFlashAnim },
        ]}
        pointerEvents="none"
      />

      <View
        style={{
          flexDirection: 'column',
          marginBottom: 20,
          justifyContent: 'space-between',
          overflow: 'visible',
        }}
      >
        {/* Animated Question Card */}
        <Animated.View
          style={[
            styles.card,
            styles.questionCard,
            {
              opacity: questionOpacity,
              transform: [{ translateY: questionSlideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <SettingsHeader
              currentQuestionIndex={currentQuestionIndex}
              selectedQuizAnswersAmount={selectedQuizAnswersAmount}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={styles.questionText}>{renderRichText(question)}</Text>
            <TouchableOpacity
              onPress={handleReadAloud}
              style={{
                marginLeft: 8,
                marginBottom: 8,
                alignSelf: 'flex-start',
                backgroundColor: 'transparent',
                borderRadius: 8,
                padding: 8,
              }}
              accessibilityLabel="Read question and answers aloud"
            >
              <FontAwesome
                name="comment"
                size={30}
                color="white"
                style={{ marginLeft: 8, marginTop: -5 }}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Conditionally render text input mode or multiple choice */}
        {textInputAnswerMode ? (
          <View style={styles.textInputContainer}>
            <TextInput
              style={[
                styles.textInput,
                textInputSubmitted && answerIsCorrect && styles.textInputCorrect,
                textInputSubmitted && answerIsWrong && styles.textInputWrong,
              ]}
              value={textInputValue}
              onChangeText={setTextInputValue}
              placeholder={t('type_your_answer')}
              placeholderTextColor="rgba(255,255,255,0.5)"
              editable={!textInputSubmitted}
              onSubmitEditing={handleTextInputSubmit}
              returnKeyType="done"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                textInputSubmitted && styles.submitButtonDisabled,
              ]}
              onPress={handleTextInputSubmit}
              disabled={textInputSubmitted}
            >
              <Text style={styles.submitButtonText}>{t('submit_answer')}</Text>
              {textInputSubmitted && answerIsCorrect && (
                <FontAwesome
                  name="check"
                  size={20}
                  color="white"
                  style={styles.submitIcon}
                />
              )}
              {textInputSubmitted && answerIsWrong && (
                <FontAwesome
                  name="times"
                  size={20}
                  color="white"
                  style={styles.submitIcon}
                />
              )}
            </TouchableOpacity>
            {/* Show correct answer if wrong */}
            {textInputSubmitted && answerIsWrong && (
              <View style={styles.correctAnswerHint}>
                <Text style={styles.correctAnswerHintText}>
                  {t('correct_answer_is')}: {correctAnswer}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{
            overflow: 'visible',
            marginTop: 10,
          }}>
            {answers.map((answer, index) => {
              const isSelected = selectedAnswerIndex === index;
              const isCorrectAnswer = index === correctAnswerIndex;
              const showCorrectHighlight = answerIsWrong && isCorrectAnswer;
              const showWrongShake = answerIsWrong && isSelected;

              return (
                <Animated.View
                  key={index}
                  style={{
                    opacity: fadeOutAnim[index] || 1,
                    overflow: 'visible',
                    zIndex: isSelected ? 100 : 10,
                    position: 'relative',
                    transform: [
                      { translateX: buttonSlideAnims[index] || 0 },
                      { scale: buttonScaleAnims[index] || 1 },
                      // Apply shake only to the wrong selected button
                      { translateX: showWrongShake ? shakeAnim : 0 },
                      // Apply pulse only to correct answer
                      { scale: isSelected && answerIsCorrect ? correctPulseAnim : 1 },
                    ],
                  }}
                >
                  <Animated.View
                    style={{
                      opacity: buttonOpacityAnims[index] || 1,
                      overflow: 'visible',
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.answerButton,
                        isSelected && styles.selectedAnswerButton,
                        isSelected && answerIsCorrect && styles.correctAnswerButton,
                        showWrongShake && styles.wrongAnswerButton,
                        showCorrectHighlight && styles.highlightCorrectButton,
                      ]}
                      onPress={(e) => handleAnswer(answer.answer, index, e)}
                      onPressIn={() => handleButtonPressIn(index)}
                      onPressOut={() => handleButtonPressOut(index)}
                      activeOpacity={0.9}
                      disabled={answerSelected}
                    >
                      {/* Glow overlay for correct answer */}
                      {isSelected && answerIsCorrect && (
                        <Animated.View
                          style={[
                            styles.glowOverlay,
                            { backgroundColor: correctGlowColor },
                          ]}
                        />
                      )}

                      {/* Highlight overlay for showing correct answer on wrong */}
                      {showCorrectHighlight && (
                        <Animated.View
                          style={[
                            styles.glowOverlay,
                            { backgroundColor: correctHighlightColor },
                          ]}
                        />
                      )}

                      <View style={styles.labelContainer}>
                        <Text style={styles.labelText}>{answerLabels[index]}</Text>
                      </View>
                      <Text style={styles.answerButtonText} numberOfLines={4}>
                        {renderRichText(answer.answer)}
                      </Text>

                      {/* Correct icon with animation */}
                      {answerIsCorrect && isSelected && (
                        <Animated.View
                          style={[
                            styles.iconContainer,
                            styles.correctIconContainer,
                            { transform: [{ scale: correctPulseAnim }] },
                          ]}
                        >
                          <FontAwesome
                            name="check"
                            size={18}
                            color="white"
                          />
                        </Animated.View>
                      )}

                      {/* Wrong icon */}
                      {answerIsWrong && isSelected && (
                        <View style={[styles.iconContainer, styles.wrongIconContainer]}>
                          <FontAwesome
                            name="times"
                            size={18}
                            color="white"
                          />
                        </View>
                      )}


                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              );
            })}

            {/* Confetti particles for correct answer */}
            {showConfetti && (
              <View style={styles.confettiContainer} pointerEvents="none">
                {confettiColors.map((color, i) => (
                  <React.Fragment key={i}>
                    <MiniConfetti
                      delay={i * 30}
                      startX={confettiPosition.x + Math.random() * 100}
                      startY={confettiPosition.y}
                      color={color}
                    />
                    <MiniConfetti
                      delay={i * 30 + 15}
                      startX={confettiPosition.x + Math.random() * 100}
                      startY={confettiPosition.y}
                      color={confettiColors[(i + 2) % confettiColors.length]}
                    />
                  </React.Fragment>
                ))}
              </View>
            )}

            {/* Floating score indicator */}
            {showFloatingScore && (
              <FloatingScore x={floatingScorePosition.x} y={floatingScorePosition.y} />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00FF00',
    zIndex: 100,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  floatingScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  iconContainer: {
    position: 'absolute',
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  correctIconContainer: {
    backgroundColor: '#00D800',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  wrongIconContainer: {
    backgroundColor: '#FF3B30',
  },

  correctAnswerButton: {
    backgroundColor: 'rgba(0, 180, 0, 0.3)',
    borderColor: '#00D800',
    borderWidth: 2,
  },
  wrongAnswerButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  highlightCorrectButton: {
    borderColor: '#00D800',
    borderWidth: 2,
  },
  settingItem: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 5,
  },
  settingName: {
    flexDirection: 'column',
    flex: 1,
    paddingVertical: 10,
    marginRight: 10,
  },
  settingText: {
    marginRight: 10,
    fontSize: 12,
    color: 'white',
  },
  settingDescription: {
    width: '100%',
    marginTop: 5,
    fontSize: 12,
    color: 'white',
  },
  mathText: {
    // Style for parts rendered as math
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Common monospace fonts
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1, // Small vertical padding
    fontSize: 16, // Slightly smaller or same as questionText
    fontWeight: '600',
  },
  wrong: {
    zIndex: 999,
    position: 'absolute',
    right: 8,
    paddingLeft: 5,
    paddingTop: 3,
    backgroundColor: 'rgb(255, 0, 0)',
    height: 30,
    width: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgb(255, 255, 255)',
  },
  correct: {
    zIndex: 999,
    position: 'absolute',
    paddingLeft: 3,
    paddingTop: 3,
    right: 8,
    backgroundColor: 'rgb(0, 216, 0)',
    height: 30,
    width: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgb(255, 255, 255)',
  },
  contentContainer: {
    overflow: 'visible',
  },
  card: {
    padding: 0,
    borderRadius: 8,
    marginBottom: 16,
  },
  questionCard: {
    borderRadius: 10,
    marginHorizontal: 8,
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  questionHeading: {
    alignContent: 'flex-end',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgb(212, 212, 212)',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgb(237, 237, 237)',
  },
  answerButton: {
    backgroundColor: 'rgb(37, 106, 158)',
    padding: 15,
    borderRadius: 8,
    borderColor: 'rgb(63, 65, 66)',
    borderWidth: 1,
    marginVertical: 10,
    marginHorizontal: 8,
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'visible',
  },
  labelContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  labelText: {
    color: 'white',
    fontSize: 14,
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  selectedAnswerButton: {
    borderColor: 'white',
    borderWidth: 2,
  },
  // Text input mode styles
  textInputContainer: {
    marginTop: 10,
  },
  textInput: {
    backgroundColor: 'rgb(45, 55, 72)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgb(63, 75, 90)',
    padding: 16,
    fontSize: 18,
    color: 'white',
    marginBottom: 12,
  },
  textInputCorrect: {
    borderColor: 'rgb(0, 216, 0)',
    backgroundColor: 'rgba(0, 216, 0, 0.15)',
  },
  textInputWrong: {
    borderColor: 'rgb(255, 0, 0)',
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
  },
  submitButton: {
    backgroundColor: 'rgb(37, 106, 158)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitIcon: {
    marginLeft: 10,
  },
  correctAnswerHint: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 216, 0, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgb(0, 216, 0)',
  },
  correctAnswerHintText: {
    color: 'rgb(180, 255, 180)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
