import { useQuiz } from '@/components/Quizprovider';
import { Button } from '@/components/ui/button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const {
    resetState,
    flashcardsEnabled,
    setFlashcardsEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    showExplanation,
    setShowExplanation,
    audioEnabled,
    setAudioEnabled,
    setLanguage,
    userQuizLoadEnabled,
    setUserQuizLoadEnabled,
    readerModeEnabled,
    setReaderModeEnabled,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    textInputAnswerMode,
    setTextInputAnswerMode,
  } = useQuiz();

  const { t, i18n } = useTranslation();

  const [userQuizModalVisible, setUserQuizModalVisible] = React.useState(false);
  const [userQuizJson, setUserQuizJson] = React.useState('');
  const [isUserQuizLoadEnabled, setIsUserQuizLoadEnabled] = React.useState(
    false,
  );

  // Load userQuizLoadEnabled from AsyncStorage on mount
  React.useEffect(() => {
    (async () => {
      const enabled = await AsyncStorage.getItem('userQuizLoadEnabled');
      setUserQuizLoadEnabled(enabled === 'true');
    })();
  }, []);

  // Save userQuizLoadEnabled to AsyncStorage
  const handleUserQuizLoadSwitch = async (val: boolean) => {
    setUserQuizLoadEnabled(val);
    await AsyncStorage.setItem('userQuizLoadEnabled', String(val));
  };

  // Open modal and load or create user quizzes from AsyncStorage
  const handleOpenUserQuizModal = async () => {
    let content = '';
    try {
      // Try to load from AsyncStorage
      const stored = await AsyncStorage.getItem('userQuizzes');
      if (stored) {
        content = stored;
      } else {
        // If not found, use default quiz template
        content = JSON.stringify(
          [
            {
              name: 'User Quiz',
              questions: [
                {
                  question: 'What is 2+2?',
                  answers: [{ answer: '3' }, { answer: '4' }, { answer: '5' }],
                  answer: '4',
                  explanation: '2+2=4',
                },
              ],
            },
          ],
          null,
          2,
        );
        await AsyncStorage.setItem('userQuizzes', content);
      }
      setUserQuizJson(content);
      setUserQuizModalVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to load or create user quizzes');
    }
  };

  // Save user quiz JSON to AsyncStorage
  const handleSaveUserQuizJson = async () => {
    try {
      await AsyncStorage.setItem('userQuizzes', userQuizJson);
      setUserQuizLoadEnabled(!userQuizLoadEnabled);
      setUserQuizLoadEnabled(!userQuizLoadEnabled);
      setUserQuizModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save user quizzes');
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.heading}>{t('settings')}</Text>
          {/* Language Switcher */}
          <View style={styles.settingItem}>
            <Text style={[styles.label, { flex: 1 }]}>{t('language')}</Text>
            <View
              style={{
                flex: 1,
                marginLeft: 10,
                backgroundColor: 'white',
                borderRadius: 5,
                width: '50%',
              }}
            >
              <Picker
                selectedValue={i18n.language}
                onValueChange={(lang: string) => setLanguage(lang)}
                style={{ height: 30, color: 'black' }}
                dropdownIconColor="black"
              >
                <Picker.Item label={t('english')} value="en" />
                <Picker.Item label={t('german')} value="de" />
                <Picker.Item label={t('finnish')} value="fi" />
              </Picker>
            </View>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>
                {t('enable_notifications')}
              </Text>
              <Text style={styles.settingDescription}>
                {t('enable_notifications_desc')}
              </Text>
            </View>

            <Switch
              trackColor={{ false: 'gray', true: 'white' }}
              thumbColor={
                notificationsEnabled ? 'rgb(85, 101, 107)' : 'rgb(63, 65, 66)'
              }
              ios_backgroundColor="gray"
              onValueChange={setNotificationsEnabled}
              value={notificationsEnabled}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>{t('use_flashcards')}</Text>
              <Text style={styles.settingDescription}>
                {t('use_flashcards_desc')}
              </Text>
            </View>

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
            <View style={styles.settingName}>
              <Text style={styles.settingText}>{t('show_explanation')}</Text>
              <Text style={styles.settingDescription}>
                {t('show_explanation_desc')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: 'gray', true: 'white' }}
              thumbColor={
                showExplanation ? 'rgb(85, 101, 107)' : 'rgb(63, 65, 66)'
              }
              ios_backgroundColor="gray"
              onValueChange={setShowExplanation}
              value={showExplanation}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>{t('enable_sound')}</Text>
              <Text style={styles.settingDescription}>
                {t('enable_sound_desc')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: 'gray', true: 'white' }}
              thumbColor={'rgb(85, 101, 107)'}
              ios_backgroundColor="gray"
              onValueChange={setAudioEnabled}
              value={audioEnabled}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>{t('reader_mode')}</Text>
              <Text style={styles.settingDescription}>
                {t('reader_mode_desc')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: 'gray', true: 'white' }}
              thumbColor={'rgb(85, 101, 107)'}
              ios_backgroundColor="gray"
              onValueChange={setReaderModeEnabled}
              value={readerModeEnabled}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>{t('text_input_mode')}</Text>
              <Text style={styles.settingDescription}>
                {t('text_input_mode_desc')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: 'gray', true: 'white' }}
              thumbColor={'rgb(85, 101, 107)'}
              ios_backgroundColor="gray"
              onValueChange={setTextInputAnswerMode}
              value={textInputAnswerMode}
            />
          </View>

          {/* Voice Selection - only show when Reader mode is enabled */}
          {readerModeEnabled && availableVoices.length > 0 && (
            <View style={styles.settingItem}>
              <Text style={[styles.label, { flex: 1 }]}>TTS Voice</Text>
              <View
                style={{
                  flex: 1,
                  marginLeft: 10,
                  backgroundColor: 'white',
                  borderRadius: 5,
                  width: '50%',
                }}
              >
                <Picker
                  selectedValue={selectedVoice?.name || ''}
                  onValueChange={(voiceName: string) => {
                    const voice = availableVoices.find(v => v.name === voiceName);
                    setSelectedVoice(voice || null);
                  }}
                  style={{ height: 30, color: 'black' }}
                  dropdownIconColor="black"
                >
                  <Picker.Item label="Default Voice" value="" />
                  {availableVoices.map((voice, index) => (
                    <Picker.Item
                      key={`${voice.name}-${index}`}
                      label={`${voice.name} (${voice.lang})`}
                      value={voice.name}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* TTS Test Button - especially useful for mobile */}
          {readerModeEnabled && (
            <View style={styles.settingItem}>
              <View style={styles.settingName}>
                <Text style={styles.settingText}>Test Voice</Text>
                <Text style={styles.settingDescription}>
                  Test the selected voice. On mobile devices, this also enables TTS functionality.
                </Text>
              </View>
              <Button
                onPress={() => {
                  const testText = "Hello! This is a test of the text-to-speech voice.";
                  // Use the TTS directly with the Web Speech API
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel(); // Stop any current speech
                    const utterance = new SpeechSynthesisUtterance(testText);
                    if (selectedVoice) {
                      utterance.voice = selectedVoice;
                    }
                    utterance.rate = 1.0;
                    utterance.pitch = 1.0;
                    utterance.volume = 1.0;
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                style={[styles.button, { alignSelf: 'flex-end' }]}
              >
                <Text style={styles.buttonText}>Test</Text>
              </Button>
            </View>
          )}

          {/* User Quiz Load Switch */}
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>Enable User Quizzes</Text>
              <Text style={styles.settingDescription}>
                Load quizzes from your own quizzes_user.json file in addition to
                the language-specific quizzes.
              </Text>
            </View>
            <Switch
              trackColor={{ false: 'gray', true: 'white' }}
              thumbColor={'rgb(85, 101, 107)'}
              ios_backgroundColor="gray"
              onValueChange={handleUserQuizLoadSwitch}
              value={userQuizLoadEnabled}
            />
          </View>

          {/* User Quiz Editor Button */}
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>Edit User Quizzes</Text>
              <Text style={styles.settingDescription}>
                Open a dialog to edit your quizzes_user.json file.
              </Text>
            </View>
            <Button
              onPress={handleOpenUserQuizModal}
              style={[styles.button, { alignSelf: 'flex-end' }]}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </Button>
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>{t('reset_settings')}</Text>
              <Text style={styles.settingDescription}>
                {t('reset_settings_desc')}
              </Text>
            </View>
            <Button
              onPress={resetState}
              style={[styles.button, { alignSelf: 'flex-end' }]}
            >
              <Text style={styles.buttonText}>{t('reset')}</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
      {/* User Quiz Edit Modal */}
      <Modal
        visible={userQuizModalVisible}
        animationType="slide"
        onRequestClose={() => setUserQuizModalVisible(false)}
        transparent={true}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
              width: '90%',
              height: '80%',
            }}
          >
            <Text
              style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}
            >
              Edit quizzes_user.json
            </Text>
            <TextInput
              style={{
                height: '100%',
                borderColor: 'gray',
                borderWidth: 1,
                borderRadius: 5,
                padding: 10,
                color: 'black',
                backgroundColor: 'white',
                marginBottom: 10,
                textAlignVertical: 'top',
              }}
              multiline
              value={userQuizJson}
              onChangeText={setUserQuizJson}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button
                onPress={() => setUserQuizModalVisible(false)}
                style={[styles.button, { marginRight: 10 }]}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Button>
              <Button onPress={handleSaveUserQuizJson} style={styles.button}>
                <Text style={styles.buttonText}>Save</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    width: '100%',
  },
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    width: '100%',
  },
  container: {
    backgroundColor: 'rgb(26, 26, 26)',
    padding: 20,
    width: '100%',
    height: '100%',
  },
  button: {
    backgroundColor: 'rgb(86, 92, 99)',
    padding: 7,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
    width: '100%',
    padding: 10,
  },
  settingName: {
    flexDirection: 'column',
    flex: 1,
    paddingVertical: 10,
    marginRight: 10,
  },
  settingText: {
    fontSize: 18,
    color: 'white',
  },
  settingDescription: {
    width: '100%',
    marginTop: 5,
    fontSize: 12,
    color: 'white',
  },

  textInput: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '400',
    color: 'black',
    width: '100%', // Ensures the input fills its container width
    alignSelf: 'stretch', // Helps with consistent stretching behavior
    maxWidth: '100%', // Prevents overflow on small screens
  },
  languageRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
});
