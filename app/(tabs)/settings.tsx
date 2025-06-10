import { useQuiz } from '@/components/Quizprovider';
import { Button } from '@/components/ui/button';
import { REMOTE_QUIZ } from '@/constants/Urls';
import { useTranslation } from 'react-i18next';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { P } from '@expo/html-elements';

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
    remoteUpdateEnabled,
    setRemoteUpdateEnabled,
    remoteAddress,
    setRemoteAdress,
  } = useQuiz();

  const { t, i18n } = useTranslation();

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.heading}>{t('settings')}</Text>
          {/* Language Switcher */}
          <View style={styles.languageRow}>
            <Text style={styles.label}>{t('language')}</Text>
            <View
              style={{
                flex: 1,
                marginLeft: 10,
                backgroundColor: 'white',
                borderRadius: 5,
              }}
            >
              <Picker
                selectedValue={i18n.language}
                onValueChange={(lang: string) => i18n.changeLanguage(lang)}
                style={{ height: 40, color: 'black' }}
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
              <Text style={styles.settingText}>{t('use_custom_remote')}</Text>
              <Text style={styles.settingDescription}>
                {t('use_custom_remote_desc')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: 'gray', true: 'white' }}
              thumbColor={'rgb(85, 101, 107)'}
              ios_backgroundColor="gray"
              onValueChange={setRemoteUpdateEnabled}
              value={remoteUpdateEnabled}
            />
          </View>
          <View
            style={[
              styles.settingItem,
              { flexDirection: 'column', alignItems: 'flex-start' },
            ]}
          >
            <View style={styles.settingName}>
              <Text style={styles.settingText}>{t('remote_address')}</Text>
              <Text style={styles.settingDescription}>
                {t('remote_address_desc')}
              </Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholderTextColor="gray"
              onChangeText={setRemoteAdress}
              value={remoteAddress ? remoteAddress : REMOTE_QUIZ}
            />
            <Button
              onPress={() => {}}
              style={[styles.button, { alignSelf: 'flex-end' }]}
            >
              <Text style={styles.buttonText}>{t('save')}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
});
