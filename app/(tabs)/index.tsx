import { Explanation } from '@/components/Explanation';
import { Question } from '@/components/Question';
import { useQuiz } from '@/components/Quizprovider';
import { QuizSelection } from '@/components/QuizSelection';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';
import { Score } from '@/components/Score';
import { Answer, Quiz } from '@/components/types';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const [selectedQuizAnswersAmount, setSelectedQuizAnswersAmount] = useState<
    number
  >(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [scoreVisible, setScoreVisible] = useState<boolean>(false);

  // Get quizzes from context
  const {
    setSelectedQuizName,
    showExplanation,
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
  const [explanationMode, setExplanationMode] = useState<boolean>(false);

  useEffect(() => {
    // Check for quizzes update when component mounts
    checkForQuizzesUpdate();

    if (selectedQuiz && selectedQuiz.questions[currentQuestionIndex]) {
      setRandomizedAnswers(
        shuffleArray(selectedQuiz.questions[currentQuestionIndex].answers),
      );
    }
  }, [selectedQuiz, currentQuestionIndex]);

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
      const question = selectedQuiz.questions[currentQuestionIndex];
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

  return (
    <View style={styles.outerContainer}>
      <SafeAreaLinearGradient
        colors={[
          'rgb(63, 82, 108)',
          'rgb(29, 40, 54)',
          'rgb(29, 40, 54)',
          'rgb(29, 40, 54)',
          'rgb(29, 40, 54)',
        ]}
        style={styles.safeArea}
      >
        <Text style={styles.scoreTitle}>Scores:</Text>
        <View style={styles.container}>
          {!selectedQuiz && (
            <View style={styles.scoreBoard}>
              <View style={styles.scoreItemRow}>
                <View style={styles.scoreItemColumn}>
                  <View
                    style={[
                      styles.scoreItem,
                      { backgroundColor: 'rgb(0, 123, 255)' },
                    ]}
                  >
                    <Text style={styles.scoreItemTitle}>Quiz wins:</Text>
                    <Text style={styles.scoreItemText}>{totalWonGames}</Text>
                  </View>
                  <View
                    style={[
                      styles.scoreItem,
                      { backgroundColor: 'rgb(239, 130, 22)' },
                    ]}
                  >
                    <Text style={styles.scoreItemTitle}>Quiz losses:</Text>
                    <Text style={styles.scoreItemText}>{totalLostGames}</Text>
                  </View>
                </View>
                <View style={styles.scoreItemColumn}>
                  <View
                    style={[styles.scoreItem, { backgroundColor: 'green' }]}
                  >
                    <Text style={styles.scoreItemTitle}>Answers correct:</Text>
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
                    <Text style={styles.scoreItemTitle}>Answer wrong:</Text>
                    <Text style={styles.scoreItemText}>
                      {totalWrongAnswers}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
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
                selectedQuiz.questions[currentQuestionIndex].explanation
              }
              handleNext={handleNext}
            />
          )}

          {selectedQuiz && !explanationMode && (
            <Question
              question={selectedQuiz.questions[currentQuestionIndex].question}
              answers={randomizedAnswers}
              currentQuestionIndex={currentQuestionIndex}
              selectedQuizAnswersAmount={selectedQuizAnswersAmount}
              handleAnswerSelection={handleAnswerSelection}
            />
          )}

          {scoreVisible && (
            <Score
              score={score}
              selectedQuizAnswersAmount={selectedQuizAnswersAmount}
            />
          )}
        </View>
        {(selectedQuiz || scoreVisible) && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={handleBack}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}
      </SafeAreaLinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'rgb(26, 26, 26)',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgb(26, 26, 26)',
    maxWidth: 550,
    maxHeight: 800,
    width: '100%',
  },
  scoreTitle: {
    fontSize: 14,
    margin: 20,
    marginBottom: -10,
    color: 'white',
  },
  scoreBoard: {
    flex: 1,
    width: '100%',
    marginBottom: 140,
  },
  scoreItem: {
    height: '50%',
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
    height: '100%',
  },
  button: {
    backgroundColor: 'rgb(86, 92, 99)',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: 'rgb(86, 92, 99)',
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
