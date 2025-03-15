import { useQuiz } from '@/components/Quizprovider';
import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Sad from '../../assets/images/sad.svg';
import Happy from '../../assets/images/happy.svg';
import { AnalogClock } from '@/components/AnalogClock';

const quizzes = require('../../assets/quizzes.json');

type Quiz = {
  name: string;
  questions: Question[];
};

type Answer = {
  answer: string;
};

type Question = {
  question: string;
  answers: Answer[];
  answer: string;
  explanation: string;
};

// Function to shuffle array (Fisher-Yates algorithm)
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
  const [selectedQuizAnswersAmount, setSelectedQuizAnswersAmount] =
    useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [scoreVisible, setScoreVisible] = useState<boolean>(false);

  const { selectedQuizName, setSelectedQuizName } = useQuiz();
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [anserIsCorrect, setAnswerIsCorrect] = useState<boolean>(false);

  const [randomizedAnswers, setRandomizedAnswers] = useState<Answer[]>([]);

  useEffect(() => {
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
      const question = selectedQuiz.questions[currentQuestionIndex];
      if (question.answer === answer) {
        setAnswerIsCorrect(true);
        setScore(score + 1);
      } else {
      }
      setShowExplanation(true);
    }
  };

  const handleBack = () => {
    setSelectedQuiz(undefined);
    setSelectedQuizName(null);
    setCurrentQuestionIndex(0);
    setScoreVisible(false);
    setAnswerIsCorrect(false);
    setShowExplanation(false);
  };

  const handleNext = () => {
    setAnswerIsCorrect(false);
    setShowExplanation(false);
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    if (currentQuestionIndex === selectedQuiz?.questions.length! - 1) {
      setScoreVisible(true);
      setSelectedQuiz(undefined);
      setSelectedQuizName(null);
      setCurrentQuestionIndex(0);
      setAnswerIsCorrect(false);
      setShowExplanation(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {!selectedQuiz && !scoreVisible && (
          <>
            <Text style={styles.normalText}>Select a quiz:</Text>
            <FlatList
              data={quizzes}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.answerButton}
                  onPress={() => handleQuizSelection(item)}
                >
                  <Text style={styles.buttonText} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {showExplanation && (
          <View style={styles.contentContainer}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: anserIsCorrect
                    ? 'rgb(73, 102, 70)'
                    : 'rgb(150, 60, 60)',
                },
              ]}
            >
              <Text style={styles.questionHeading}>
                {anserIsCorrect ? 'Correct!' : 'Wrong!'}
              </Text>
              <Text style={styles.normalText}>
                {selectedQuiz?.questions[currentQuestionIndex].explanation}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleNext()}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedQuiz && !showExplanation && (
          <ScrollView style={styles.contentContainer}>
            <View style={[styles.card, styles.questionCard]}>
              <Text style={[styles.questionHeading, { color: 'white' }]}>
                Question {currentQuestionIndex + 1} /{' '}
                {selectedQuizAnswersAmount}
              </Text>
              <Text style={[styles.normalText, { color: 'white' }]}>
                {selectedQuiz.questions[currentQuestionIndex].question}
              </Text>
            </View>

            {randomizedAnswers.map((answer, index) => (
              <TouchableOpacity
                key={index}
                style={styles.answerButton}
                onPress={() => handleAnswerSelection(answer.answer)}
              >
                <Text style={styles.answerButtonText} numberOfLines={4}>
                  {answer.answer}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {scoreVisible && (
          <View style={styles.scoreContainer}>
            <Text style={styles.heading}>
              {score === selectedQuizAnswersAmount ? 'Well Done!' : 'Try again'}
            </Text>
            {score !== selectedQuizAnswersAmount && (
              <Sad width={150} height={150} />
            )}
            {score === selectedQuizAnswersAmount && (
              <Happy width={150} height={150} />
            )}

            <Text style={styles.scoreText}>
              Score: {score} / {selectedQuizAnswersAmount}
            </Text>
          </View>
        )}

        {(selectedQuiz || scoreVisible) && !showExplanation && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => handleBack()}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}
        {/* <AnalogClock
          size={190}
          showSeconds={false}
          showDigitalTime={false}
          hour={8}
          minute={15}
          darkMode={true}
        /> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgb(26, 26, 26)',
  },
  questionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  container: {
    padding: 20,
    flex: 1,
  },
  contentContainer: {
    marginVertical: 12,
  },
  quizButton: {
    backgroundColor: 'rgb(46, 46, 46)',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    paddingLeft: 36,
  },
  questionCard: {
    backgroundColor: 'rgb(90, 106, 146)',
    borderColor: 'rgb(63, 65, 66)',
    borderWidth: 1,
    padding: 24,
    borderRadius: 10,
  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  normalText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'white',
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
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  answerButton: {
    backgroundColor: 'rgb(85, 101, 107)',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,

    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'white',
  },
  scoreContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  animatedView: {
    flex: 1,
  },
});
