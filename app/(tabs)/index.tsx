import { Explanation } from '@/components/Explanation';
import FlashcardCarousel from '@/components/Flashcards';
import { Question } from '@/components/Question';
import { Reader } from '@/components/Reader';
import { EssayReader } from '@/components/EssayReader';
import { useQuiz } from '@/components/Quizprovider';
import { QuizSelection } from '@/components/QuizSelection';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';
import { Score } from '@/components/Score';
import { QuizTimer } from '@/components/QuizTimer';
import { useGlossary } from '@/components/GlossaryProvider';
import { Answer, CategoryEssay, Quiz, QuizQuestion } from '@/components/types';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useReadAloud } from '@/components/useReadAloud';
import { StreakPet } from '@/components/kids/StreakPet';
import { MultiplicationRangeSheet } from '@/components/kids/MultiplicationRangeSheet';
import {
  useGamification,
  StreakDisplay,
  XPProgress,
} from '@/components/gamification';
import { useLearningTodos } from '@/components/LearningTodosProvider';
import {
  generateMultiplicationQuestions,
  MULTIPLICATION_GENERATOR,
  MultiplicationRange,
} from '@/services/multiplicationProblems';
import {
  answeredCount,
  DEFAULT_ROUND_MINUTES,
  remainingSeconds,
  roundDeadline as computeDeadline,
} from '@/services/timedRound';
import type { RoundMode } from '@/services/timedRound';

// Type for tracking wrong answers during a quiz session
interface WrongAnswerRecord {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  explanation?: string;
}

