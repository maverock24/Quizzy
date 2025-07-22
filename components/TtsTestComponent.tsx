import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useReadAloud } from './useReadAloud';
import { useTranslation } from 'react-i18next';

export const TtsTestComponent: React.FC = () => {
  const { t } = useTranslation();
  const { readAloud, stopTTS, ttsState } = useReadAloud();

  const testBasicTts = () => {
    const testText = "Hello, this is a test of text to speech functionality on Chrome mobile.";
    readAloud(testText, undefined, 1.0, 0);
  };

  const testWithBreaks = () => {
    const testText = "This is a test. <break time=\"2s\"/> After a two second pause. <break time=\"3s\"/> After a three second pause.";
    readAloud(testText, undefined, 0.9, 0);
  };

  const testLongText = () => {
    const longText = "This is a longer text to test chunking functionality. It contains multiple sentences to ensure that the text-to-speech system properly handles longer content. The system should break this into appropriate chunks and speak them sequentially without interruption.";
    readAloud(longText, undefined, 0.8, 0);
  };

  const checkSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      Alert.alert(
        'Speech Synthesis Status', 
        `Speech Synthesis: Available\nVoices loaded: ${voices.length}\nFirst voice: ${voices[0]?.name || 'None'}\nUser Agent: ${navigator.userAgent.substring(0, 50)}...`
      );
    } else {
      Alert.alert('Speech Synthesis Status', 'Speech Synthesis: Not Available');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TTS Debug Console</Text>
      <Text style={styles.status}>Status: {ttsState}</Text>
      
      <TouchableOpacity style={styles.button} onPress={testBasicTts}>
        <Text style={styles.buttonText}>Test Basic TTS</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testWithBreaks}>
        <Text style={styles.buttonText}>Test with Breaks</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testLongText}>
        <Text style={styles.buttonText}>Test Long Text</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={checkSpeechSynthesis}>
        <Text style={styles.buttonText}>Check Speech API</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.stopButton]} 
        onPress={stopTTS}
        disabled={ttsState === 'idle'}
      >
        <Text style={styles.buttonText}>Stop TTS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
