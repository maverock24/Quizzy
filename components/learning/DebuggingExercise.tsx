import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Quiz, QuizQuestion, Answer } from '../types';

interface DebuggingExerciseType {
  id: string;
  title: string;
  description: string;
  conceptLines: string[];
  wrongAnswer: string;
  buggyLineIndex: number;
  answer: string;
  explanation: string;
}

interface DebuggingExerciseProps {
  onBack: () => void;
  category?: string;
  quizzes?: Quiz[];
}

export const DebuggingExercise: React.FC<DebuggingExerciseProps> = ({
  onBack,
  quizzes = [],
}) => {
  const { t } = useTranslation();

  // State and ref hooks must come first
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Helper function before useMemo
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Convert quiz questions to debugging exercises
  const exercises = useMemo(() => {
    const debugExercises: DebuggingExerciseType[] = [];

    quizzes.forEach((quiz: Quiz) => {
      if (quiz.questions) {
        quiz.questions.forEach((q: QuizQuestion, idx: number) => {
          if (q.answers && q.answers.length >= 2 && q.explanation) {
            // Create a "buggy" scenario using wrong answers
            const wrongAnswers = q.answers.filter(
              (a: Answer) => a.answer !== q.answer,
            );
            if (wrongAnswers.length >= 1) {
              const explanationLines = q.explanation
                .split('. ')
                .filter((s: string) => s.length > 5);
              if (explanationLines.length >= 2) {
                // Keep the raw pieces here: the comment prefixes are translated
                // at render time, because a `t()` in this memo would not re-run
                // when the language changes.
                const buggyLineIndex = Math.min(1, explanationLines.length - 1);

                debugExercises.push({
                  id: `${quiz.name}-${idx}`,
                  title: quiz.name,
                  description: q.question,
                  conceptLines: explanationLines,
                  wrongAnswer: wrongAnswers[0].answer,
                  buggyLineIndex: buggyLineIndex,
                  answer: q.answer,
                  explanation: q.explanation,
                });
              }
            }
          }
        });
      }
    });

    return shuffleArray(debugExercises).slice(0, 6);
  }, [quizzes]);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const handleLineSelect = (lineIndex: number) => {
    if (showResult) return;

    setSelectedLine(lineIndex);
    setShowResult(true);

    if (lineIndex === exercises[currentIndex].buggyLineIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedLine(null);
      setShowResult(false);
      setShowFix(false);
    } else {
      setCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedLine(null);
    setShowResult(false);
    setShowFix(false);
    setCorrectCount(0);
    setCompleted(false);
  };

  if (completed) {
    const percentage = Math.round((correctCount / exercises.length) * 100);
    return (
      <View style={styles.container}>
        <View style={styles.completedState}>
          <Ionicons
            name={percentage >= 70 ? 'bug' : 'search'}
            size={80}
            color={percentage >= 70 ? '#4CAF50' : '#f44336'}
          />
          <Text style={styles.completedTitle}>{t('debug_complete')}</Text>
          <Text style={styles.scoreText}>
            {t('debug_score_line', {
              correct: correctCount,
              total: exercises.length,
              percent: percentage,
            })}
          </Text>
          <Text style={styles.encouragementText}>
            {percentage >= 90
              ? `${t('debug_praise_90')} 🐛🔍`
              : percentage >= 70
              ? `${t('debug_praise_70')} 🎯`
              : percentage >= 50
              ? `${t('debug_praise_50')} 💪`
              : `${t('debug_praise_else')} 🔧`}
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={20} color="white" />
              <Text style={styles.buttonText}>{t('learning_back')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={resetQuiz}>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>{t('learning_try_again')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const currentExercise = exercises[currentIndex];
  const codeLines = currentExercise.conceptLines.map((line, i) =>
    i === 0 ? t('debug_concept_comment', { concept: line }) : `// ${line}`,
  );
  codeLines.splice(
    currentExercise.buggyLineIndex,
    0,
    t('debug_wrong_comment', { answer: currentExercise.wrongAnswer }),
  );
  const explanationText = t('debug_result_body', {
    answer: currentExercise.answer,
    explanation: currentExercise.explanation,
  });
  const fixedCodeText = t('debug_fixed_body', {
    answer: currentExercise.answer,
    explanation: currentExercise.explanation,
  });
  const isCorrect = selectedLine === currentExercise.buggyLineIndex;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {`🐛 `}
          {t('learn_mode_bughunter_title')}
        </Text>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {exercises.length}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIndex + 1) / exercises.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.problemCard, { opacity: fadeAnim }]}>
          <Text style={styles.problemTitle}>{currentExercise.title}</Text>
          <Text style={styles.problemDescription}>
            {currentExercise.description}
          </Text>
        </Animated.View>

        <Text style={styles.instruction}>
          {`👆 `}
          {t('debug_instruction')}
        </Text>

        <View style={styles.codeCard}>
          <View style={styles.codeHeader}>
            <View style={styles.codeHeaderDot} />
            <View
              style={[styles.codeHeaderDot, { backgroundColor: '#FFBD2E' }]}
            />
            <View
              style={[styles.codeHeaderDot, { backgroundColor: '#27C93F' }]}
            />
            <Text style={styles.codeHeaderTitle}>buggy_code.js</Text>
          </View>
          <ScrollView
            style={styles.codeContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View>
              {codeLines.map((line, idx) => {
                const isBuggyLine = idx === currentExercise.buggyLineIndex;
                const isSelected = idx === selectedLine;

                let lineStyle = styles.codeLine;
                if (showResult) {
                  if (isBuggyLine) {
                    lineStyle = { ...styles.codeLine, ...styles.correctLine };
                  } else if (isSelected) {
                    lineStyle = { ...styles.codeLine, ...styles.wrongLine };
                  }
                } else if (isSelected) {
                  lineStyle = { ...styles.codeLine, ...styles.selectedLine };
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    style={lineStyle}
                    onPress={() => handleLineSelect(idx)}
                    disabled={showResult}
                  >
                    <Text style={styles.lineNumber}>{idx + 1}</Text>
                    <Text style={styles.codeText}>{line || ' '}</Text>
                    {showResult && isBuggyLine && (
                      <Ionicons
                        name="bug"
                        size={16}
                        color="#f44336"
                        style={styles.bugIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {showResult && (
          <View
            style={[
              styles.resultCard,
              isCorrect ? styles.correctResult : styles.wrongResult,
            ]}
          >
            <Text style={styles.resultTitle}>
              {isCorrect
                ? `🎯 ${t('debug_bug_found')}`
                : `❌ ${t('debug_wrong_line')}`}
            </Text>
            <Text style={styles.explanationText}>{explanationText}</Text>

            <TouchableOpacity
              style={styles.showFixButton}
              onPress={() => setShowFix(!showFix)}
            >
              <Ionicons
                name={showFix ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="white"
              />
              <Text style={styles.showFixButtonText}>
                {showFix ? t('debug_hide_fix') : t('debug_show_fix')}
              </Text>
            </TouchableOpacity>

            {showFix && (
              <View style={styles.fixedCodeCard}>
                <Text style={styles.fixedCodeTitle}>
                  {`✅ `}
                  {t('debug_fixed_code_title')}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.fixedCodeText}>{fixedCodeText}</Text>
                </ScrollView>
              </View>
            )}

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentIndex < exercises.length - 1
                  ? t('debug_next')
                  : t('learning_see_results')}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBack: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  progressText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f44336',
    borderRadius: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  problemCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  problemTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  problemDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  instruction: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 12,
  },
  codeCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#323232',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  codeHeaderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5F56',
  },
  codeHeaderTitle: {
    marginLeft: 10,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  codeContent: {
    padding: 8,
  },
  codeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  selectedLine: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  correctLine: {
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  wrongLine: {
    backgroundColor: 'rgba(244, 67, 54, 0.25)',
    borderLeftWidth: 3,
    borderLeftColor: '#f44336',
  },
  lineNumber: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    width: 24,
    textAlign: 'right',
    marginRight: 12,
    fontFamily: 'monospace',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#E0E0E0',
    flex: 1,
  },
  bugIcon: {
    marginLeft: 8,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  correctResult: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  wrongResult: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderColor: 'rgba(244, 67, 54, 0.4)',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: 16,
  },
  showFixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  showFixButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fixedCodeCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  fixedCodeTitle: {
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  fixedCodeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#E0E0E0',
    lineHeight: 18,
  },
  nextButton: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  completedState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completedTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: 'white',
    marginTop: 16,
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DebuggingExercise;
