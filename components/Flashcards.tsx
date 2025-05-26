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

  return (
    <View style={{ width: cardWidth, height: cardHeight }}>
      <TouchableOpacity
        activeOpacity={1}
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
    </View>
  );
};

const flashcardStyles = StyleSheet.create({
  touchableContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
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
  handlerOnfinish: () => void;
  itemWidth?: number;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const NEXT_CARD_SCALE = 0.9;
const NEXT_CARD_OPACITY = 0.6;
const NEXT_CARD_Y_OFFSET =
  (DEFAULT_CARD_HEIGHT * (1 - NEXT_CARD_SCALE)) / 1.5 + 15;

const FlashcardCarousel: React.FC<FlashcardCarouselProps> = ({
  questions: initialQuestions,
  handlerOnfinish,
  itemWidth: propItemWidth,
}) => {
  const itemWidth = propItemWidth || SCREEN_WIDTH * 0.9;
  const cardWidth = itemWidth * 0.9;
  const cardHeight = DEFAULT_CARD_HEIGHT;

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deckSize, setDeckSize] = useState(0);

  const pan = useRef(new Animated.ValueXY()).current;
  const topCardRotate = pan.x.interpolate({
    inputRange: [-cardWidth / 2, 0, cardWidth / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });
  const topCardOpacity = useRef(new Animated.Value(1)).current;
  const topCardScale = useRef(new Animated.Value(1)).current;

  const nextCardScale = useRef(new Animated.Value(NEXT_CARD_SCALE)).current;
  const nextCardOpacity = useRef(new Animated.Value(NEXT_CARD_OPACITY)).current;
  const nextCardY = useRef(new Animated.Value(NEXT_CARD_Y_OFFSET)).current;

  useEffect(() => {
    const validQuestions = initialQuestions || [];
    setQuizQuestions(validQuestions);
    setDeckSize(validQuestions.length);
    setCurrentIndex(0);
    pan.setValue({ x: 0, y: 0 });
    topCardOpacity.setValue(1);
    topCardScale.setValue(1);
    nextCardScale.setValue(validQuestions.length > 1 ? NEXT_CARD_SCALE : 1);
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

  const SWIPE_THRESHOLD_X = cardWidth * 0.4;
  const SWIPE_THRESHOLD_Y = cardHeight * 0.3;
  const SWIPE_OUT_DURATION = 200;
  const SWIPE_DOWN_DURATION = 280;

  const resetTopCardAnimatedProperties = (
    isNextCardBecomingTop: boolean = false,
  ) => {
    pan.setValue({ x: 0, y: 0 });
    topCardOpacity.setValue(1);
    topCardScale.setValue(1);

    if (isNextCardBecomingTop) {
      nextCardScale.setValue(deckSize > 1 ? NEXT_CARD_SCALE : 1);
      nextCardOpacity.setValue(deckSize > 1 ? NEXT_CARD_OPACITY : 1);
      nextCardY.setValue(deckSize > 1 ? NEXT_CARD_Y_OFFSET : 0);
    }
  };

  const animateNextCardToTop = () => {
    if (deckSize > 1) {
      Animated.parallel([
        Animated.spring(nextCardScale, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(nextCardOpacity, {
          toValue: 1,
          duration: SWIPE_OUT_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(nextCardY, {
          toValue: 0,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const processCardChange = (keep: boolean) => {
    if (quizQuestions.length === 0) {
      handlerOnfinish();
      return;
    }
    let newQuestionsArray = [...quizQuestions];
    let newDeckSize = deckSize;
    let newCurrentIndex = currentIndex;

    if (!keep) {
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
      const cardToKeep = newQuestionsArray.splice(currentIndex, 1)[0];
      newQuestionsArray.push(cardToKeep);
      newCurrentIndex =
        currentIndex >= newDeckSize - 1 && newDeckSize > 0 ? 0 : currentIndex;
      if (newDeckSize === 1) newCurrentIndex = 0;
    }
    setQuizQuestions(newQuestionsArray);
    setDeckSize(newDeckSize);
    setCurrentIndex(newCurrentIndex);
    resetTopCardAnimatedProperties(true);
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: pan.x, translationY: pan.y } }],
    { useNativeDriver: true },
  );

  const handleKeepActionAnimation = (onComplete: () => void) => {
    if (deckSize > 1) animateNextCardToTop();
    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: 0, y: NEXT_CARD_Y_OFFSET + cardHeight * 0.2 },
        duration: SWIPE_DOWN_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(topCardOpacity, {
        toValue: NEXT_CARD_OPACITY * 0.7,
        duration: SWIPE_DOWN_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(topCardScale, {
        toValue: NEXT_CARD_SCALE * 0.9,
        duration: SWIPE_DOWN_DURATION,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  };

  const handleGestureStateChange = (
    event: PanGestureHandlerStateChangeEvent,
  ) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX, velocityY } =
        event.nativeEvent;
      let actionTaken = false;

      if (
        translationX < -SWIPE_THRESHOLD_X ||
        (velocityX < -0.5 && translationX < -SWIPE_THRESHOLD_X / 2)
      ) {
        actionTaken = true;
        if (deckSize > 1) animateNextCardToTop();
        Animated.parallel([
          Animated.timing(pan, {
            toValue: { x: -itemWidth * 1.1, y: translationY + velocityY * 30 },
            duration: SWIPE_OUT_DURATION,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(topCardOpacity, {
            toValue: 0,
            duration: SWIPE_OUT_DURATION * 0.8,
            useNativeDriver: true,
          }),
        ]).start(() => processCardChange(false));
      } else if (
        translationY > SWIPE_THRESHOLD_Y ||
        (velocityY > 0.5 && translationY > SWIPE_THRESHOLD_Y / 2)
      ) {
        actionTaken = true;
        handleKeepActionAnimation(() => processCardChange(true));
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
              selectedQuizAnswersAmount={deckSize}
              cardIsFlipped={false}
              keepCardAndGoToNext={() => {}}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
            />
          </Animated.View>
        )}
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
              cardIsFlipped={false}
              keepCardAndGoToNext={() =>
                handleKeepActionAnimation(() => processCardChange(true))
              }
              cardWidth={cardWidth}
              cardHeight={cardHeight}
            />
          </Animated.View>
        </PanGestureHandler>
        {topCardData && (
          <TouchableOpacity
            style={carouselStyles.keepButton}
            onPress={() =>
              handleKeepActionAnimation(() => processCardChange(true))
            }
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
  },
  nextCardPosition: {},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keepButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  keepButtonText: {
    marginLeft: 10,
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
});

export default FlashcardCarousel;
