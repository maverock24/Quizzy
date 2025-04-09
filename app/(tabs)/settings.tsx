import { useQuiz } from '@/components/Quizprovider';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { notificationsEnabled, setNotificationsEnabled } = useQuiz();
  const { showExplanation, setShowExplanation } = useQuiz();

  return (
    <View style={styles.outerContainer}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgb(26, 26, 26)',
    padding: 20,
    maxWidth: 550,
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
  },
  settingName: {
    flexDirection: 'column',
    maxWidth: '80%',
    paddingVertical: 10,
  },
  settingText: {
    fontSize: 18,
    color: 'white',
  },
  settingDescription: {
    marginTop: 10,
    fontSize: 14,
    color: 'white',
  },
});
