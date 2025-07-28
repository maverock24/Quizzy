import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CodeFormatter } from './CodeFormatter';
import { Quiz } from './types';
import { useReadAloud } from './useReadAloud';

type ReaderProps = {
  quiz: Quiz;
  onBack: () => void;
};

const { height } = Dimensions.get('window');

export const Reader: React.FC<ReaderProps> = ({ quiz, onBack }) => {
  const { t } = useTranslation();
  const { readAloud, stopTTS, ttsState } = useReadAloud();
  const [isReading, setIsReading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startFromQuestion, setStartFromQuestion] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const progressTimeout = useRef<NodeJS.Timeout | null>(null);
  const isReadingRef = useRef(false);
  const currentQuestionRef = useRef(0);
  const startFromQuestionRef = useRef(0);
  const questionRefs = useRef<(View | null)[]>([]);
  const questionProgressRef = useRef<
    { questionIndex: number; startTime: number }[]
  >([]);

  // Generate the full text content for reading starting from a specific question
  const generateReadingContent = (startIndex: number = 0) => {
    console.log(
      'generateReadingContent called with startIndex:',
      startIndex,
      'type:',
      typeof startIndex,
    );
    let content = '';

    // Ensure startIndex is a number
    const numericStartIndex = Number(startIndex);

    // Only add quiz title if starting from the beginning
    if (numericStartIndex === 0) {
      content = `${t('quiz_title')}: ${quiz.name}. `;
    }

    for (let i = numericStartIndex; i < quiz.questions.length; i++) {
      const question = quiz.questions[i];
      const questionNumber = i + 1;
      console.log(
        `Processing question index ${i}, question number ${questionNumber}`,
      );
      // Use the actual question number (i + 1) not a calculated one
      content += `${t('question')} ${questionNumber}: ${question.question}. `;
      // Add 5 second pause after question
      content += `<break time="3s"/> `;
      content += `${t('correct_answer_is')}: ${question.answer}. `;
      if (question.explanation) {
        content += `${t('show_explanation')}: ${question.explanation}. `;
      }
      // Add pause between questions
      if (i < quiz.questions.length - 1) {
        content += `<break time="3s"/> `;
      }
    }

    return content;
  };

  // Scroll to a specific question and position it at the top
  const scrollToQuestion = (index: number) => {
    console.log('Scrolling to question:', index + 1);

    if (!scrollViewRef.current || index < 0 || index >= quiz.questions.length) {
      console.log('Invalid scroll request for index:', index);
      return;
    }

    // Use measureLayout to get the actual position of the question element
    const questionRef = questionRefs.current[index];
    if (questionRef) {
      questionRef.measureLayout(
        scrollViewRef.current.getInnerViewNode(),
        (x, y, width, height) => {
          // Scroll to the question with a small offset to position it near the top
          const offsetY = Math.max(0, y - 100); // 100px from top of viewport
          scrollViewRef.current?.scrollTo({
            y: offsetY,
            animated: true,
          });
          console.log(
            `Scrolled to measured position: ${offsetY} for question ${
              index + 1
            }`,
          );
        },
        () => {
          console.log('Error measuring layout');
          // Fallback to simple estimation
          const fallbackY = index * 250;
          scrollViewRef.current?.scrollTo({
            y: fallbackY,
            animated: true,
          });
        },
      );
    } else {
      // Fallback if ref is not available
      const fallbackY = index * 250;
      scrollViewRef.current.scrollTo({
        y: fallbackY,
        animated: true,
      });
      console.log(`Fallback scroll to: ${fallbackY} for question ${index + 1}`);
    }
  };

  const handleReadAll = () => {
    if (isReading) {
      stopTTS();
      setIsReading(false);
      isReadingRef.current = false;
      setCurrentQuestionIndex(startFromQuestionRef.current);
      currentQuestionRef.current = startFromQuestionRef.current;
      if (progressTimeout.current) {
        clearTimeout(progressTimeout.current);
        progressTimeout.current = null;
      }
    } else {
      const content = generateReadingContent(startFromQuestion);
      console.log(
        'Starting reading from question:',
        startFromQuestion + 1,
        'startFromQuestion type:',
        typeof startFromQuestion,
        'value:',
        startFromQuestion,
      );
      console.log('Total questions in quiz:', quiz.questions.length);

      // Set initial state - currentQuestionIndex should match the starting question
      setCurrentQuestionIndex(startFromQuestion);
      currentQuestionRef.current = startFromQuestion;
      startFromQuestionRef.current = startFromQuestion;
      isReadingRef.current = true;
      setIsReading(true);

      console.log(
        'Initial state set - currentQuestionIndex:',
        startFromQuestion,
      );

      // Scroll to starting question immediately
      setTimeout(() => {
        console.log('Initial scroll to question:', startFromQuestion + 1);
        scrollToQuestion(startFromQuestion);
      }, 200);

      // Start reading
      readAloud(content, undefined, 0.9, 0);

      // Clear any existing timeout
      if (progressTimeout.current) {
        clearTimeout(progressTimeout.current);
      }

      // Use a recursive function that properly updates state
      const scheduleNextQuestionUpdate = (currentIndex: number) => {
        if (
          !isReadingRef.current ||
          currentIndex >= quiz.questions.length - 1
        ) {
          return;
        }

        const nextIndex = currentIndex + 1;

        // Calculate balanced timing based on content length
        const currentQuestion = quiz.questions[currentIndex];
        const questionWords = currentQuestion.question.split(' ').length;
        const answerWords = currentQuestion.answer.split(' ').length;
        const explanationWords = currentQuestion.explanation
          ? currentQuestion.explanation.split(' ').length
          : 0;

        // Balanced reading time estimation - slower pace for better comprehension
        const totalWords = questionWords + answerWords + explanationWords;
        const readingTimeSeconds = Math.max(8, (totalWords / 120) * 60); // Slower: 120 words per minute
        const pauseTime = 8; // 5s after question + 3s between questions
        const totalTime = (readingTimeSeconds + pauseTime) * 1000; // Convert to milliseconds

        // Add small buffer time
        const bufferTime = 6500; // 6.5 second buffer
        const finalTime = totalTime + bufferTime;

        console.log(
          `Question ${
            currentIndex + 1
          }: ${totalWords} words, estimated ${readingTimeSeconds}s + ${pauseTime}s pause + 2s buffer = ${
            finalTime / 1000
          }s total`,
        );

        progressTimeout.current = setTimeout(() => {
          if (!isReadingRef.current) {
            return;
          }

          console.log('Moving to question:', nextIndex + 1);
          console.log('Setting currentQuestionIndex to:', nextIndex);
          setCurrentQuestionIndex(nextIndex);
          currentQuestionRef.current = nextIndex;

          // Scroll to the question with a delay to ensure state update
          setTimeout(() => scrollToQuestion(nextIndex), 100);

          // Schedule the next question
          scheduleNextQuestionUpdate(nextIndex);
        }, finalTime);
      };

      // Start progression if not the last question
      if (startFromQuestion < quiz.questions.length - 1) {
        scheduleNextQuestionUpdate(startFromQuestion);
      }
    }
  };

  const handleReadQuestion = (
    question: string,
    answer: string,
    explanation?: string,
    questionIndex?: number,
  ) => {
    let content = `${question}. <break time="5s"/> ${t(
      'correct_answer_is',
    )}: ${answer}.`;
    if (explanation) {
      content += ` ${t('show_explanation')}: ${explanation}.`;
    }

    // Scroll to the question being read
    if (questionIndex !== undefined) {
      setCurrentQuestionIndex(questionIndex);
      scrollToQuestion(questionIndex);
    }

    readAloud(content, undefined, 0.9, 0);
  };

  // Monitor TTS state to update our reading state
  useEffect(() => {
    if (ttsState === 'idle' && isReading) {
      console.log('TTS finished, stopping reading');
      setIsReading(false);
      isReadingRef.current = false;
      setCurrentQuestionIndex(startFromQuestionRef.current);
      currentQuestionRef.current = startFromQuestionRef.current;
      if (progressTimeout.current) {
        clearTimeout(progressTimeout.current);
        progressTimeout.current = null;
      }
    }
  }, [ttsState, isReading]);

  // Debug log for currentQuestionIndex changes
  useEffect(() => {
    console.log(
      'Progress display - currentQuestionIndex:',
      currentQuestionIndex,
      'startFromQuestion:',
      startFromQuestion,
    );
  }, [currentQuestionIndex, startFromQuestion]);

  // Stop TTS when component unmounts
  useEffect(() => {
    return () => {
      stopTTS();
      isReadingRef.current = false;
      currentQuestionRef.current = startFromQuestionRef.current;
      if (progressTimeout.current) {
        clearTimeout(progressTimeout.current);
      }
    };
  }, [stopTTS]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={24} color="white" />
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{quiz.name}</Text>

        <TouchableOpacity onPress={handleReadAll} style={styles.readAllButton}>
          <FontAwesome
            name={isReading ? 'stop' : 'play'}
            size={20}
            color="white"
          />
          <Text style={styles.readAllButtonText}>
            {isReading ? t('stop') : t('read_aloud')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Start From Question Selector */}
      {!isReading && (
        <View style={styles.controlsContainer}>
          <Text style={styles.controlLabel}>Start from question:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={startFromQuestion}
              onValueChange={(value: number) => {
                console.log(
                  'Picker selected value:',
                  value,
                  'type:',
                  typeof value,
                );
                setStartFromQuestion(Number(value));
              }}
              style={styles.picker}
              dropdownIconColor="black"
            >
              {quiz.questions.map((_, index) => (
                <Picker.Item
                  key={index}
                  label={`${t('question')} ${index + 1}`}
                  value={index}
                />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Reading Progress Indicator */}
      {isReading && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Currently reading: {t('question')} {currentQuestionIndex + 1} of{' '}
            {quiz.questions.length}
          </Text>
        </View>
      )}

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {quiz.questions.map((question, index) => (
          <View
            key={index}
            style={styles.questionContainer}
            ref={(ref) => (questionRefs.current[index] = ref)}
          >
            {/* Question Card */}
            <View
              style={[
                styles.questionCard,
                isReading &&
                  currentQuestionIndex === index &&
                  styles.currentQuestionCard,
              ]}
            >
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>
                  {t('question')} {index + 1}
                  {isReading && currentQuestionIndex === index && (
                    <Text style={styles.readingIndicator}> 🔊 READING NOW</Text>
                  )}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    handleReadQuestion(
                      question.question,
                      question.answer,
                      question.explanation,
                      index,
                    )
                  }
                  style={styles.readButton}
                >
                  <FontAwesome name="volume-up" size={16} color="white" />
                </TouchableOpacity>
              </View>

              <CodeFormatter
                text={question.question}
                containerStyle={styles.questionTextContainer}
                textStyle={styles.questionText}
                codeBlockContainerStyle={styles.codeBlock}
                codeBlockTextStyle={styles.codeText}
              />
            </View>

            {/* Answer Card */}
            <View
              style={[
                styles.answerCard,
                isReading &&
                  currentQuestionIndex === index &&
                  styles.currentAnswerCard,
              ]}
            >
              <Text style={styles.answerLabel}>{t('correct_answer_is')}:</Text>
              <CodeFormatter
                text={question.answer}
                containerStyle={styles.answerTextContainer}
                textStyle={styles.answerText}
                codeBlockContainerStyle={styles.codeBlock}
                codeBlockTextStyle={styles.codeText}
              />
            </View>

            {/* Explanation Card (if available) */}
            {question.explanation && (
              <View
                style={[
                  styles.explanationCard,
                  isReading &&
                    currentQuestionIndex === index &&
                    styles.currentExplanationCard,
                ]}
              >
                <Text style={styles.explanationLabel}>
                  {t('show_explanation')}:
                </Text>
                <CodeFormatter
                  text={question.explanation}
                  containerStyle={styles.explanationTextContainer}
                  textStyle={styles.explanationText}
                  codeBlockContainerStyle={styles.codeBlock}
                  codeBlockTextStyle={styles.codeText}
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomColor: 'rgb(255, 255, 255)',
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  readAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(46, 150, 194)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  readAllButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionCard: {
    backgroundColor: 'rgb(37, 106, 158)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  readButton: {
    padding: 4,
  },
  questionTextContainer: {
    marginTop: 0,
  },
  questionText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
  answerCard: {
    backgroundColor: 'rgb(71, 155, 62)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  answerLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  answerTextContainer: {
    marginTop: 0,
  },
  answerText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  explanationCard: {
    backgroundColor: 'rgb(86, 92, 99)',
    padding: 16,
    borderRadius: 8,
  },
  explanationLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  explanationTextContainer: {
    marginTop: 0,
  },
  explanationText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
  },
  codeBlock: {
    backgroundColor: 'rgb(46, 50, 54)',
    marginVertical: 4,
  },
  codeText: {
    color: 'white',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlLabel: {
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 5,
    maxWidth: 200,
  },
  picker: {
    height: 40,
    color: 'black',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(46, 150, 194, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 150, 194, 0.3)',
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  currentQuestionCard: {
    backgroundColor: 'rgb(46, 150, 194)', // Highlighted color for current question
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: 'white',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  currentAnswerCard: {
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: 'white',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  currentExplanationCard: {
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: 'white',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  readingIndicator: {
    color: 'yellow',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 0, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
});
