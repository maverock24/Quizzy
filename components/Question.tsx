import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
}) => (
  <ScrollView style={styles.contentContainer}>
    <View style={[styles.card, styles.questionCard]}>
      <Text style={[styles.questionHeading, { color: 'white' }]}>
        Question {currentQuestionIndex + 1} / {selectedQuizAnswersAmount}
      </Text>
      <Text style={[styles.normalText, { color: 'white' }]}>{question}</Text>
    </View>

    {answers.map((answer, index) => (
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
);

const styles = StyleSheet.create({
  contentContainer: {
    marginVertical: 12,
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
    padding: 15,
    borderRadius: 10,
  },
  questionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  normalText: {
    fontSize: 14,
    lineHeight: 24,
    color: 'white',
  },
  answerButton: {
    backgroundColor: 'rgb(85, 101, 107)',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'white',
  },
});
