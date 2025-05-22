import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView, // Added ScrollView
} from 'react-native';

// --- Types ---
type Answer = {
  answer: string;
};

type FlashcardProps = {
  question: string;
  answers: Answer[];
  currentQuestionIndex: number; // Index of this specific card in the set
  selectedQuizAnswersAmount: number; // Total cards in the set
  handleAnswerSelection: (answer: string) => void;
  correctAnswer: string;
  cardWidth?: number;
  cardHeight?: number;
};

// --- Flashcard Component (Displays a single flashcard) ---
const FALLBACK_CARD_WIDTH = 300; // Fallback if no width is provided
const DEFAULT_CARD_HEIGHT = 250;

const Flashcard: React.FC<FlashcardProps> = ({
  question,
  // answers, // Available if needed for future UI enhancements on the card
  currentQuestionIndex,
  selectedQuizAnswersAmount,
  handleAnswerSelection, // Available for future use (e.g. buttons on card)
  correctAnswer,
  cardWidth = FALLBACK_CARD_WIDTH,
  cardHeight = DEFAULT_CARD_HEIGHT,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
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
    // Example: If flipping to answer side should trigger answer selection
    // if (!isFlipped) {
    //   handleAnswerSelection(correctAnswer);
    // }
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

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleLocalFlip}
      style={[flashcardStyles.touchableContainer, { width: cardWidth, height: cardHeight }]}
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
          {currentQuestionIndex + 1} / {selectedQuizAnswersAmount}
        </Text>
        <Text style={flashcardStyles.cardLabel}>Question</Text>
        <Text style={flashcardStyles.cardText} numberOfLines={6} ellipsizeMode="tail">{question}</Text>
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
          {currentQuestionIndex + 1} / {selectedQuizAnswersAmount}
        </Text>
        <Text style={flashcardStyles.cardLabel}>Answer</Text>
        <Text style={flashcardStyles.cardText} numberOfLines={6} ellipsizeMode="tail">{correctAnswer}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const flashcardStyles = StyleSheet.create({
  touchableContainer: { // Renamed from 'container' to avoid conflict
    alignItems: 'center',
    justifyContent: 'center',
    // marginVertical is applied by the carousel item container
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
    width: '100%', // Ensure face takes full width of card
    height: '100%', // Ensure face takes full height of card
    alignItems: 'center', // Center content within the face
    justifyContent: 'center', // Center content within the face
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
  }
});


// --- Flashcard Carousel Component ---
// This component will render a horizontal list of Flashcard items.

// Define the type for individual question data passed to the carousel
// This should match the structure of questions in your selectedQuiz.questions array
type QuizQuestionData = {
  id: string; // Or any unique identifier for the key
  question: string;
  answers: Answer[];
  correctAnswer: string;
  // Add other properties if your question objects have them (e.g., explanation)
};

type FlashcardCarouselProps = {
  quizQuestions: QuizQuestionData[] | undefined; // Array of questions to display
  currentIndex: number; // Current active index, controlled by parent
  onScrollIndexChange: (newIndex: number) => void; // To notify parent of scroll changes
  handleAnswerSelection: (answer: string) => void; // Passed down to each Flashcard
  totalQuestionsInQuiz: number;
  // Optional styling for carousel items
  itemWidth?: number;
  itemHeight?: number;
};

const FlashcardCarousel: React.FC<FlashcardCarouselProps> = ({
  quizQuestions,
  currentIndex,
  onScrollIndexChange,
  handleAnswerSelection,
  totalQuestionsInQuiz,
  itemWidth: propItemWidth,
  itemHeight: propItemHeight = DEFAULT_CARD_HEIGHT + 40, // Add some vertical margin space
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  // Default itemWidth to 90% of screen width if not provided
  const itemWidth = propItemWidth || screenWidth * 0.9;

  // Effect to scroll to the current index when it changes from parent
  useEffect(() => {
    if (scrollViewRef.current && quizQuestions!.length > 0) {
      scrollViewRef.current.scrollTo({
        x: currentIndex * itemWidth,
        animated: true,
      });
    }
  }, [currentIndex, itemWidth, quizQuestions!.length]);

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / itemWidth);
    if (newIndex !== currentIndex) {
      onScrollIndexChange(newIndex);
    }
  };

  if (!quizQuestions || quizQuestions.length === 0) {
    return (
      <View style={carouselStyles.emptyContainer}>
        <Text>No flashcards to display.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={true}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      style={[carouselStyles.scrollView, { height: propItemHeight }]}
      contentContainerStyle={carouselStyles.scrollViewContent}
      // Set initial scroll position if needed, though useEffect handles updates
      // contentOffset={{ x: currentIndex * itemWidth, y: 0 }} // Might cause issues with useEffect scroll
    >
      {quizQuestions.map((questionData, index) => (
        <View
          key={questionData.id || `flashcard-${index}`}
          style={[carouselStyles.carouselItemContainer, { width: itemWidth, height: propItemHeight }]}
        >
          <Flashcard
            question={questionData.question}
            answers={questionData.answers}
            correctAnswer={questionData.correctAnswer}
            currentQuestionIndex={index} // This card's own index
            selectedQuizAnswersAmount={totalQuestionsInQuiz} // Total in the set
            handleAnswerSelection={handleAnswerSelection}
            cardWidth={itemWidth * 0.95} // Make card slightly smaller than its container for spacing/shadow
            cardHeight={propItemHeight - 40} // Adjust based on container height, leave space for margins
          />
        </View>
      ))}
    </ScrollView>
  );
};

const carouselStyles = StyleSheet.create({
  scrollView: {
    // Height is set by propItemHeight
  },
  scrollViewContent: {
    alignItems: 'center', // Vertically center items if their height is less than ScrollView height
  },
  carouselItemContainer: {
    // width and height are set dynamically
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20, // Add some vertical padding around each card
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: DEFAULT_CARD_HEIGHT + 40,
  },
});

export default FlashcardCarousel;

// --- Example of how to use FlashcardCarousel in your TabOneScreen ---
/*
// In your TabOneScreen.tsx or similar:

// Make sure your selectedQuiz.questions matches QuizQuestionData structure
// (it likely already does or is very close)

// ... inside your TabOneScreen component's return, where you have flashcardsEnabled:

{flashcardsEnabled && selectedQuiz ? (
  <FlashcardCarousel
    quizQuestions={selectedQuiz.questions}
    currentIndex={currentQuestionIndex} // Your screen's current question index state
    onScrollIndexChange={(newIndex) => {
      // Update your screen's currentQuestionIndex state
      // This is crucial for syncing scroll with your app's state
      setCurrentQuestionIndex(newIndex);
      // You might also want to reset explanationMode or other states here
      setExplanationMode(false);
      setAnswerIsCorrect(false);
    }}
    handleAnswerSelection={handleAnswerSelection} // Your existing handler
    totalQuestionsInQuiz={selectedQuizAnswersAmount} // Your existing total
    // Optional:
    // itemWidth={Dimensions.get('window').width * 0.85} // Example custom width
    // itemHeight={300} // Example custom height
  />
) : (
  // Your Question component for multiple choice
  <Question
    question={selectedQuiz.questions[currentQuestionIndex].question}
    correctAnswer={selectedQuiz.questions[currentQuestionIndex].answer}
    answers={randomizedAnswers}
    currentQuestionIndex={currentQuestionIndex}
    selectedQuizAnswersAmount={selectedQuizAnswersAmount}
    handleAnswerSelection={handleAnswerSelection}
  />
)}

*/
