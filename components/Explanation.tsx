import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ExplanationProps = {
  answerIsCorrect: boolean;
  explanation: string;
  handleNext: () => void;
};

export const Explanation: React.FC<ExplanationProps> = ({
  answerIsCorrect,
  explanation,
  handleNext,
}) => (
  <View style={styles.contentContainer}>
    <View
      style={[
        styles.card,
        {
          backgroundColor: answerIsCorrect
            ? 'rgb(71, 155, 62)'
            : 'rgb(161, 64, 64)',
        },
      ]}
    >
      <Text style={styles.questionHeading}>
        {answerIsCorrect ? 'Correct!' : 'Wrong!'}
      </Text>
      <Text style={styles.normalText}>{explanation}</Text>
    </View>
    <TouchableOpacity style={styles.button} onPress={handleNext}>
      <Text style={styles.buttonText}>Next</Text>
    </TouchableOpacity>
  </View>
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
  questionHeading: {
    fontSize: 20,
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
