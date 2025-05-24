import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Happy from '../assets/images/happy.svg';
import Sad from '../assets/images/sad.svg';
import { useQuiz } from './Quizprovider';

type ScoreProps = {
  score: number;
  selectedQuizAnswersAmount: number;
};

export const Score: React.FC<ScoreProps> = ({
  score,
  selectedQuizAnswersAmount,
}) => {
  const { flashcardsEnabled } = useQuiz();
  return (
    <View style={styles.scoreContainer}>
      {!flashcardsEnabled && (
        <>
          <Text style={styles.heading}>
            {score === selectedQuizAnswersAmount ? 'Well Done!' : 'Try again!'}
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
        </>
      )}

      {flashcardsEnabled && (
        <>
          <Text style={styles.heading}>Well Done!</Text>
          <Happy width={150} height={150} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  scoreContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
