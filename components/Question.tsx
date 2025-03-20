import React, { useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Animated } from 'react-native';

type Answer = {
  answer: string;
};

type QuestionProps = {
  question: string;
  answers: Answer[];
  currentQuestionIndex: number;
  selectedQuizAnswersAmount: number;
  handleAnswerSelection: (answer: string) => void;
};

export const Question: React.FC<QuestionProps> = ({
  question,
  answers,
  currentQuestionIndex,
  selectedQuizAnswersAmount,
  handleAnswerSelection,
}) => {
  // Array of letter labels for answers
  const answerLabels = ['A:', 'B:', 'C:', 'D:'];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [answerSelected, setAnswerSelected] = React.useState(false);
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

  const handleAnswer = (answer: string) => {
    handleAnswerSelection(answer);
    setAnswerSelected(!answerSelected);
  };

  return (
    <ScrollView style={styles.contentContainer}>
      <View style={[styles.card, styles.questionCard]}>
        <Text style={styles.questionHeading}>
          Question {currentQuestionIndex + 1} / {selectedQuizAnswersAmount}
        </Text>
        <Text style={styles.questionText}>{question}</Text>
      </View>

      {answers.map((answer, index) => (
        <Animated.View
          style={{
            opacity: fadeAnim,
          }}
        >
          <TouchableOpacity
            key={index}
            style={styles.answerButton}
            onPress={() => handleAnswer(answer.answer)}
          >
            <View style={styles.labelContainer}>
              <Text style={styles.labelText}>{answerLabels[index]}</Text>
            </View>
            <Text style={styles.answerButtonText} numberOfLines={4}>
              {answer.answer}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    marginVertical: 12,
  },
  card: {
    padding: 0,
    borderRadius: 8,
    // backgroundColor: 'white',
    // shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    paddingLeft: 5,
  },
  questionCard: {
    // backgroundColor: 'rgb(38, 107, 176)',
    // borderColor: 'rgb(63, 65, 66)',
    // borderWidth: 1,
    height: 100,
    padding: 5,
    borderRadius: 10,
  },
  questionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'rgb(212, 212, 212)',
    borderBottomColor: 'rgb(255, 255, 255)',
    borderBottomWidth: 1,
    paddingTop: 5,
    paddingBottom: 5,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 24,
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
    alignItems: 'center',
    flexDirection: 'row',
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
    fontSize: 16,
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
});
