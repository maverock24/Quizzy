import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerStateChangeEvent,
  State,
} from 'react-native-gesture-handler';

// --- FlashcardProps and Flashcard component (Assume it's the same as your latest working version) ---
type Answer = {
  answer: string;
};

type FlashcardProps = {
  cardIsFlipped: boolean;
  question: string;
  selectedQuizAnswersAmount: number;
  keepCardAndGoToNext: () => void; // This might be simplified or removed if all interaction is via swipe
  correctAnswer: string;
  cardWidth?: number;
  cardHeight?: number;
  isTopCard?: boolean; // To differentiate styling/behavior if needed, though not used for now
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

  function handleKeepCardViaButton(): void {
    // This function is for the button press specifically
    keepCardAndGoToNext();
  }

  return (
    // The main container for a single flashcard instance
    <View style={{ width: cardWidth, height: cardHeight }}>
      <TouchableOpacity
        activeOpacity={1} // Gestures are handled by PanGestureHandler, allow flip on press
        onPress={handleLocalFlip}
        style={[flashcardStyles.touchableContainer]}
      >
        <Animated.View
          style={[
            flashcardStyles.card,
            flashcardStyles.cardFace,
            animatedFrontStyle,
            {
              backgroundColor: '#4A90E2',
              width: cardWidth,
              height: cardHeight,
            },
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
            {
              backgroundColor: 'rgb(17, 205, 45)',
              width: cardWidth,
              height: cardHeight,
            },
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
      {/* "Keep" button is now outside individual Flashcard, part of Carousel controls if needed */}
    </View>
  );
};

const flashcardStyles = StyleSheet.create({
  touchableContainer: {
    // This now fills the passed cardWidth/cardHeight
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    // Dimensions are passed as style props now
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // For Android shadow
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

// --- QuizQuestionData type ---
type QuizQuestionData = {
  id: string;
  question: string;
  answers: Answer[];
  correctAnswer: string;
};

type FlashcardCarouselProps = {
  questions: QuizQuestionData[] | undefined;
  handlerOnfinish: () => void;
  // totalQuestions: number; // Can be derived from initialQuestions.length
  itemWidth?: number; // Width of the carousel area for one card
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const NEXT_CARD_SCALE = 0.9;
const NEXT_CARD_OPACITY = 0.7;
const NEXT_CARD_Y_OFFSET =
  (DEFAULT_CARD_HEIGHT * (1 - NEXT_CARD_SCALE)) / 2 + 10; // For visual stacking

const FlashcardCarousel: React.FC<FlashcardCarouselProps> = ({
  questions: initialQuestions,
  handlerOnfinish,
  itemWidth: propItemWidth,
}) => {
  const itemWidth = propItemWidth || SCREEN_WIDTH * 0.9; // Width of the area for one card
  const cardWidth = itemWidth * 0.9; // Actual flashcard width, allowing for some side padding
  const cardHeight = DEFAULT_CARD_HEIGHT;

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Index of the top card
  const [deckSize, setDeckSize] = useState(0); // Total cards currently in the interactive deck

  // Animation values for the TOP card
  const pan = useRef(new Animated.ValueXY()).current;
  const topCardRotate = pan.x.interpolate({
    inputRange: [-cardWidth / 2, 0, cardWidth / 2],
    outputRange: ['-8deg', '0deg', '8deg'], // Reduced rotation
    extrapolate: 'clamp',
  });
  const topCardOpacity = useRef(new Animated.Value(1)).current;
  const topCardScale = useRef(new Animated.Value(1)).current;

  // Animation values for the NEXT card (the one visually underneath)
  const nextCardScale = useRef(new Animated.Value(NEXT_CARD_SCALE)).current;
  const nextCardOpacity = useRef(new Animated.Value(NEXT_CARD_OPACITY)).current;
  const nextCardY = useRef(new Animated.Value(NEXT_CARD_Y_OFFSET)).current;

  useEffect(() => {
    const validQuestions = initialQuestions || [];
    setQuizQuestions(validQuestions);
    setDeckSize(validQuestions.length);
    setCurrentIndex(0);
    // Reset all animated values for a new deck
    pan.setValue({ x: 0, y: 0 });
    topCardOpacity.setValue(1);
    topCardScale.setValue(1);
    nextCardScale.setValue(validQuestions.length > 1 ? NEXT_CARD_SCALE : 1); // If only one card, next is not scaled
    nextCardOpacity.setValue(validQuestions.length > 1 ? NEXT_CARD_OPACITY : 1);
    nextCardY.setValue(validQuestions.length > 1 ? NEXT_CARD_Y_OFFSET : 0);
  }, [
    initialQuestions,
    pan,
    topCardOpacity,
    topCardScale,
    nextCardScale,
    nextCardOpacity,
    nextCardY,
  ]);

  const topCardData = quizQuestions[currentIndex];
  const nextCardVisualIndex =
    deckSize > 1 ? (currentIndex + 1) % deckSize : null;
  const nextCardData =
    nextCardVisualIndex !== null ? quizQuestions[nextCardVisualIndex] : null;

  const SWIPE_THRESHOLD_X = cardWidth * 0.4; // Need to swipe further horizontally
  const SWIPE_THRESHOLD_Y = cardHeight * 0.3;
  const SWIPE_OUT_DURATION = 200;

  const resetTopCardAnimatedProperties = (
    isNextCardBecomingTop: boolean = false,
  ) => {
    pan.setValue({ x: 0, y: 0 });
    topCardOpacity.setValue(1);
    topCardScale.setValue(1);

    if (isNextCardBecomingTop) {
      // The "next" card's animated values become the "top" card's initial values
      nextCardScale.setValue(deckSize > 1 ? NEXT_CARD_SCALE : 1); // Reset for the new "next"
      nextCardOpacity.setValue(deckSize > 1 ? NEXT_CARD_OPACITY : 1);
      nextCardY.setValue(deckSize > 1 ? NEXT_CARD_Y_OFFSET : 0);
    }
  };

  const animateNextCardToTop = () => {
    if (deckSize > 1) {
      // Only animate if there was a next card
      Animated.parallel([
        Animated.spring(nextCardScale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(nextCardOpacity, {
          toValue: 1,
          duration: SWIPE_OUT_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.spring(nextCardY, {
          toValue: 0,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const processCardChange = (keep: boolean) => {
    if (quizQuestions.length === 0) {
      // Should be caught by deckSize check too
      handlerOnfinish();
      return;
    }

    let newQuestionsArray = [...quizQuestions];
    let newDeckSize = deckSize;
    let newCurrentIndex = currentIndex;

    if (!keep) {
      // Discard
      newQuestionsArray.splice(currentIndex, 1);
      newDeckSize--;
      if (newDeckSize === 0) {
        setQuizQuestions([]);
        setDeckSize(0);
        handlerOnfinish();
        return;
      }
      newCurrentIndex = currentIndex >= newDeckSize ? 0 : currentIndex;
    } else {
      // Keep
      const cardToKeep = newQuestionsArray.splice(currentIndex, 1)[0];
      newQuestionsArray.push(cardToKeep);
      // Deck size remains the same
      // Current index logic: if we kept the "last" card in sequence, next is 0. Otherwise, it's the same.
      newCurrentIndex =
        currentIndex >= newDeckSize - 1 && newDeckSize > 0 ? 0 : currentIndex;
      if (newDeckSize === 1) newCurrentIndex = 0; // If only one card, it's always index 0
    }

    setQuizQuestions(newQuestionsArray);
    setDeckSize(newDeckSize);
    setCurrentIndex(newCurrentIndex);
    resetTopCardAnimatedProperties(true); // Reset for the new top card and setup next card visuals
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: pan.x, translationY: pan.y } }],
    { useNativeDriver: true },
  );

  const handleGestureStateChange = (
    event: PanGestureHandlerStateChangeEvent,
  ) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX, velocityY } =
        event.nativeEvent;
      let actionTaken = false;

      // Swipe Left (Discard)
      if (
        translationX < -SWIPE_THRESHOLD_X ||
        (velocityX < -0.5 && translationX < -SWIPE_THRESHOLD_X / 2)
      ) {
        actionTaken = true;
        if (deckSize > 1) animateNextCardToTop(); // Next card starts coming up
        Animated.parallel([
          Animated.timing(pan, {
            toValue: { x: -itemWidth * 1.1, y: translationY + velocityY * 30 }, // Move just beyond itemWidth
            duration: SWIPE_OUT_DURATION,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(topCardOpacity, {
            // Fade out as it exits
            toValue: 0,
            duration: SWIPE_OUT_DURATION * 0.8,
            useNativeDriver: true,
          }),
        ]).start(() => processCardChange(false));
      }
      // Swipe Down (Keep)
      else if (
        translationY > SWIPE_THRESHOLD_Y ||
        (velocityY > 0.5 && translationY > SWIPE_THRESHOLD_Y / 2)
      ) {
        actionTaken = true;
        if (deckSize > 1) animateNextCardToTop(); // Next card starts coming up
        Animated.parallel([
          Animated.timing(pan, {
            toValue: { x: translationX + velocityX * 30, y: cardHeight * 0.6 }, // Move down moderately
            duration: SWIPE_OUT_DURATION * 1.2,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(topCardOpacity, {
            toValue: 0, // Fade out more completely
            duration: SWIPE_OUT_DURATION * 1.2,
            useNativeDriver: true,
          }),
          Animated.timing(topCardScale, {
            toValue: 0.8, // Scale down
            duration: SWIPE_OUT_DURATION * 1.2,
            useNativeDriver: true,
          }),
        ]).start(() => processCardChange(true));
      }

      if (!actionTaken) {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  if (!topCardData) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={carouselStyles.emptyContainer}>
          <Text>Loading or no more flashcards...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  const topCardAnimatedStyle = {
    opacity: topCardOpacity,
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { rotate: topCardRotate },
      { scale: topCardScale },
    ],
  };

  const nextCardAnimatedStyle = {
    opacity: nextCardOpacity,
    transform: [{ translateY: nextCardY }, { scale: nextCardScale }],
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[carouselStyles.container, { width: itemWidth }]}>
        {/* Next Card (Visually Underneath) */}
        {nextCardData && deckSize > 1 && (
          <Animated.View
            style={[
              carouselStyles.cardWrapper,
              carouselStyles.nextCardPosition,
              nextCardAnimatedStyle,
            ]}
            key={`${nextCardData.id}-next`}
          >
            <Flashcard
              {...nextCardData}
              selectedQuizAnswersAmount={deckSize} // Or adjust as needed
              cardIsFlipped={false} // Next card should always be question side
              keepCardAndGoToNext={() => {}} // Not interactive
              cardWidth={cardWidth}
              cardHeight={cardHeight}
            />
          </Animated.View>
        )}

        {/* Top Card (Interactive) */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={handleGestureStateChange}
          activeOffsetX={[-10, 10]}
          activeOffsetY={[-10, 10]}
        >
          <Animated.View
            style={[carouselStyles.cardWrapper, topCardAnimatedStyle]}
            key={topCardData.id}
          >
            <Flashcard
              {...topCardData}
              selectedQuizAnswersAmount={deckSize}
              cardIsFlipped={false} // Flip is internal to Flashcard
              keepCardAndGoToNext={() => {
                // For a potential button
                if (deckSize > 1) animateNextCardToTop();
                Animated.parallel([
                  /* ... swipe down animation ... */
                ]).start(() => processCardChange(true));
              }}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
            />
          </Animated.View>
        </PanGestureHandler>
        {/* "Keep" button for the TOP card, positioned absolutely within the carousel container */}
        {topCardData && (
          <TouchableOpacity
            style={carouselStyles.keepButton}
            onPress={() => {
              if (deckSize > 1) animateNextCardToTop();
              // Replicate swipe down animation for button press
              Animated.parallel([
                Animated.timing(pan, {
                  toValue: { x: 0, y: cardHeight * 0.6 },
                  duration: SWIPE_OUT_DURATION * 1.2,
                  useNativeDriver: true,
                }),
                Animated.timing(topCardOpacity, {
                  toValue: 0,
                  duration: SWIPE_OUT_DURATION * 1.2,
                  useNativeDriver: true,
                }),
                Animated.timing(topCardScale, {
                  toValue: 0.8,
                  duration: SWIPE_OUT_DURATION * 1.2,
                  useNativeDriver: true,
                }),
              ]).start(() => processCardChange(true));
            }}
          >
            <FontAwesome name="arrow-down" size={24} color="gray" />
            <Text style={carouselStyles.keepButtonText}>Keep</Text>
          </TouchableOpacity>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const carouselStyles = StyleSheet.create({
  container: {
    // This is the main carousel area
    flex: 1, // Take up available space if parent allows, or set fixed height
    justifyContent: 'center', // Center cards vertically if flex > 0
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden', // Important for swipe left animation boundary
    position: 'relative', // For absolute positioning of next card and keep button
  },
  cardWrapper: {
    // Common wrapper for positioning cards in the center
    position: 'absolute', // All cards are absolutely positioned to stack
    // Centering will be handled by parent 'container' alignItems/justifyContent
    // If parent container has fixed dimensions, cards will be centered within it.
  },
  nextCardPosition: {
    // Specific styling for the card underneath
    // It's already scaled and opacity set by Animated values
    // zIndex: -1, // Could be used, but animation order should handle visual stacking
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keepButton: {
    position: 'absolute',
    bottom: 20, // Position at the bottom of the carousel container
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  keepButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default FlashcardCarousel;
