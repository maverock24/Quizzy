import { Explanation } from '@/components/Explanation';
import { Question } from '@/components/Question';
import { useQuiz } from '@/components/Quizprovider';
import { QuizSelection } from '@/components/QuizSelection';
import { Score } from '@/components/Score';
import { Answer, Quiz } from '@/components/types';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  };

  const handleAnswerSelection = (answer: string) => {
    if (selectedQuiz) {
      setExplanationMode(true);
      const question = selectedQuiz.questions[currentQuestionIndex];
      if (question.answer === answer) {
        setAnswerIsCorrect(true);
        setScore(score + 1);
      } else {
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
      setScoreVisible(true);
      setSelectedQuiz(undefined);
      setSelectedQuizName(null);
      setCurrentQuestionIndex(0);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
            Score board
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 10,
              paddingTop: 10,
            }}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>
              Most popular quiz
            </Text>
            <Text style={{ color: 'white', fontSize: 12, marginLeft: 10 }}>
              AWS Saas
            </Text>
          </View>
        </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgb(26, 26, 26)',
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
    backgroundColor: 'rgb(63, 65, 66)',
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
