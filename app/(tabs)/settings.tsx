import { useQuiz } from '@/components/Quizprovider';
import { Button } from '@/components/ui/button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AndroidReleaseInfo,
  fetchLatestRelease,
  getInstalledVersionCode,
  installAndroidRelease,
  isAndroidNative,
  isNewerRelease,
} from '@/services/androidUpdate';

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
    timerEnabled,
    setTimerEnabled,
    timerDuration,
    setTimerDuration,
    kidsMode,
    setKidsMode,
  } = useQuiz();

  const { t, i18n } = useTranslation();

  const [userQuizModalVisible, setUserQuizModalVisible] = React.useState(false);
  const [userQuizJson, setUserQuizJson] = React.useState('');

  // Android APK update state
  const [androidRelease, setAndroidRelease] =
    React.useState<AndroidReleaseInfo | null>(null);
  const [installedVersionCode, setInstalledVersionCode] = React.useState(0);
  const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);
  const [isInstallingUpdate, setIsInstallingUpdate] = React.useState(false);
  const [updateError, setUpdateError] = React.useState('');

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

  // --- Android APK update handlers ---
  const loadAndroidRelease = async () => {
    setIsCheckingUpdate(true);
    setUpdateError('');
    try {
      const release = await fetchLatestRelease();
      setAndroidRelease(release);
      if (!release) {
        setUpdateError(t('settings_update_no_build'));
      }
    } catch {
      setUpdateError(t('settings_update_check_failed'));
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (!androidRelease) return;
    setIsInstallingUpdate(true);
    setUpdateError('');
    try {
      await installAndroidRelease(androidRelease);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : t('settings_update_install_failed');
      setUpdateError(msg);
      Alert.alert(t('settings_update_failed'), msg);
    } finally {
      setIsInstallingUpdate(false);
    }
  };

  React.useEffect(() => {
    if (isAndroidNative()) {
      setInstalledVersionCode(getInstalledVersionCode());
      void loadAndroidRelease();
    }
  }, []);

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
      Alert.alert(t('settings_error'), t('settings_user_quizzes_load_failed'));
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
      Alert.alert(t('settings_error'), t('settings_user_quizzes_save_failed'));
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

          {/* Kids Mode */}
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>
                {`🎨 `}
                {t('settings_kids_mode')}
              </Text>
              <Text style={styles.settingDescription}>
                {t('settings_kids_mode_desc')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: 'gray', true: '#FF6B6B' }}
              thumbColor={kidsMode ? '#FFD93D' : 'rgb(63, 65, 66)'}
              ios_backgroundColor="gray"
              onValueChange={setKidsMode}
              value={kidsMode}
            />
          </View>

          {/* Timer Mode Settings */}
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>{t('timer_mode')}</Text>
              <Text style={styles.settingDescription}>
                {t('timer_mode_desc')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: 'gray', true: 'white' }}
              thumbColor={'rgb(85, 101, 107)'}
              ios_backgroundColor="gray"
              onValueChange={setTimerEnabled}
              value={timerEnabled}
            />
          </View>

          {/* Timer Duration - only show when timer is enabled */}
          {timerEnabled && (
            <View style={styles.settingItem}>
              <Text style={[styles.label, { flex: 1 }]}>
                {t('timer_duration')}
              </Text>
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
                  selectedValue={timerDuration}
                  onValueChange={(value: number) => setTimerDuration(value)}
                  style={{ height: 30, color: 'black' }}
                  dropdownIconColor="black"
                >
                  <Picker.Item label={`1 ${t('minutes')}`} value={1} />
                  <Picker.Item label={`2 ${t('minutes')}`} value={2} />
                  <Picker.Item label={`3 ${t('minutes')}`} value={3} />
                  <Picker.Item label={`5 ${t('minutes')}`} value={5} />
                  <Picker.Item label={`10 ${t('minutes')}`} value={10} />
                  <Picker.Item label={`15 ${t('minutes')}`} value={15} />
                  <Picker.Item label={`20 ${t('minutes')}`} value={20} />
                  <Picker.Item label={`30 ${t('minutes')}`} value={30} />
                </Picker>
              </View>
            </View>
          )}

          {/* Voice Selection - only show when Reader mode is enabled */}
          {readerModeEnabled && availableVoices.length > 0 && (
            <View style={styles.settingItem}>
              <Text style={[styles.label, { flex: 1 }]}>
                {t('settings_tts_voice')}
              </Text>
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
                    const voice = availableVoices.find(
                      (v) => v.name === voiceName,
                    );
                    setSelectedVoice(voice || null);
                  }}
                  style={{ height: 30, color: 'black' }}
                  dropdownIconColor="black"
                >
                  <Picker.Item label={t('settings_default_voice')} value="" />
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
                <Text style={styles.settingText}>
                  {t('settings_test_voice')}
                </Text>
                <Text style={styles.settingDescription}>
                  {t('settings_test_voice_desc')}
                </Text>
              </View>
              <Button
                onPress={() => {
                  const testText = t('settings_test_voice_text');
                  // Use the TTS directly with the Web Speech API
                  if (
                    typeof window !== 'undefined' &&
                    'speechSynthesis' in window
                  ) {
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
                <Text style={styles.buttonText}>{t('settings_test')}</Text>
              </Button>
            </View>
          )}

          {/* User Quiz Load Switch */}
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>
                {t('settings_enable_user_quizzes')}
              </Text>
              <Text style={styles.settingDescription}>
                {t('settings_enable_user_quizzes_desc')}
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
              <Text style={styles.settingText}>
                {t('settings_edit_user_quizzes')}
              </Text>
              <Text style={styles.settingDescription}>
                {t('settings_edit_user_quizzes_desc')}
              </Text>
            </View>
            <Button
              onPress={handleOpenUserQuizModal}
              style={[styles.button, { alignSelf: 'flex-end' }]}
            >
              <Text style={styles.buttonText}>{t('settings_edit')}</Text>
            </Button>
          </View>

          {/* Android APK Updates (native Android only) */}
          {isAndroidNative() && (
            <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
              <View style={styles.settingName}>
                <Text style={styles.settingText}>
                  {t('settings_app_updates')}
                </Text>
                <Text style={styles.settingDescription}>
                  {androidRelease
                    ? t('settings_latest_build', {
                        version: androidRelease.versionName,
                        code: androidRelease.versionCode,
                      })
                    : updateError || t('settings_checking_updates')}
                  {'\n'}
                  {t('settings_installed_build')}{' '}
                  {installedVersionCode > 0
                    ? `#${installedVersionCode}`
                    : t('settings_unknown')}
                </Text>
                {isCheckingUpdate && (
                  <ActivityIndicator size="small" color="#4FC3F7" />
                )}
              </View>
              {!isCheckingUpdate &&
                androidRelease &&
                (isNewerRelease(androidRelease) ? (
                  <Button
                    onPress={handleInstallUpdate}
                    style={[styles.button, { alignSelf: 'flex-end' }]}
                  >
                    {isInstallingUpdate ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {t('settings_download_install')}
                      </Text>
                    )}
                  </Button>
                ) : (
                  <Text style={[styles.buttonText, { alignSelf: 'center' }]}>
                    {t('settings_up_to_date')}
                  </Text>
                ))}
              {!isCheckingUpdate && !androidRelease && (
                <Button
                  onPress={loadAndroidRelease}
                  style={[styles.button, { alignSelf: 'flex-end' }]}
                >
                  <Text style={styles.buttonText}>{t('settings_check')}</Text>
                </Button>
              )}
            </View>
          )}

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
              {t('settings_edit_json_title')}
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
                <Text style={styles.buttonText}>{t('cancel')}</Text>
              </Button>
              <Button onPress={handleSaveUserQuizJson} style={styles.button}>
                <Text style={styles.buttonText}>{t('save')}</Text>
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
