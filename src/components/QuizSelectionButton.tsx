import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { getRandomConsistentColor } from '../utils/colorUtils';

type QuizSelectionButtonProps = {
  title: string;
  onPress: () => void;
  style?: any;
};

const QuizSelectionButton: React.FC<QuizSelectionButtonProps> = ({
  title,
  onPress,
  style,
}) => {
  // Generate and memoize a consistent color for this button
  const backgroundColor = useMemo(() => {
    // Use consistent saturation and lightness for all buttons
    return getRandomConsistentColor(70, 60);
  }, [title]); // Regenerate only if title changes

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, style]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default QuizSelectionButton;
