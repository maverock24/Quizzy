import React from 'react';
import { Animated, StyleSheet, Switch, Text, TouchableOpacity, View, Platform } from 'react-native';
import { CodeFormatter } from './CodeFormatter';
import { ScrollView } from 'react-native-gesture-handler';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useQuiz } from './Quizprovider';
import Tts from 'react-native-tts';

type ExplanationProps = {
  answerIsCorrect: boolean;
  explanation: string;
  currentQuestionIndex: number;
  selectedQuizAnswersAmount: number;
};

const { height } = Dimensions.get('window');

export const Explanation: React.FC<ExplanationProps> = ({
  answerIsCorrect,
  explanation,
  currentQuestionIndex,
  selectedQuizAnswersAmount,
}) => {

  const { flashcardsEnabled, setFlashcardsEnabled, showExplanation, setShowExplanation, audioEnabled, setAudioEnabled } = useQuiz();
  const { t, i18n } = useTranslation();

  const righOrWrong = answerIsCorrect ? t('correct') : t('wrong')

  const handleReadAloud = () => {
    // Get current language code (e.g., 'en', 'fi', 'de')
    const lang = i18n.language || 'en';
    // Map to BCP-47 for TTS (e.g., 'en-US', 'fi-FI', 'de-DE')
    const langMap: Record<string, string> = {
      en: 'en-US',
      fi: 'fi-FI',
      de: 'de-DE',
    };
    const ttsLang = langMap[lang] || 'en-US';
    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window) {
        // Improved chunking: only split at sentence boundaries, unless a sentence is very long
        const splitIntoChunks = (text: string, maxLen = 220) => {
          const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
          let chunks: string[] = [];
          for (let sentence of sentences) {
            sentence = sentence.trim();
            if (sentence.length <= maxLen) {
              chunks.push(sentence);
            } else {
              for (let i = 0; i < sentence.length; i += maxLen) {
                chunks.push(sentence.slice(i, i + maxLen));
              }
            }
          }
          return chunks.filter(Boolean);
        };
        const chunks = splitIntoChunks(righOrWrong + explanation, 220);
        let idx = 0;
        const speakChunk = (i: number) => {
          if (i >= chunks.length) return;
          const utterance = new window.SpeechSynthesisUtterance(chunks[i]);
          utterance.lang = ttsLang;
          utterance.rate = 1.0;
          utterance.onend = () => {
            setTimeout(() => speakChunk(i + 1), 80);
          };
          utterance.onerror = () => {
            setTimeout(() => speakChunk(i + 1), 80);
          };
          window.speechSynthesis.speak(utterance);
        };
        window.speechSynthesis.cancel();
        speakChunk(0);
      } else {
        alert('Text-to-speech is not supported in this browser.');
      }
      return;
    }
    // Native (iOS/Android)
    Tts.setDefaultLanguage(ttsLang);
    Tts.stop();
    Tts.speak(explanation);
  };

return (
  <View style={styles.contentContainer}>
    <ScrollView
              style={styles.explanationScroll}
              contentContainerStyle={{ flexGrow: 2, justifyContent: 'center' }}
              showsVerticalScrollIndicator={true}
            >
               <View style={styles.header}>
                          <Text style={styles.questionHeading}>
                            {t('question')} {currentQuestionIndex + 1} / {selectedQuizAnswersAmount}
                          </Text>
                          <View style={{ marginBottom: 10, flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: 50 }}>
                            <View style={styles.settingItem}>
                                          <Text style={styles.settingText}>{t('use_flashcards')}</Text>
                                          
                                        
                            
                                        <Switch
                                          trackColor={{ false: 'gray', true: 'white' }}
                                          thumbColor={
                                            flashcardsEnabled ? 'rgb(85, 101, 107)' : 'rgb(63, 65, 66)'
                                          }
                                          ios_backgroundColor="gray"
                                          onValueChange={setFlashcardsEnabled}
                                          value={flashcardsEnabled}
                                        />
                            </View>
                            <View style={styles.settingItem}>
              
                            <Text style={styles.settingText}>{t('show_explanation')}</Text>
              
              
                            <Switch
                              trackColor={{ false: 'gray', true: 'white' }}
                              thumbColor={'rgb(85, 101, 107)'}
                              ios_backgroundColor="gray"
                              onValueChange={setShowExplanation}
                              value={showExplanation}
                            />
                          </View>
                          <View style={styles.settingItem}>
              
                            <Text style={styles.settingText}>{t('enable_sound')}</Text>
              
              
                            <Switch
                              trackColor={{ false: 'gray', true: 'white' }}
                              thumbColor={'rgb(85, 101, 107)'}
                              ios_backgroundColor="gray"
                              onValueChange={setAudioEnabled}
                              value={audioEnabled}
                            />
                          </View>
                          </View>
                        </View>
                        
    <View
      style={[
        styles.card,
        {
          backgroundColor: answerIsCorrect
            ? 'rgb(71, 155, 62)'
            : 'rgb(161, 64, 64)',
        },
      ]}
    >
       <TouchableOpacity
      onPress={handleReadAloud}
      style={{ right:10, top: 10, marginLeft: 8, marginBottom: 8, position: 'absolute', zIndex:9999, borderRadius: 8, padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      accessibilityLabel="Read explanation aloud"
    >

      <FontAwesome
        name="comment"
        size={30}
        color="white"
       style={{ marginLeft: 8, marginTop: -5 }}
      />
    </TouchableOpacity>
      <Text style={styles.questionHeading}>
        {righOrWrong}
      </Text>
      <CodeFormatter
        text={explanation}
        containerStyle={{ marginTop: 8 }}
        textStyle={styles.normalText}
        codeBlockContainerStyle={{ backgroundColor: 'rgb(46, 50, 54)' }}
        codeBlockTextStyle={{ color: 'white' }}
      />
    </View>
    
    </ScrollView>
  </View>
);
}

const styles = StyleSheet.create({
    header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomColor: 'rgb(255, 255, 255)',
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingBottom: 18,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 5,
  },
  settingName: {
    flexDirection: 'column',
    flex: 1,
    paddingVertical: 10,
    marginRight: 10,
  },
  settingText: {
    marginRight: 10,
    fontSize: 12,
    color: 'white',
  },
   explanationScroll: {
    maxHeight: height * 0.7,
    marginBottom: 5,
  },
  contentContainer: {
  },
  card: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    paddingLeft: 36,
  },
  questionHeading: {
    alignContent: 'flex-end',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgb(212, 212, 212)',
  },
  normalText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'white',
  },
  button: {
    backgroundColor: 'rgb(86, 92, 99)',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