// Function to shuffle array (Fi
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function TabOneScreen() {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz>();
  //shuffle questions in selected quiz

  const [selectedQuizAnswersAmount, setSelectedQuizAnswersAmount] =
    useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [scoreVisible, setScoreVisible] = useState<boolean>(false);

  const { stopTTS } = useReadAloud();
  const {
    setModalVisible: setGlossaryVisible,
    setSelectedTerm,
    setSearchQuery,
  } = useGlossary();

  // Get quizzes from context
  const {
    setSelectedQuizName,
    showExplanation,
    flashcardsEnabled,
    readerModeEnabled,
    quizzes,
    totalCorrectAnswers,
    setTotalCorrectAnswers,
    totalWrongAnswers,
    setTotalWrongAnswers,
    totalWonGames,
    setTotalWonGames,
    totalLostGames,
    setTotalLostGames,
    timerEnabled,
    timerDuration,
    kidsMode,
    essays,
    getEssayByCategory,
  } = useQuiz();
  const { t } = useTranslation();
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [roundMode, setRoundMode] = useState<RoundMode>('count');
  const [roundMinutes, setRoundMinutes] = useState<number>(
    DEFAULT_ROUND_MINUTES,
  );
  const [roundDeadline, setRoundDeadline] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState<boolean>(false);
  const [answerIsCorrect, setAnswerIsCorrect] = useState<boolean>(false);
  const [randomizedAnswers, setRandomizedAnswers] = useState<Answer[]>([]);
  const [randomizedQuestions, setRandomizedQuestions] = useState<
    QuizQuestion[]
  >([]);
  const [explanationMode, setExplanationMode] = useState<boolean>(false);
  const [showReader, setShowReader] = useState<boolean>(false);

  // Gamification integration
  const { onQuizComplete, onCorrectAnswer } = useGamification();
  const { addWrongAnswer, recordCorrectAnswer, getTodoByQuestion } =
    useLearningTodos();
  const quizStartTime = useRef<number>(Date.now());
  // One-shot latch: the deadline interval ticks every second, so two ticks can
  // both observe zero before the state commit tears the interval down. The
  // round must be reported exactly once.
  const timedRoundEnded = useRef<boolean>(false);

  // Track wrong answers during this quiz session
  const [wrongAnswersThisQuiz, setWrongAnswersThisQuiz] = useState<
    WrongAnswerRecord[]
  >([]);
  const [, setIsRetryMode] = useState<boolean>(false);
  // Track the last quiz name for retry functionality (persists after quiz ends)
  const [lastPlayedQuizName, setLastPlayedQuizName] = useState<string | null>(
    null,
  );
  // Factors used to regenerate the multiplication quiz, and the list entry
  // whose play is waiting on the range sheet.
  const [multiplicationRange, setMultiplicationRange] =
    useState<MultiplicationRange>({ from: 1, to: 10 });
  const [rangeSheetQuiz, setRangeSheetQuiz] = useState<Quiz | null>(null);

  // Essay state
  const [selectedEssay, setSelectedEssay] = useState<CategoryEssay | null>(
    null,
  );

  // Derive which categories have essays (for showing the Read button)
  const categoriesWithEssays = useMemo(
    () => new Set(essays.map((e) => e.category)),
    [essays],
  );

  useEffect(() => {
    if (selectedQuiz) {
      // If noShuffle is true (e.g., for experiment tutorials), keep original order
      if (selectedQuiz.noShuffle) {
        setRandomizedQuestions(selectedQuiz.questions);
        setRandomizedAnswers(
          selectedQuiz.questions[currentQuestionIndex].answers,
        );
      } else {
        setRandomizedQuestions(shuffleArray(selectedQuiz.questions));
        setRandomizedAnswers(
          shuffleArray(selectedQuiz.questions[currentQuestionIndex].answers),
        );
      }
    }
  }, [selectedQuiz]);

  useEffect(() => {
    if (selectedQuiz && randomizedQuestions[currentQuestionIndex]) {
      // If noShuffle is true (e.g., for experiment tutorials), keep answer order too
      if (selectedQuiz.noShuffle) {
        setRandomizedAnswers(randomizedQuestions[currentQuestionIndex].answers);
      } else {
        setRandomizedAnswers(
          shuffleArray(randomizedQuestions[currentQuestionIndex].answers),
        );
      }
    }
  }, [currentQuestionIndex, randomizedQuestions]);

  const startQuiz = (
    quiz: Quiz,
    range: MultiplicationRange = multiplicationRange,
    round: { mode: RoundMode; minutes: number } = {
      mode: 'count',
      minutes: DEFAULT_ROUND_MINUTES,
    },
  ) => {
    const match = quizzes.find((q: Quiz) => q.name === quiz.name);
    // Generated quizzes (e.g. multiplication tables) get a fresh set of
    // problems on every play instead of reusing the list's placeholder set.
    const selectedQuiz =
      match && match.generator === MULTIPLICATION_GENERATOR
        ? {
            ...match,
            questions: generateMultiplicationQuestions({
              minFactor: range.from,
              maxFactor: range.to,
            }),
          }
        : match;

    setSelectedQuiz(selectedQuiz);
    setSelectedQuizAnswersAmount(selectedQuiz?.questions.length ?? 0);
    setCurrentQuestionIndex(0);
    setScore(0);
    setScoreVisible(false);
    setSelectedQuizName(quiz.name);
    setLastPlayedQuizName(quiz.name);
    setExplanationMode(false);
    setTimeExpired(false);
    setRoundMode(round.mode);
    setRoundMinutes(round.minutes);
    timedRoundEnded.current = false;
    setRoundDeadline(
      round.mode === 'timed'
        ? computeDeadline(round.minutes, Date.now())
        : null,
    );

    // The count-mode timer only runs in count mode; a timed round owns its own
    // deadline and must not start the global countdown.
    setTimerActive(round.mode === 'count' && timerEnabled);

    // If reader mode is enabled, show the reader instead of the quiz
    if (readerModeEnabled) {
      setShowReader(true);
    } else {
      setShowReader(false);
    }
  };

  const handleQuizSelection = (quiz: Quiz) => {
    const match = quizzes.find((q: Quiz) => q.name === quiz.name);
    // Multiplication tables ask for a factor range before generating problems.
    if (match?.generator === MULTIPLICATION_GENERATOR) {
      setRangeSheetQuiz(match);
      return;
    }
    startQuiz(quiz);
  };

  const handleAnswerSelection = (answer: string) => {
    if (selectedQuiz) {
      setExplanationMode(true);
      const question = randomizedQuestions[currentQuestionIndex];
      if (question.answer === answer) {
        setAnswerIsCorrect(true);
        setTotalCorrectAnswers(totalCorrectAnswers + 1);
        setScore(score + 1);
        // Award XP for correct answer
        onCorrectAnswer();

        // Check if this was a learning todo question and record correct answer
        const todoItem = getTodoByQuestion(question.question);
        if (todoItem) {
          recordCorrectAnswer(todoItem.id);
        }
      } else {
        setTotalWrongAnswers(totalWrongAnswers + 1);
        setAnswerIsCorrect(false);

        // Track wrong answer for this session
        setWrongAnswersThisQuiz((prev) => [
          ...prev,
          {
            question: question.question,
            correctAnswer: question.answer,
            userAnswer: answer,
            explanation: question.explanation,
          },
        ]);

        // Add to learning todos (persistent)
        addWrongAnswer(
          question.question,
          question.answer,
          answer,
          selectedQuiz.name,
          question.explanation,
        );
      }
      if (!showExplanation) {
        handleNext();
      }
    }
  };

  const handleBack = () => {
    stopTTS();

    setSelectedQuiz(undefined);
    setSelectedQuizName(null);
    setCurrentQuestionIndex(0);
    setScoreVisible(false);
    setAnswerIsCorrect(false);
    setShowReader(false);
    setTimerActive(false);
    setRoundMode('count');
    setRoundDeadline(null);
    setTimeExpired(false);
    setWrongAnswersThisQuiz([]);
    setIsRetryMode(false);
    setSelectedEssay(null);
  };

  // Handle time up - end the quiz
  const handleTimeUp = useCallback(() => {
    setTimerActive(false);
    setTimeExpired(true);
    setTotalLostGames(totalLostGames + 1);

    setScoreVisible(true);
    setSelectedQuiz(undefined);
    setSelectedQuizName(null);
    setCurrentQuestionIndex(0);
    setExplanationMode(false);
  }, [
    totalLostGames,
    setTotalLostGames,
    setSelectedQuizName,
    score,
    selectedQuizAnswersAmount,
  ]);

  // End a timed round: a finished round, not a loss (D1). Reachable only from
  // the deadline interval below and the deadline QuizTimer.
  const handleTimedRoundEnd = useCallback(() => {
    if (timedRoundEnded.current) return;
    timedRoundEnded.current = true;
    setRoundDeadline(null);
    setTotalWonGames(totalWonGames + 1);
    onQuizComplete(
      score,
      answeredCount(score, wrongAnswersThisQuiz.length),
      roundMinutes * 60,
    );
    setTimeExpired(true);
    setScoreVisible(true);
    setSelectedQuiz(undefined);
    setSelectedQuizName(null);
    setCurrentQuestionIndex(0);
    setExplanationMode(false);
  }, [
    score,
    wrongAnswersThisQuiz,
    roundMinutes,
    onQuizComplete,
    setSelectedQuizName,
    setTotalWonGames,
    totalWonGames,
  ]);

  // A timed round ends when its deadline passes. QuizTimer re-renders itself
  // once a second in deadline mode, so the screen only has to watch for the
  // end. Skipped while the reader is open: nobody played for that score screen.
  useEffect(() => {
    if (roundDeadline === null || showReader) return;
    const interval = setInterval(() => {
      if (remainingSeconds(roundDeadline, Date.now()) === 0) {
        handleTimedRoundEnd();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [roundDeadline, showReader, handleTimedRoundEnd]);

  const handleNext = () => {
    setAnswerIsCorrect(false);
    setExplanationMode(false);
    if (roundMode === 'timed') {
      // Rolling append (D7): a timed round has no end-of-list branch, and the
      // appended batch goes in before the index advances.
      if (currentQuestionIndex >= randomizedQuestions.length - 1) {
        setRandomizedQuestions([
          ...randomizedQuestions,
          ...generateMultiplicationQuestions({
            minFactor: multiplicationRange.from,
            maxFactor: multiplicationRange.to,
          }),
        ]);
      }
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      return;
    }
    if (currentQuestionIndex < (selectedQuiz?.questions.length ?? 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed - stop timer
      setTimerActive(false);
      const finalScore = score + (answerIsCorrect ? 1 : 0); // Include current answer
      const totalQuestions = selectedQuiz?.questions.length || 0;
      const timeElapsed = Math.round(
        (Date.now() - quizStartTime.current) / 1000,
      );

      // Track gamification
      onQuizComplete(finalScore, totalQuestions, timeElapsed);

      if (score === selectedQuiz?.questions.length) {
        setTotalWonGames(totalWonGames + 1);
      } else {
        setTotalLostGames(totalLostGames + 1);
      }
      setScoreVisible(true);
      setSelectedQuiz(undefined);
      setSelectedQuizName(null);
      setCurrentQuestionIndex(0);
    }
  };

  // Handle retry of wrong answers
  const handleRetryWrongAnswers = () => {
    if (wrongAnswersThisQuiz.length === 0) return;

    // Create new questions from wrong answers
    const retryQuestions: QuizQuestion[] = wrongAnswersThisQuiz.map((wa) => ({
      question: wa.question,
      answer: wa.correctAnswer,
      answers: [], // Will be filled with actual answers below
      explanation: wa.explanation || '',
    }));

    // We need to find the original question to get all answers
    // For now, we'll create a simple retry quiz
    setIsRetryMode(true);
    setWrongAnswersThisQuiz([]);
    // A retry is a fixed list of missed sums: always a count-mode round (D12).
    setRoundMode('count');
    setRoundDeadline(null);
    setScore(0);
    setScoreVisible(false);
    setCurrentQuestionIndex(0);

    // Find the original quiz to get full answer options
    // Use lastPlayedQuizName since selectedQuizName is null after quiz ends
    const originalQuiz = quizzes.find(
      (q: Quiz) => q.name === lastPlayedQuizName,
    );

    if (originalQuiz) {
      const questionsWithAnswers = retryQuestions.map((rq) => {
        const originalQ = originalQuiz.questions.find(
          (oq) => oq.question === rq.question,
        );
        return originalQ || rq;
      });

      // Create a temporary quiz with only the wrong questions
      const retryQuiz: Quiz = {
        name: `${lastPlayedQuizName} (Retry)`,
        questions: questionsWithAnswers,
        // Keep typed-answer quizzes (e.g. multiplication tables) in input mode.
        inputMode: originalQuiz.inputMode,
      };

      setSelectedQuiz(retryQuiz);
      setSelectedQuizName(retryQuiz.name);
      setSelectedQuizAnswersAmount(questionsWithAnswers.length);
      setRandomizedQuestions(shuffleArray(questionsWithAnswers));
    }
  };

  const quizQuestions = randomizedQuestions.map((value, index) => {
    return {
      id: index.toString(),
      question: value.question || '',
      answers: value.answers || [],
      correctAnswer: value.answer || '',
      explanation: value.explanation || '',
    };
  });

  return (
    <View style={styles.outerContainer}>
      <SafeAreaLinearGradient
        colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
        style={styles.safeArea}
      >
        <View style={styles.container}>
          {!selectedQuiz && !scoreVisible && !selectedEssay && (
            <>
              {/* Gamification Header - Streak and XP */}
              <View style={styles.gamificationHeader}>
                <StreakDisplay size="small" showLabel />
                <XPProgress size="compact" style={styles.xpProgressCompact} />
              </View>

              {/* Kids Mode: Streak Pet */}
              {kidsMode && <StreakPet size="medium" showLabel />}

              {/* Glossary Button */}
              <View style={styles.topRow}>
                <TouchableOpacity
                  style={styles.glossaryButton}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedTerm(null);
                    setGlossaryVisible(true);
                  }}
                  accessibilityLabel="Open glossary"
                >
                  <Ionicons name="book-outline" size={18} color="white" />
                  <Text style={styles.glossaryButtonText}>Glossary</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {!selectedQuiz && !scoreVisible && !selectedEssay && (
            <QuizSelection
              quizzes={quizzes}
              handleQuizSelection={handleQuizSelection}
              onReadEssay={(category) => {
                const essay = getEssayByCategory(category);
                if (essay) setSelectedEssay(essay);
              }}
              categoriesWithEssays={categoriesWithEssays}
              labelFor={(quiz) =>
                quiz.generator === MULTIPLICATION_GENERATOR
                  ? t('multiplication_quiz_label_range', {
                      from: multiplicationRange.from,
                      to: multiplicationRange.to,
                    })
                  : quiz.name
              }
            />
          )}

          {/* Show Essay Reader */}
          {selectedEssay && !selectedQuiz && !scoreVisible && (
            <EssayReader
              essay={selectedEssay}
              onBack={() => setSelectedEssay(null)}
              onStartQuiz={() => {
                // Find the first quiz in this category and start it
                const firstQuiz = quizzes.find(
                  (q: Quiz) => q.category === selectedEssay.category,
                );
                setSelectedEssay(null);
                if (firstQuiz) handleQuizSelection(firstQuiz);
              }}
            />
          )}

          {/* Show Reader when reader mode is enabled and a quiz is selected */}
          {selectedQuiz && showReader && (
            <Reader quiz={selectedQuiz} onBack={handleBack} />
          )}

          {showExplanation &&
            explanationMode &&
            selectedQuiz &&
            !showReader && (
              <Explanation
                answerIsCorrect={answerIsCorrect}
                explanation={
                  randomizedQuestions[currentQuestionIndex].explanation
                }
                currentQuestionIndex={currentQuestionIndex}
                selectedQuizAnswersAmount={selectedQuizAnswersAmount}
                handleNext={handleNext}
                showTotal={roundMode !== 'timed'}
              />
            )}

          {selectedQuiz && !explanationMode && !showReader && (
            <>
              {/* Quiz Timer: a timed round owns the clock, count mode keeps the
                  global timer. */}
              {roundMode === 'timed' && roundDeadline !== null && (
                <QuizTimer
                  durationMinutes={roundMinutes}
                  onTimeUp={handleTimedRoundEnd}
                  isActive
                  deadline={roundDeadline}
                />
              )}
              {timerEnabled && roundMode === 'count' && (
                <QuizTimer
                  durationMinutes={timerDuration}
                  onTimeUp={handleTimeUp}
                  isActive={timerActive}
                />
              )}
              {flashcardsEnabled &&
                selectedQuiz.inputMode !== 'text' &&
                !scoreVisible && (
                  <FlashcardCarousel
                    questions={quizQuestions}
                    handlerOnfinish={() => setScoreVisible(true)}
                    itemWidth={400}
                  />
                )}
              {(!flashcardsEnabled || selectedQuiz.inputMode === 'text') &&
                !scoreVisible && (
                  <Question
                    question={
                      randomizedQuestions[currentQuestionIndex]?.question || ''
                    }
                    correctAnswer={
                      randomizedQuestions[currentQuestionIndex]?.answer || ''
                    }
                    answers={randomizedAnswers}
                    currentQuestionIndex={currentQuestionIndex}
                    selectedQuizAnswersAmount={selectedQuizAnswersAmount}
                    handleAnswerSelection={handleAnswerSelection}
                    forceTextInput={selectedQuiz.inputMode === 'text'}
                    showTotal={roundMode !== 'timed'}
                  />
                )}
            </>
          )}

          {scoreVisible && (
            <Score
              score={score}
              selectedQuizAnswersAmount={
                roundMode === 'timed'
                  ? answeredCount(score, wrongAnswersThisQuiz.length)
                  : selectedQuizAnswersAmount
              }
              timeExpired={timeExpired}
              wrongAnswerCount={wrongAnswersThisQuiz.length}
              onRetryWrongAnswers={
                wrongAnswersThisQuiz.length > 0
                  ? handleRetryWrongAnswers
                  : undefined
              }
            />
          )}
        </View>
        {(selectedQuiz || scoreVisible) && !showReader && (
          <View style={styles.bottomBar}>
            <TouchableOpacity onPress={handleBack} style={{ marginLeft: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="arrow-back"
                  size={35}
                  color="white"
                  style={{ marginRight: 6 }}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.glossaryButtonSmall}
              onPress={() => {
                setSearchQuery('');
                setSelectedTerm(null);
                setGlossaryVisible(true);
              }}
              accessibilityLabel="Open glossary"
            >
              <Ionicons name="book-outline" size={18} color="white" />
              <Text style={styles.glossaryButtonSmallText}>Glossary</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaLinearGradient>
      {rangeSheetQuiz !== null && (
        <MultiplicationRangeSheet
          initialFrom={multiplicationRange.from}
          initialTo={multiplicationRange.to}
          onCancel={() => setRangeSheetQuiz(null)}
          onConfirm={({ from, to, mode, minutes }) => {
            const quiz = rangeSheetQuiz;
            setMultiplicationRange({ from, to });
            setRangeSheetQuiz(null);
            if (quiz) startQuiz(quiz, { from, to }, { mode, minutes });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  quizTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'rgb(183, 183, 183)',
  },
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  safeArea: {
    flex: 1,
    maxWidth: 550,
    width: '100%',
    borderLeftColor: 'rgb(129, 129, 129)',
    borderRightColor: 'rgb(141, 141, 141)',
    borderTopColor: 'rgb(26, 26, 26)',
    borderBottomColor: 'rgb(26, 26, 26)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  container: {
    padding: 20,
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  button: {
    backgroundColor: 'rgb(86, 92, 99)',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  gamificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
    marginHorizontal: 8,
  },
  xpProgressCompact: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  glossaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 180, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 180, 255, 0.3)',
    marginRight: 8,
    marginTop: 2,
  },
  glossaryButtonText: {
    color: 'rgb(100, 200, 255)',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 90,
  },
  glossaryButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 180, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 180, 255, 0.3)',
    marginRight: 18,
  },
  glossaryButtonSmallText: {
    color: 'rgb(100, 200, 255)',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
});
