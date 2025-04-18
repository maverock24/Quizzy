import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FontAwesome from '@expo/vector-icons/FontAwesome';

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
  correctAnswer: string;
};

export const Question: React.FC<QuestionProps> = ({
  question,
  answers,
  currentQuestionIndex,
  selectedQuizAnswersAmount,
  handleAnswerSelection,
  correctAnswer,
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
  const [answerIsCorrect, setAnswerIsCorrect] = useState(false);
  const [answerIsWrong, setAnswerIsWrong] = useState(false);

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
      answer === correctAnswer
        ? setAnswerIsCorrect(true)
        : setAnswerIsWrong(true);
    }, 800);

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
      setAnswerIsCorrect(false);
      setAnswerIsWrong(false);
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
            {answerIsCorrect && (
              <FontAwesome
                name="check"
                size={20}
                color="white"
                style={styles.correct}
              />
            )}
            {answerIsWrong && (
              <FontAwesome
                name="times"
                size={20}
                color="white"
                style={styles.wrong}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrong: {
    paddingLeft: 5,
    paddingTop: 3,
    backgroundColor: 'rgb(255, 0, 0)',
    height: 30,
    width: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgb(255, 255, 255)',
  },
  correct: {
    paddingLeft: 3,
    paddingTop: 3,
    backgroundColor: 'rgb(0, 216, 0)',
    height: 30,
    width: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgb(255, 255, 255)',
  },
  contentContainer: {
    marginTop: 30,
    marginVertical: 12,
  },
  card: {
    padding: 0,
    borderRadius: 8,
    marginBottom: 16,
  },
  questionCard: {
    height: 100,
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
    fontSize: 22,
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
