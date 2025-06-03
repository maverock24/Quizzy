import React, { useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Animated,
  Pressable,
} from 'react-native';

type QuizSelectionProps = {
  quizzes: any[];
  handleQuizSelection: (quiz: any) => void;
};

const QuizButton: React.FC<{ item: any; onPress: (quiz: any) => void }> = ({
  item,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = React.useState(false);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  return (
    <Pressable
      onPress={() => onPress(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ alignItems: 'center' }}
    >
      <Animated.View
        style={[
          styles.answerButton,
          {
            width: '100%',
            backgroundColor: pressed
              ? 'rgb(30, 100, 130)' // darker when pressed
              : 'rgb(46, 150, 194)',
            transform: [{ scale }],
            shadowColor: '#000',
            shadowOffset: pressed
              ? { width: 0, height: 1 }
              : { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: pressed ? 2 : 6,
            elevation: pressed ? 2 : 8, // Android shadow
          },
        ]}
      >
        <Text style={styles.buttonText} numberOfLines={1}>
          {item.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export const QuizSelection: React.FC<QuizSelectionProps> = ({
  quizzes,
  handleQuizSelection,
}) => {
  const renderItem = ({ item }: { item: any }) => (
    <QuizButton item={item} onPress={handleQuizSelection} />
  );

  return (
    <View style={styles.quizSelectionContainer}>
      <Text style={styles.normalText}>Select Quiz:</Text>
      <FlatList
        style={{ padding: 10 }}
        data={quizzes}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  quizSelectionContainer: {
    flex: 1,
  },
  normalText: {
    fontSize: 18,
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