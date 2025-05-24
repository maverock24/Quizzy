import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

import FontAwesome from '@expo/vector-icons/FontAwesome';

type Answer = {
  answer: string;
};

type FlashcardProps = {
  cardIsFlipped: boolean;
  question: string;
  selectedQuizAnswersAmount: number;
  keepCardAndGoToNext: () => void;
  correctAnswer: string;
  cardWidth?: number;
  cardHeight?: number;
  setScore?: (score: number) => void;
};

const FALLBACK_CARD_WIDTH = 300;
const DEFAULT_CARD_HEIGHT = 250;

const Flashcard: React.FC<FlashcardProps> = ({
  cardIsFlipped,
  question,
  selectedQuizAnswersAmount,
  keepCardAndGoToNext,
  correctAnswer,
  cardWidth = FALLBACK_CARD_WIDTH,
  cardHeight = DEFAULT_CARD_HEIGHT,
}) => {
  const [isFlipped, setIsFlipped] = useState(cardIsFlipped);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsFlipped(false);
    flipAnimation.setValue(0);
  }, [question, correctAnswer, flipAnimation]);

  useEffect(() => {
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, flipAnimation]);

  const handleLocalFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const animatedFrontStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const animatedBackStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  function handleKeepCard(): void {
    setIsFlipped(false);
    keepCardAndGoToNext();
  }

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleLocalFlip}
        style={[
          flashcardStyles.touchableContainer,
          { width: cardWidth, height: cardHeight },
        ]}
      >
        <Animated.View
          style={[
            flashcardStyles.card,
            flashcardStyles.cardFace,
            animatedFrontStyle,
            { backgroundColor: '#4A90E2' },
          ]}
        >
          <Text style={flashcardStyles.questionNumberText}>
            {selectedQuizAnswersAmount}
          </Text>
          <Text style={flashcardStyles.cardLabel}>Question</Text>
          <Text
            style={flashcardStyles.cardText}
            numberOfLines={6}
            ellipsizeMode="tail"
          >
            {question}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            flashcardStyles.card,
            flashcardStyles.cardFace,
            flashcardStyles.cardBack,
            animatedBackStyle,
            { backgroundColor: 'rgb(17, 205, 45)' },
          ]}
        >
          <Text style={flashcardStyles.questionNumberText}>
            {selectedQuizAnswersAmount}
          </Text>
          <Text style={flashcardStyles.cardLabel}>Answer</Text>
          <Text
            style={flashcardStyles.cardText}
            numberOfLines={6}
            ellipsizeMode="tail"
          >
            {correctAnswer}
          </Text>
        </Animated.View>
      </TouchableOpacity>
      {isFlipped && (
        <TouchableOpacity
          style={{
            alignSelf: 'center',
            marginTop: 10,
            width: '100%',
            flex: 0,
            position: 'absolute',
            bottom: -70,
          }}
          onPress={handleKeepCard}
        >
          <FontAwesome
            name="chevron-down"
            size={30}
            color="gray"
            style={{ alignSelf: 'center' }}
          />
          <Text
            style={{
              marginTop: 10,
              color: 'white',
              fontSize: 16,
              textAlign: 'center',
            }}
          >
            Keep
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const flashcardStyles = StyleSheet.create({
  touchableContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardFace: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBack: {},
  cardLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  questionNumberText: {
    position: 'absolute',
    top: 15,
    left: 15,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
});

type QuizQuestionData = {
  id: string;
  question: string;
  answers: Answer[];
  correctAnswer: string;
};

type FlashcardCarouselProps = {
  questions: QuizQuestionData[] | undefined;
  currentIndex: number;
  handlerOnfinish: () => void;
  totalQuestions: number;

  itemWidth?: number;
  itemHeight?: number;
};

const FlashcardCarousel: React.FC<FlashcardCarouselProps> = ({
  questions,
  currentIndex,
  handlerOnfinish,
  totalQuestions,
  itemWidth: propItemWidth,
  itemHeight: propItemHeight = DEFAULT_CARD_HEIGHT + 40,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = propItemWidth || screenWidth * 0.9;

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionData[]>(
    questions || [],
  );

  const [totalQuestionsInQuiz, setTotalQuestionsInQuiz] =
    useState(totalQuestions);

  if (!quizQuestions || quizQuestions.length === 0) {
    return (
      <View style={carouselStyles.emptyContainer}>
        <Text>No flashcards to display.</Text>
      </View>
    );
  }

  const flashCardsFinnished = () => {
    handlerOnfinish();
  };

  const goToNext = (keep: boolean) => {
    if (!keep) {
      if (totalQuestionsInQuiz === 1) {
        flashCardsFinnished();
        return;
      }
      setQuizQuestions((prevQuestions) =>
        prevQuestions.filter((_, index) => index !== currentIndex),
      );
      setTotalQuestionsInQuiz(totalQuestionsInQuiz - 1);
    }
    if (keep) {
      const currentCard = quizQuestions[currentIndex];
      setQuizQuestions((prevQuestions) => {
        const updatedQuestions = prevQuestions.filter(
          (_, index) => index !== currentIndex,
        );
        return [...updatedQuestions, currentCard];
      });
    }
  };

  return (
    <View
      style={{
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <View
        key={quizQuestions[currentIndex].id || `flashcard-${currentIndex}`}
        style={[
          carouselStyles.carouselItemContainer,
          { width: itemWidth, height: propItemHeight },
        ]}
      >
        <TouchableOpacity onPress={undefined} style={carouselStyles.navButton}>
          <FontAwesome
            name="chevron-left"
            size={30}
            color={
              currentIndex === 0 || quizQuestions.length === 1
                ? 'transparent'
                : 'gray'
            }
          />
        </TouchableOpacity>
        <Flashcard
          cardIsFlipped={false}
          question={quizQuestions[0].question}
          correctAnswer={quizQuestions[0].correctAnswer}
          selectedQuizAnswersAmount={totalQuestionsInQuiz}
          keepCardAndGoToNext={() => goToNext(true)}
          cardWidth={itemWidth * 0.95}
          cardHeight={propItemHeight - 40}
        />
        <TouchableOpacity
          onPress={() => goToNext(false)}
          style={carouselStyles.navButton}
        >
          <FontAwesome
            name="chevron-right"
            size={30}
            color={
              currentIndex === quizQuestions.length - 1 ? 'transparent' : 'gray'
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const carouselStyles = StyleSheet.create({
  scrollView: {},
  scrollViewContent: {
    alignItems: 'center',
  },
  carouselItemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 20,
    marginHorizontal: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: DEFAULT_CARD_HEIGHT + 40,
  },
  navButton: {
    alignContent: 'center',
    justifyContent: 'center',
    height: '100%',
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 5,
  },
  navButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FlashcardCarousel;
