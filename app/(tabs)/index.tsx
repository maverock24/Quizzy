import { Explanation } from '@/components/Explanation';
import FlashcardCarousel from '@/components/Flashcards';
import Flashcards from '@/components/Flashcards';
import { Question } from '@/components/Question';
import { Reader } from '@/components/Reader';
import { useQuiz } from '@/components/Quizprovider';
import { QuizSelection } from '@/components/QuizSelection';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';
import { Score } from '@/components/Score';
import { QuizTimer } from '@/components/QuizTimer';
import { Answer, Quiz, QuizQuestion } from '@/components/types';
import { t } from 'i18next';
import { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReadAloud } from '@/components/useReadAloud';
import {
  useGamification,
  StreakDisplay,
  XPProgress,
  DailyQuiz,
} from '@/components/gamification';
import { useLearningTodos } from '@/components/LearningTodosProvider';

// Type for tracking wrong answers during a quiz session
interface WrongAnswerRecord {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  explanation?: string;
}

// Function to shuffle array (Fi
const shuffleArray = (array: any[]) => {
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

  // Get quizzes from context
  const {
    selectedQuizName,
    setSelectedQuizName,
    showExplanation,
    flashcardsEnabled,
    readerModeEnabled,
    quizzes,
    checkForQuizzesUpdate,
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
  } = useQuiz();
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timeExpired, setTimeExpired] = useState<boolean>(false);
  const [answerIsCorrect, setAnswerIsCorrect] = useState<boolean>(false);
  const [randomizedAnswers, setRandomizedAnswers] = useState<Answer[]>([]);
  const [randomizedQuestions, setRandomizedQuestions] = useState<
    QuizQuestion[]
  >([]);
  const [explanationMode, setExplanationMode] = useState<boolean>(false);
  const [showReader, setShowReader] = useState<boolean>(false);

  // Gamification integration
  const { onQuizComplete, onCorrectAnswer, completeDailyQuiz } = useGamification();
  const { addWrongAnswer, recordCorrectAnswer, getTodoByQuestion } = useLearningTodos();
  const quizStartTime = useRef<number>(Date.now());
  const [isDailyQuiz, setIsDailyQuiz] = useState<boolean>(false);

  // Track wrong answers during this quiz session
  const [wrongAnswersThisQuiz, setWrongAnswersThisQuiz] = useState<WrongAnswerRecord[]>([]);
  const [isRetryMode, setIsRetryMode] = useState<boolean>(false);
  // Track the last quiz name for retry functionality (persists after quiz ends)
  const [lastPlayedQuizName, setLastPlayedQuizName] = useState<string | null>(null);

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

  const handleQuizSelection = (quiz: any) => {
    const selectedQuiz = quizzes.find((q: Quiz) => q.name === quiz.name);
    setSelectedQuiz(selectedQuiz);
    setSelectedQuizAnswersAmount(selectedQuiz?.questions.length!);
    setScore(0);
    setScoreVisible(false);
    setSelectedQuizName(quiz.name || quiz.nimi);
    setLastPlayedQuizName(quiz.name || quiz.nimi);
    setExplanationMode(false);
    setTimeExpired(false);

    // Start timer if enabled
    if (timerEnabled) {
      setTimerActive(true);
    }

    // If reader mode is enabled, show the reader instead of the quiz
    if (readerModeEnabled) {
      setShowReader(true);
    } else {
      setShowReader(false);
    }
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
        setWrongAnswersThisQuiz(prev => [...prev, {
          question: question.question,
          correctAnswer: question.answer,
          userAnswer: answer,
          explanation: question.explanation,
        }]);

        // Add to learning todos (persistent)
        addWrongAnswer(
          question.question,
          question.answer,
          answer,
          selectedQuiz.name,
          question.explanation
        );
      }
      if (!showExplanation) {
        handleNext();
      }
    }
  };

  const handleBack = () => {
    stopTTS();

    // If abandoning a daily quiz, mark it as completed (can't retry)
    if (isDailyQuiz && selectedQuiz) {
      completeDailyQuiz(score, selectedQuiz.questions.length);
      setIsDailyQuiz(false);
    }

    setSelectedQuiz(undefined);
    setSelectedQuizName(null);
    setCurrentQuestionIndex(0);
    setScoreVisible(false);
    setAnswerIsCorrect(false);
    setShowReader(false);
    setTimerActive(false);
    setTimeExpired(false);
    setWrongAnswersThisQuiz([]);
    setIsRetryMode(false);
  };

  // Handle time up - end the quiz
  const handleTimeUp = useCallback(() => {
    setTimerActive(false);
    setTimeExpired(true);
    setTotalLostGames(totalLostGames + 1);

    // If time expires during daily quiz, mark it as completed (can't retry)
    if (isDailyQuiz) {
      completeDailyQuiz(score, selectedQuizAnswersAmount);
      setIsDailyQuiz(false);
    }

    setScoreVisible(true);
    setSelectedQuiz(undefined);
    setSelectedQuizName(null);
    setCurrentQuestionIndex(0);
    setExplanationMode(false);
  }, [totalLostGames, setTotalLostGames, setSelectedQuizName, isDailyQuiz, score, selectedQuizAnswersAmount, completeDailyQuiz]);

  const handleNext = () => {
    setAnswerIsCorrect(false);
    setExplanationMode(false);
    if (currentQuestionIndex < selectedQuiz?.questions.length! - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed - stop timer
      setTimerActive(false);
      const finalScore = score + (answerIsCorrect ? 1 : 0); // Include current answer
      const totalQuestions = selectedQuiz?.questions.length || 0;
      const timeElapsed = Math.round((Date.now() - quizStartTime.current) / 1000);

      // Track gamification
      onQuizComplete(finalScore, totalQuestions, timeElapsed);

      // Complete daily quiz if it was a daily challenge
      if (isDailyQuiz) {
        completeDailyQuiz(finalScore, totalQuestions);
        setIsDailyQuiz(false);
      }

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

  // Handle daily quiz selection
  const handleDailyQuizStart = (quizName: string) => {
    const quiz = quizzes.find((q: Quiz) => q.name === quizName);
    if (quiz) {
      setIsDailyQuiz(true); // Mark this as a daily quiz
      handleQuizSelection(quiz);
    }
  };

  // Handle retry of wrong answers
  const handleRetryWrongAnswers = () => {
    if (wrongAnswersThisQuiz.length === 0) return;

    // Create new questions from wrong answers
    const retryQuestions: QuizQuestion[] = wrongAnswersThisQuiz.map(wa => ({
      question: wa.question,
      answer: wa.correctAnswer,
      answers: [], // Will be filled with actual answers below
      explanation: wa.explanation || '',
    }));

    // We need to find the original question to get all answers
    // For now, we'll create a simple retry quiz
    setIsRetryMode(true);
    setWrongAnswersThisQuiz([]);
    setScore(0);
    setScoreVisible(false);
    setCurrentQuestionIndex(0);

    // Find the original quiz to get full answer options
    // Use lastPlayedQuizName since selectedQuizName is null after quiz ends
    const originalQuiz = quizzes.find((q: Quiz) => q.name === lastPlayedQuizName);

    if (originalQuiz) {
      const questionsWithAnswers = retryQuestions.map(rq => {
        const originalQ = originalQuiz.questions.find(oq => oq.question === rq.question);
        return originalQ || rq;
      });

      // Create a temporary quiz with only the wrong questions
      const retryQuiz: Quiz = {
        name: `${lastPlayedQuizName} (Retry)`,
        questions: questionsWithAnswers,
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
          {!selectedQuiz && (
            <>
              {/* Gamification Header - Streak and XP */}
              <View style={styles.gamificationHeader}>
                <StreakDisplay size="small" showLabel />
                <XPProgress size="compact" style={styles.xpProgressCompact} />
              </View>

              {/* Daily Challenge */}
              <DailyQuiz
                onStartDailyQuiz={handleDailyQuizStart}
                style={styles.dailyQuiz}
              />
            </>
          )}
          {!selectedQuiz && !scoreVisible && (
            <QuizSelection
              quizzes={quizzes}
              handleQuizSelection={handleQuizSelection}
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
              />
            )}

          {selectedQuiz && !explanationMode && !showReader && (
            <>
              {/* Quiz Timer */}
              {timerEnabled && (
                <QuizTimer
                  durationMinutes={timerDuration}
                  onTimeUp={handleTimeUp}
                  isActive={timerActive}
                />
              )}
              {flashcardsEnabled && !scoreVisible && (
                <FlashcardCarousel
                  questions={quizQuestions}
                  handlerOnfinish={() => setScoreVisible(true)}
                  itemWidth={400}
                />
              )}
              {!flashcardsEnabled && !scoreVisible && (
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
                />
              )}
            </>
          )}

          {scoreVisible && (
            <Score
              score={score}
              selectedQuizAnswersAmount={selectedQuizAnswersAmount}
              timeExpired={timeExpired}
              wrongAnswerCount={wrongAnswersThisQuiz.length}
              onRetryWrongAnswers={wrongAnswersThisQuiz.length > 0 ? handleRetryWrongAnswers : undefined}
            />
          )}
        </View>
        {(selectedQuiz || scoreVisible) && !showReader && (
          <TouchableOpacity
            onPress={handleBack}
            style={{ marginLeft: 18, marginBottom: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="arrow-back"
                size={35}
                color="white"
                style={{ marginRight: 6 }}
              />
              {/* <Text style={styles.buttonText}>{t('back')}</Text> */}
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaLinearGradient>
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
  },
  container: {
    padding: 20,
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'transparent',
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
  },
  xpProgressCompact: {
    flex: 1,
  },
  dailyQuiz: {
    marginBottom: 20,
  },
});
