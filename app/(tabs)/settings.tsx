import { useQuiz } from '@/components/Quizprovider';
import { Button } from '@/components/ui/button';
import { REMOTE_QUIZ } from '@/constants/Urls';
import React from 'react';
import {
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

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.heading}>Settings</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Allows the user to switch on-/off reminder notifications
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
              <Text style={styles.settingText}>Show Explanation</Text>
              <Text style={styles.settingDescription}>
                Allows the user to hide validation of answer
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
              <Text style={styles.settingText}>Enable Sound</Text>
              <Text style={styles.settingDescription}>
                Allow to play sound when answering questions
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
              <Text style={styles.settingText}>Enable Remote Update</Text>
              <Text style={styles.settingDescription}>
                Allow to update quiz data from remote server
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
              <Text style={styles.settingText}>Remote Address</Text>
              <Text style={styles.settingDescription}>
                Url to json file with quiz data
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
              <Text style={styles.buttonText}>Save</Text>
            </Button>
          </View>
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingName}>
              <Text style={styles.settingText}>Reset Settings</Text>
              <Text style={styles.settingDescription}>
                Resets settings / quiz stats
              </Text>
            </View>
            <Button
              onPress={resetState}
              style={[styles.button, { alignSelf: 'flex-end' }]}
            >
              <Text style={styles.buttonText}>Reset</Text>
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
});
