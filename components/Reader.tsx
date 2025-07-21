import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useReadAloud } from './useReadAloud';
import { CodeFormatter } from './CodeFormatter';
import { Quiz } from './types';

type ReaderProps = {
  quiz: Quiz;
  onBack: () => void;
};

const { height } = Dimensions.get('window');

export const Reader: React.FC<ReaderProps> = ({ quiz, onBack }) => {
  const { t } = useTranslation();
  const { readAloud, stopTTS, ttsState } = useReadAloud();
  const [isReading, setIsReading] = useState(false);

  // Generate the full text content for reading
  const generateReadingContent = () => {
    let content = `${t('quiz_title')}: ${quiz.name || quiz.nimi}. `;

    quiz.questions.forEach((question, index) => {
      content += `${t('question')} ${index + 1}: ${question.question}. `;
      // Add 5 second pause after question
      content += `<break time="5s"/> `;
      content += `${t('correct_answer_is')}: ${question.answer}. `;
      if (question.explanation) {
        content += `${t('show_explanation')}: ${question.explanation}. `;
      }
    });

    return content;
  };

  const handleReadAll = () => {
    if (isReading) {
      stopTTS();
      setIsReading(false);
    } else {
      const content = generateReadingContent();
      readAloud(content, undefined, 0.9, 2); // Slower reading speed with voice index 1
      setIsReading(true);
    }
  };

  const handleReadQuestion = (
    question: string,
    answer: string,
    explanation?: string,
  ) => {
    let content = `${question}. <break time="5s"/> ${t(
      'correct_answer_is',
    )}: ${answer}.`;
    if (explanation) {
      content += ` ${t('show_explanation')}: ${explanation}.`;
    }
    readAloud(content, undefined, 0.7, 1); // Slower reading speed with voice index 1
  };

  // Monitor TTS state to update our reading state
  useEffect(() => {
    if (ttsState === 'idle') {
      setIsReading(false);
    }
  }, [ttsState]);

  // Stop TTS when component unmounts
  useEffect(() => {
    return () => {
      stopTTS();
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

        <Text style={styles.title}>{quiz.name || quiz.nimi}</Text>

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

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {quiz.questions.map((question, index) => (
          <View key={index} style={styles.questionContainer}>
            {/* Question Card */}
            <View style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>
                  {t('question')} {index + 1}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    handleReadQuestion(
                      question.question,
                      question.answer,
                      question.explanation,
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
            <View style={styles.answerCard}>
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
              <View style={styles.explanationCard}>
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
});
