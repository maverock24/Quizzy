import { useRef } from 'react';
import { Platform } from 'react-native';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';

export function useReadAloud() {
  const ttsCancelled = useRef(false);
  const sessionId = useRef(0);
  const { i18n } = useTranslation();
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  // Track all utterances for event cleanup
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const cancelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Track all timeouts for robust cancellation
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  // Track if TTS is active
  const isTTSActive = useRef(true);

  // Aggressively stop TTS on both web and native
  const stopTTS = () => {
    isTTSActive.current = false;
    ttsCancelled.current = true;
    sessionId.current += 1;
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      // Remove all event handlers from all utterances
      utterancesRef.current.forEach(u => {
        u.onend = null;
        u.onerror = null;
        u.onstart = null;
        u.onboundary = null;
        u.onpause = null;
        u.onresume = null;
        u.onmark = null;
      });
      utterancesRef.current = [];
      // Cancel all utterances and clear the queue
      window.speechSynthesis.cancel();
      // Speak a dummy utterance to flush the queue, then cancel again
      const dummy = new window.SpeechSynthesisUtterance(' ');
      dummy.volume = 0;
      dummy.rate = 10;
      dummy.onend = () => {
        window.speechSynthesis.cancel();
      };
      window.speechSynthesis.speak(dummy);
      // Extra robust: keep calling cancel() until not speaking or pending
      if (cancelIntervalRef.current) clearInterval(cancelIntervalRef.current);
      let tries = 0;
      cancelIntervalRef.current = setInterval(() => {
        window.speechSynthesis.cancel();
        tries++;
        if ((!window.speechSynthesis.speaking && !window.speechSynthesis.pending) || tries > 20) {
          clearInterval(cancelIntervalRef.current!);
        }
      }, 60);
      // Final cancel after a short delay
      timeoutsRef.current.forEach(t => clearTimeout(t));
      timeoutsRef.current = [];
      const finalTimeout = setTimeout(() => window.speechSynthesis.cancel(), 300);
      timeoutsRef.current.push(finalTimeout);
    } else {
      Tts.stop();
    }
  };

  // Main TTS function
  const readAloud = (text: string, langOverride?: string) => {
    ttsCancelled.current = false;
    sessionId.current += 1;
    isTTSActive.current = true;
    const thisSession = sessionId.current;
    const lang = langOverride || i18n.language || 'en';
    const langMap: Record<string, string> = {
      en: 'en-US',
      fi: 'fi-FI',
      de: 'de-DE',
    };
    const ttsLang = langMap[lang] || 'en-US';
    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window) {
        if (cancelIntervalRef.current) clearInterval(cancelIntervalRef.current);
        const splitIntoChunks = (text: string, maxLen = 220) => {
          const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
          let chunks: string[] = [];
          for (let sentence of sentences) {
            sentence = sentence.trim();
            if (sentence.length <= maxLen) {
              chunks.push(sentence);
            } else {
              for (let i = 0; i < sentence.length; i += maxLen) {
                chunks.push(sentence.slice(i, i + maxLen));
              }
            }
          }
          return chunks.filter(Boolean);
        };
        const chunks = splitIntoChunks(text, 220);
        utterancesRef.current = [];
        const speakChunk = (i: number, session: number) => {
          // Guard: never speak if cancelled or not active
          if (!isTTSActive.current || ttsCancelled.current || session !== sessionId.current) return;
          if (i >= chunks.length) return;
          const utterance = new window.SpeechSynthesisUtterance(chunks[i]);
          utterance.lang = ttsLang;
          utterance.rate = 1.0;
          currentUtterance.current = utterance;
          utterancesRef.current.push(utterance);
          utterance.onend = () => {
            // Guard: never continue if cancelled or not active
            if (!isTTSActive.current || ttsCancelled.current || session !== sessionId.current) return;
            const timeout = setTimeout(() => speakChunk(i + 1, session), 80);
            timeoutsRef.current.push(timeout);
          };
          utterance.onerror = () => {
            if (!isTTSActive.current || ttsCancelled.current || session !== sessionId.current) return;
            const timeout = setTimeout(() => speakChunk(i + 1, session), 80);
            timeoutsRef.current.push(timeout);
          };
          // Guard: never speak if cancelled or not active
          if (!isTTSActive.current || ttsCancelled.current) return;
          window.speechSynthesis.speak(utterance);
        };
        window.speechSynthesis.cancel();
        timeoutsRef.current.forEach(t => clearTimeout(t));
        timeoutsRef.current = [];
        const startTimeout = setTimeout(() => {
          if (!ttsCancelled.current && thisSession === sessionId.current && isTTSActive.current) {
            speakChunk(0, thisSession);
          }
        }, 80); // Give cancel() a moment to clear the queue
        timeoutsRef.current.push(startTimeout);
      } else {
        alert('Text-to-speech is not supported in this browser.');
      }
      return;
    }
    // Native (iOS/Android)
    Tts.setDefaultLanguage(ttsLang);
    Tts.stop();
    Tts.speak(text);
  };

  return { readAloud, stopTTS };
}
