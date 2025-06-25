import { Explanation } from '@/components/Explanation';
import FlashcardCarousel from '@/components/Flashcards';
import Flashcards from '@/components/Flashcards';
import { Question } from '@/components/Question';
import { useQuiz } from '@/components/Quizprovider';
import { QuizSelection } from '@/components/QuizSelection';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';
import { Score } from '@/components/Score';
import { Answer, Quiz, QuizQuestion } from '@/components/types';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  // Get quizzes from context
  const {
    setSelectedQuizName,
    showExplanation,
    flashcardsEnabled,
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
  } = useQuiz();
  const [answerIsCorrect, setAnswerIsCorrect] = useState<boolean>(false);
  const [randomizedAnswers, setRandomizedAnswers] = useState<Answer[]>([]);
  const [randomizedQuestions, setRandomizedQuestions] = useState<
    QuizQuestion[]
  >([]);
  const [explanationMode, setExplanationMode] = useState<boolean>(false);

  useEffect(() => {
    if (selectedQuiz) {
      setRandomizedQuestions(shuffleArray(selectedQuiz.questions));
      setRandomizedAnswers(
        shuffleArray(selectedQuiz.questions[currentQuestionIndex].answers),
      );
    }
  }, [selectedQuiz]);

  useEffect(() => {
    if (selectedQuiz && randomizedQuestions[currentQuestionIndex]) {
      setRandomizedAnswers(
        shuffleArray(randomizedQuestions[currentQuestionIndex].answers),
      );
    }
  }, [currentQuestionIndex, randomizedQuestions]);

  const handleQuizSelection = (quiz: any) => {
    const selectedQuiz = quizzes.find((q: Quiz) => q.name === quiz.name);
    setSelectedQuiz(selectedQuiz);
    setSelectedQuizAnswersAmount(selectedQuiz?.questions.length!);
    setScore(0);
    setScoreVisible(false);
    setSelectedQuizName(quiz.name);
    setExplanationMode(false);
  };

  const handleAnswerSelection = (answer: string) => {
    if (selectedQuiz) {
      setExplanationMode(true);
      const question = randomizedQuestions[currentQuestionIndex];
      if (question.answer === answer) {
        setAnswerIsCorrect(true);
        setTotalCorrectAnswers(totalCorrectAnswers + 1);
        setScore(score + 1);
      } else {
        setTotalWrongAnswers(totalWrongAnswers + 1);
        setAnswerIsCorrect(false);
      }
      if (!showExplanation) {
        handleNext();
      }
    }
  };

  const handleBack = () => {
    setSelectedQuiz(undefined);
    setSelectedQuizName(null);
    setCurrentQuestionIndex(0);
    setScoreVisible(false);
    setAnswerIsCorrect(false);
  };

  const handleNext = () => {
    setAnswerIsCorrect(false);
    setExplanationMode(false);
    if (currentQuestionIndex < selectedQuiz?.questions.length! - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
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
              <Text style={styles.scoreTitle}>{t('scores')}</Text>
              <View style={styles.scoreBoard}>
                <View style={styles.scoreItemRow}>
                  <View style={styles.scoreItemColumn}>
                    <View
                      style={[
                        styles.scoreItem,
                        { backgroundColor: 'rgb(0, 123, 255)' },
                      ]}
                    >
                      <Text style={styles.scoreItemTitle}>
                        {t('Quiz_wins')}:
                      </Text>
                      <Text style={styles.scoreItemText}>{totalWonGames}</Text>
                    </View>
                    <View
                      style={[
                        styles.scoreItem,
                        { backgroundColor: 'rgb(239, 130, 22)' },
                      ]}
                    >
                      <Text style={styles.scoreItemTitle}>
                        {t('Quiz_losses')}:
                      </Text>
                      <Text style={styles.scoreItemText}>{totalLostGames}</Text>
                    </View>
                  </View>
                  <View style={styles.scoreItemColumn}>
                    <View
                      style={[styles.scoreItem, { backgroundColor: 'green' }]}
                    >
                      <Text style={styles.scoreItemTitle}>
                        {t('Answers_right')}:
                      </Text>
                      <Text style={styles.scoreItemText}>
                        {totalCorrectAnswers}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.scoreItem,
                        { backgroundColor: 'rgb(205, 57, 161)' },
                      ]}
                    >
                      <Text style={styles.scoreItemTitle}>
                        {t('Answers_wrong')}:
                      </Text>
                      <Text style={styles.scoreItemText}>
                        {totalWrongAnswers}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
          {!selectedQuiz && !scoreVisible && (
            <QuizSelection
              quizzes={quizzes}
              handleQuizSelection={handleQuizSelection}
            />
          )}

          {showExplanation && explanationMode && selectedQuiz && (
            
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

          {selectedQuiz && !explanationMode && (
            <>
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
            />
          )}
        </View>
         {(selectedQuiz || scoreVisible) && (
          <TouchableOpacity onPress={handleBack} style={{ marginLeft: 18, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={35} color="white" style={{ marginRight: 6 }} />
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
  scoreTitle: {
    fontSize: 20,
    marginBottom: 10,
    color: 'white',
  },
  scoreBoard: {
    height: 170,
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: 30,
  },
  scoreItem: {
    height: 80,
    margin: 3,
    flexDirection: 'column',
    padding: 5,
    backgroundColor: 'rgb(209, 79, 170)',
    borderRadius: 5,
  },
  scoreItemTitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  scoreItemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scoreItemColumn: {
    width: '50%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  scoreItemText: {
    color: 'white',
    fontSize: 40,
    justifyContent: 'center',
    textAlign: 'center',
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
});
