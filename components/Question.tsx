import React, { useEffect, useRef, useState } from 'react';
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
  // Instead of useRef, use useState to recreate animation values when answers change
  const [fadeOutAnim, setFadeOutAnim] = useState<Animated.Value[]>([]);
  const [answerSelected, setAnswerSelected] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(
    null,
  );

  // Initialize or reset fadeOutAnim whenever answers change
  useEffect(() => {
    setFadeOutAnim(answers.map(() => new Animated.Value(1)));
    setSelectedAnswerIndex(null);
    setAnswerSelected(false);
  }, [answers, currentQuestionIndex]); // Dependency on answers and question index

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

  const handleAnswer = (answer: string, index: number) => {
    setSelectedAnswerIndex(index); // Highlight the selected button

    // Fade out other buttons except the clicked one
    fadeOutAnim.forEach((anim, i) => {
      if (i !== index) {
        Animated.timing(anim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    });

    setTimeout(() => {
      handleAnswerSelection(answer);
      setAnswerSelected(false); // Reset to false instead of toggling
      // Reset the selected answer index
      setSelectedAnswerIndex(null);
      // Reset the fade out animation
      fadeOutAnim.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 2000); // 2-second delay
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
          key={index}
          style={{
            opacity: fadeOutAnim[index],
          }}
        >
          <TouchableOpacity
            style={[
              styles.answerButton,
              selectedAnswerIndex === index && styles.selectedAnswerButton,
            ]}
            onPress={() => handleAnswer(answer.answer, index)}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    paddingLeft: 5,
  },
  questionCard: {
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
  selectedAnswerButton: {
    borderColor: 'white',
    borderWidth: 1,
  },
});
