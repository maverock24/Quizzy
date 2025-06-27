import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useQuiz } from './Quizprovider';
import { useTranslation } from 'react-i18next';

type SettingsHeaderProps = {
  currentQuestionIndex: number;
  selectedQuizAnswersAmount: number;
};

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  currentQuestionIndex,
  selectedQuizAnswersAmount,
}) => {
  const { flashcardsEnabled, setFlashcardsEnabled, showExplanation, setShowExplanation, audioEnabled, setAudioEnabled, musicEnabled, setMusicEnabled } = useQuiz();
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <View style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-evenly', height: 40 }}>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Music</Text>
          <Switch
            trackColor={{ false: 'gray', true: 'white' }}
            thumbColor={musicEnabled ? 'rgb(85, 101, 107)' : 'rgb(63, 65, 66)'}
            ios_backgroundColor="gray"
            onValueChange={setMusicEnabled}
            value={musicEnabled}
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
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>{t('use_flashcards')}</Text>
          <Switch
            trackColor={{ false: 'gray', true: 'white' }}
            thumbColor={flashcardsEnabled ? 'rgb(85, 101, 107)' : 'rgb(63, 65, 66)'}
            ios_backgroundColor="gray"
            onValueChange={setFlashcardsEnabled}
            value={flashcardsEnabled}
          />
        </View>
      </View>
      <Text style={styles.questionHeading}>
        {t('question')} {currentQuestionIndex + 1} / {selectedQuizAnswersAmount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderBottomColor: 'rgb(255, 255, 255)',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 5,
  },
  settingText: {
    marginRight: 10,
    fontSize: 12,
    color: 'white',
  },
  questionHeading: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgb(212, 212, 212)',
  },
});
