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
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isChrome = /Chrome/i.test(navigator.userAgent);
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      let debugInfo = `Speech Synthesis: Available\n`;
      debugInfo += `Voices loaded: ${voices.length}\n`;
      debugInfo += `Platform: ${isAndroid ? 'Android' : 'Other'}\n`;
      debugInfo += `Browser: ${isChrome ? 'Chrome' : 'Other'}\n`;
      debugInfo += `Mobile: ${isMobile ? 'Yes' : 'No'}\n`;
      debugInfo += `First voice: ${voices[0]?.name || 'None'}\n`;
      debugInfo += `Default voice: ${voices.find(v => v.default)?.name || 'None'}\n`;
      debugInfo += `Speaking: ${window.speechSynthesis.speaking ? 'Yes' : 'No'}\n`;
      debugInfo += `Pending: ${window.speechSynthesis.pending ? 'Yes' : 'No'}\n`;
      debugInfo += `Paused: ${window.speechSynthesis.paused ? 'Yes' : 'No'}\n`;
      debugInfo += `User Agent: ${navigator.userAgent.substring(0, 100)}...`;
      
      Alert.alert('Speech Synthesis Debug', debugInfo);
      
      // Also log to console for more detailed debugging
      console.log('=== TTS DEBUG INFO ===');
      console.log('Voices:', voices);
      console.log('User Agent:', navigator.userAgent);
      console.log('Speech Synthesis State:', {
        speaking: window.speechSynthesis.speaking,
        pending: window.speechSynthesis.pending,
        paused: window.speechSynthesis.paused
      });
    } else {
      Alert.alert('Speech Synthesis Status', 'Speech Synthesis: Not Available');
    }
  };

  const testAndroidSpecific = () => {
    // Test specifically for common Android issues
    const testText = "Testing Android specific text to speech functionality.";
    
    if ('speechSynthesis' in window) {
      // Force reload voices first
      const voices = window.speechSynthesis.getVoices();
      console.log('Pre-test voices:', voices.length);
      
      // Create a simple test utterance with Android-friendly settings
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.rate = 0.8;  // Slower for better Android compatibility
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      // Use default voice if available
      const defaultVoice = voices.find(v => v.default);
      if (defaultVoice) {
        utterance.voice = defaultVoice;
        console.log('Using default voice:', defaultVoice.name);
      }
      
      utterance.onstart = () => console.log('Android test: Speech started');
      utterance.onend = () => console.log('Android test: Speech ended');
      utterance.onerror = (e) => console.error('Android test error:', e);
      
      // Clear any existing speech first
      window.speechSynthesis.cancel();
      
      // Wait a moment then speak
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
          console.log('Android test utterance queued');
        } catch (error) {
          console.error('Android test failed:', error);
          Alert.alert('Android Test Failed', String(error));
        }
      }, 100);
    } else {
      Alert.alert('Error', 'Speech synthesis not available');
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

      <TouchableOpacity style={styles.button} onPress={testAndroidSpecific}>
        <Text style={styles.buttonText}>Android Direct Test</Text>
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
