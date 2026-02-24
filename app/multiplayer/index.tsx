import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, Text, Pressable, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { multiplayerService } from '../../services/MultiplayerService';
import { useTranslation } from 'react-i18next';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';

export default function MultiplayerHome() {
  const router = useRouter();


  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    try {
      setIsCreating(true);
      const code = await multiplayerService.createRoom(name);
      if (code) {
        // @ts-ignore: router.push type mismatch
        router.push(`/multiplayer/${code}?name=${encodeURIComponent(name)}&isHost=true`);
      } else {
        Alert.alert('Error', 'Failed to create room');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!name.trim() || !roomCode.trim()) {
      Alert.alert('Required', 'Please enter your name and room code');
      return;
    }

    try {
      setIsJoining(true);
      const response = await multiplayerService.joinRoom(roomCode, name);
      if (response.success) {
        // @ts-ignore: router.push type mismatch
        router.push(`/multiplayer/${roomCode}?name=${encodeURIComponent(name)}&isHost=false&initialQuizId=${response.quizId || ''}`);
      } else {
        Alert.alert('Error', 'Failed to join room');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not join room');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <SafeAreaLinearGradient
        colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
        style={styles.safeArea}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Multiplayer Quiz</Text>

            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>

              <TouchableOpacity
                onPress={handleCreateRoom}
                disabled={isJoining || isCreating}
                style={[styles.button, styles.createBtn]}
              >
                {isCreating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>🚀 Create New Game</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>- OR -</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Room Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-character code"
                  value={roomCode}
                  onChangeText={(text) => setRoomCode(text.toUpperCase())}
                  maxLength={6}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="characters"
                />
              </View>
              <TouchableOpacity
                onPress={handleJoinRoom}
                disabled={isJoining || isCreating}
                style={[styles.button, styles.joinBtn]}
              >
                {isJoining ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>⚔️ Join Game</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', left: 20, top: 20, zIndex: 10 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={30} color="white" />
          </View>
        </TouchableOpacity>
      </SafeAreaLinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  safeArea: {
    flex: 1,
    maxWidth: 550,
    width: '100%',
    borderLeftColor: 'rgb(129, 129, 129)',
    borderRightColor: 'rgb(141, 141, 141)',
    borderTopColor: 'rgb(26, 26, 26)',
    borderBottomColor: 'rgb(26, 26, 26)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: 'white',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 10,
    width: '100%',
  },
  orContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  orText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    backgroundColor: 'rgb(46, 150, 194)', // Vibrant Blue from QuizSelection
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  createBtn: {
    backgroundColor: 'rgb(52, 211, 153)', // Greenish for distinction
  },
  joinBtn: {
    backgroundColor: 'rgb(46, 150, 194)',
  },
});
