import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';

type TTSState = 'idle' | 'playing';

export function useReadAloud() {
  const { i18n } = useTranslation();
  const [ttsState, setTtsState] = useState<TTSState>('idle');
  const utteranceQueue = useRef<SpeechSynthesisUtterance[]>([]);
  const sessionId = useRef(0);

  const stopTTS = useCallback(() => {
    sessionId.current += 1; // Invalidate previous sessions to stop them from continuing
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      utteranceQueue.current = [];
      window.speechSynthesis.cancel();
    } else {
      Tts.stop();
    }
    setTtsState('idle');
  }, []);

  // Main useEffect to handle Web Speech Synthesis Lifecycle
  // This effect now activates when `ttsState` changes to 'playing'
  useEffect(() => {
    const currentSession = sessionId.current;

    // We define the function that processes the queue *inside* the effect
    const speakNextInQueue = () => {
      // Guards: Stop if the session is old, state is wrong, or the queue is empty
      if (
        sessionId.current !== currentSession ||
        utteranceQueue.current.length === 0 ||
        ttsState !== 'playing'
      ) {
        setTtsState('idle');
        return;
      }

      const utterance = utteranceQueue.current.shift();
      if (!utterance) return;

      // Check if this is a pause utterance
      if ((utterance as any).isPause) {
        const pauseDuration = (utterance as any).pauseDuration;
        setTimeout(() => {
          speakNextInQueue();
        }, pauseDuration);
        return;
      }

      utterance.onend = () => {
        // A small delay can help prevent issues on some browsers before speaking the next chunk
        setTimeout(speakNextInQueue, 50);
      };

      utterance.onerror = (event) => {
        console.error('SpeechSynthesis Utterance Error:', event.error);
        // Try to continue with the next chunk even if one fails
        setTimeout(speakNextInQueue, 50);
      };

      window.speechSynthesis.speak(utterance);
    };

    // --- EFFECT TRIGGER ---
    // If the state was set to 'playing', we kick off the queue processing.
    if (ttsState === 'playing') {
      // A brief timeout gives `cancel()` from a previous `stop()` call time to clear the browser's internal queue.
      setTimeout(() => speakNextInQueue(), 100);
    }
    
    // --- EFFECT CLEANUP ---
    // This cleanup function runs when the component unmounts.
    return () => {
      if (Platform.OS === 'web' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [ttsState]); // The effect now correctly depends on `ttsState`

  const readAloud = useCallback((text: string, langOverride?: string, rate: number = 1.0, voiceIndex: number = 0) => {
    // 1. Immediately stop any currently playing speech.
    stopTTS();

    const lang = langOverride || i18n.language || 'en';
    const langMap: Record<string, string> = {
      en: 'en-US', fi: 'fi-FI', de: 'de-DE',
    };
    const ttsLang = langMap[lang] || 'en-US';

    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      // Handle break tags by splitting text and creating timed pauses
      const processTextWithBreaks = (textWithBreaks: string): { type: 'text' | 'pause', content: string | number }[] => {
        const segments = textWithBreaks.split(/(<break time="(\d+)s"\s*\/?>)/);
        const result: { type: 'text' | 'pause', content: string | number }[] = [];
        
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          if (segment.match(/<break time="(\d+)s"\s*\/?>/)) {
            // Extract pause duration
            const match = segment.match(/(\d+)/);
            if (match) {
              result.push({ type: 'pause', content: parseInt(match[1]) * 1000 }); // Convert to milliseconds
            }
          } else if (segment.trim()) {
            // Regular text segment
            result.push({ type: 'text', content: segment.trim() });
          }
        }
        
        return result;
      };

      // More robust chunking strategy for text segments
      const splitIntoChunks = (textToSplit: string, maxLen = 200): string[] => {
        if (textToSplit.length <= maxLen) return [textToSplit];
        const sentences = textToSplit.match(/[^.!?]+[.!?]*|[^.!?]+$/g) || [];
        const chunks: string[] = [];
        let currentChunk = '';

        sentences.forEach(sentence => {
          if ((currentChunk + sentence).length > maxLen) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          currentChunk += sentence + ' ';
        });
        if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
        
        return chunks;
      };

      // Process the text with breaks
      const segments = processTextWithBreaks(text);
      
      // Get available voices for the language
      const voices = window.speechSynthesis.getVoices();
      const languageVoices = voices.filter(voice => voice.lang.startsWith(lang));
      const selectedVoice = languageVoices[voiceIndex] || voices[voiceIndex] || voices[0];
      
      // Create utterances for text segments and handle pauses manually
      utteranceQueue.current = [];
      
      segments.forEach(segment => {
        if (segment.type === 'text') {
          const chunks = splitIntoChunks(segment.content as string);
          chunks.forEach(chunk => {
            const utterance = new window.SpeechSynthesisUtterance(chunk);
            utterance.lang = ttsLang;
            utterance.rate = rate;
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
            utteranceQueue.current.push(utterance);
          });
        } else if (segment.type === 'pause') {
          // Create a special "pause utterance" with metadata
          const pauseUtterance = new window.SpeechSynthesisUtterance('');
          (pauseUtterance as any).isPause = true;
          (pauseUtterance as any).pauseDuration = segment.content;
          utteranceQueue.current.push(pauseUtterance);
        }
      });

      // 2. THIS IS THE KEY CHANGE:
      // Instead of calling speakNextInQueue directly, we set the state.
      // The `useEffect` hook will see this change and start the speech.
      if (utteranceQueue.current.length > 0) {
        setTtsState('playing');
      }

    } else if (Platform.OS !== 'web') {
      Tts.setDefaultLanguage(ttsLang);
      Tts.speak(text);
      setTtsState('playing'); // Reflect native state
    } else {
      alert('Text-to-speech is not supported in this browser.');
      setTtsState('idle');
    }
  }, [i18n.language, stopTTS]);

  return { readAloud, stopTTS, ttsState };
}