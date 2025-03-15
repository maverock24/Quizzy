import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

export default function SettingsScreen() {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Enable Notifications</Text>
        <Switch
          trackColor={{ false: 'gray', true: 'white' }}
          thumbColor={isEnabled ? 'rgb(85, 101, 107)' : 'rgb(63, 65, 66)'}
          ios_backgroundColor="gray"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
        <Text style={styles.settingText}>{isEnabled ? 'On' : 'Off'}</Text>
      </View>
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Dark Mode</Text>
        <Switch
          trackColor={{ false: 'gray', true: 'white' }}
          thumbColor={isEnabled ? 'rgb(85, 101, 107)' : 'rgb(63, 65, 66)'}
          ios_backgroundColor="gray"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
        <Text style={styles.settingText}>{isEnabled ? 'On' : 'Off'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(26, 26, 26)',
    padding: 20,
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
  settingText: {
    fontSize: 18,
    color: 'white',
  },
});
