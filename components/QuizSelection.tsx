import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';

type QuizSelectionProps = {
  quizzes: any[];
  handleQuizSelection: (quiz: any) => void;
};

export const QuizSelection: React.FC<QuizSelectionProps> = ({
  quizzes,
  handleQuizSelection,
}) => (
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
);

const styles = StyleSheet.create({
  normalText: {
    fontSize: 14,
    lineHeight: 24,
    color: 'white',
  },
  answerButton: {
    backgroundColor: 'rgb(46, 150, 194)',
    padding: 20,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
