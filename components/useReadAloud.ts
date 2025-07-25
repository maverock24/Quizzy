import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';
import { useQuiz } from './Quizprovider';

type TTSState = 'idle' | 'playing';

export function useReadAloud() {
  const { i18n } = useTranslation();
  const { selectedVoice } = useQuiz();
  const [ttsState, setTtsState] = useState<TTSState>('idle');
  const utteranceQueue = useRef<SpeechSynthesisUtterance[]>([]);
  const sessionId = useRef(0);
  const voicesLoaded = useRef(false);
  const isMobile = useRef(false);
  const isMobileTTSUnlocked = useRef(false);

  // Detect if we're on mobile
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      isMobile.current = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('Mobile detected:', isMobile.current);
    }
  }, []);

  // Unlock TTS on mobile with user interaction
  const unlockMobileTTS = useCallback(() => {
    if (!isMobile.current || isMobileTTSUnlocked.current) return;
    
    console.log('Attempting to unlock mobile TTS...');
    const silent = new SpeechSynthesisUtterance('');
    silent.volume = 0.01;
    silent.rate = 0.1;
    
    silent.onend = () => {
      isMobileTTSUnlocked.current = true;
      console.log('Mobile TTS unlocked successfully');
    };
    
    silent.onerror = (e) => {
      console.log('Mobile TTS unlock error (may be expected):', e.error);
      // Even if there's an error, consider it unlocked for subsequent attempts
      isMobileTTSUnlocked.current = true;
    };
    
    try {
      window.speechSynthesis.speak(silent);
    } catch (e) {
      console.log('Mobile TTS unlock exception:', e);
      isMobileTTSUnlocked.current = true;
    }
  }, []);

  // Ensure voices are loaded for Chrome mobile
  useEffect(() => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      let voicesLoadAttempts = 0;
      const maxVoicesLoadAttempts = isMobile.current ? 30 : 10; // More attempts for mobile

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log(`Voice loading attempt ${voicesLoadAttempts + 1}: Found ${voices.length} voices`);
        
        if (voices.length > 0) {
          voicesLoaded.current = true;
          console.log('Voices loaded:', voices.map(v => `${v.name} (${v.lang})`).join(', '));
          
          // For mobile, set up a click listener to unlock TTS on first user interaction
          if (isMobile.current && !isMobileTTSUnlocked.current) {
            const unlockOnInteraction = () => {
              unlockMobileTTS();
              document.removeEventListener('touchstart', unlockOnInteraction);
              document.removeEventListener('click', unlockOnInteraction);
            };
            
            document.addEventListener('touchstart', unlockOnInteraction, { once: true });
            document.addEventListener('click', unlockOnInteraction, { once: true });
          }
        } else if (voicesLoadAttempts < maxVoicesLoadAttempts) {
          // Retry loading voices with increasing delays
          voicesLoadAttempts++;
          const delay = isMobile.current ? voicesLoadAttempts * 200 : voicesLoadAttempts * 100;
          setTimeout(loadVoices, delay);
        } else {
          console.warn('Failed to load voices after maximum attempts');
        }
      };

      // Load voices immediately if available
      loadVoices();

      // Also listen for the voiceschanged event (critical for Chrome mobile)
      const handleVoicesChanged = () => {
        console.log('Voices changed event fired');
        loadVoices();
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }
  }, [unlockMobileTTS]);

  const stopTTS = useCallback(() => {
    console.log('Stopping TTS...');
    sessionId.current += 1; // Invalidate previous sessions
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      utteranceQueue.current = [];
      
      // On Android Chrome, we need to be more aggressive about stopping
      if (isMobile.current) {
        window.speechSynthesis.cancel();
        // Wait a moment then cancel again (Android Chrome sometimes needs this)
        setTimeout(() => {
          window.speechSynthesis.cancel();
        }, 50);
      } else {
        window.speechSynthesis.cancel();
      }
    } else {
      Speech.stop();
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
        
        // Different error handling strategies for mobile vs desktop
        if (isMobile.current) {
          // On Android Chrome, many errors are recoverable
          if (event.error === 'interrupted' || 
              event.error === 'canceled' || 
              event.error === 'not-allowed') {
            console.log('Recoverable mobile error, continuing...');
            setTimeout(speakNextInQueue, 200); // Longer delay for mobile
          } else if (event.error === 'network' || event.error === 'synthesis-failed') {
            console.log('Network/synthesis error on mobile, retrying...');
            // Retry the same utterance once
            setTimeout(() => {
              try {
                window.speechSynthesis.speak(utterance);
              } catch (retryError) {
                console.error('Retry failed, moving to next:', retryError);
                setTimeout(speakNextInQueue, 100);
              }
            }, 500);
          } else {
            console.error('Non-recoverable mobile error, stopping session');
            setTtsState('idle');
          }
        } else {
          // Desktop error handling
          if (event.error === 'interrupted' || event.error === 'canceled') {
            setTimeout(speakNextInQueue, 100);
          } else {
            setTtsState('idle');
          }
        }
      };

      // Ensure speech synthesis is ready before speaking (critical for mobile)
      if (window.speechSynthesis.pending) {
        console.log('Cancelling pending speech synthesis');
        window.speechSynthesis.cancel();
      }
      
      // Additional mobile-specific preparation
      if (isMobile.current) {
        // Some Android devices need a moment between cancel and speak
        setTimeout(() => {
          try {
            console.log('Speaking utterance:', utterance.text.substring(0, 50) + '...');
            window.speechSynthesis.speak(utterance);
          } catch (error) {
            console.error('Error starting speech synthesis (mobile):', error);
            setTtsState('idle');
          }
        }, 10);
      } else {
        try {
          console.log('Speaking utterance:', utterance.text.substring(0, 50) + '...');
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Error starting speech synthesis:', error);
          setTtsState('idle');
        }
      }
    };

    // --- EFFECT TRIGGER ---
    // If the state was set to 'playing', we kick off the queue processing.
    if (ttsState === 'playing') {
      console.log('Starting speech synthesis queue processing...');
      // Much longer timeout for mobile Chrome stability - some devices are very slow
      const timeout = isMobile.current ? 500 : 100;
      setTimeout(() => speakNextInQueue(), timeout);
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
    console.log('ReadAloud called with text length:', text.length, 'Mobile:', isMobile.current);
    console.log('Current selectedVoice from context:', selectedVoice ? `${selectedVoice.name} (${selectedVoice.lang})` : 'null');
    
    // 1. Immediately stop any currently playing speech.
    stopTTS();

    // Clean up text for better TTS experience
    const cleanTextForTTS = (textToClean: string): string => {
      return textToClean
        // Remove backticks (inline code)
        .replace(/`([^`]+)`/g, '$1')
        // Remove triple backticks (code blocks) 
        .replace(/```[\s\S]*?```/g, '')
        // Remove other markdown formatting
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
        .replace(/\*([^*]+)\*/g, '$1') // Italic
        .replace(/_([^_]+)_/g, '$1') // Italic underscore
        // Clean up extra whitespace
        .replace(/\s+/g, ' ')
        .trim();
    };

    const cleanedText = cleanTextForTTS(text);

    const lang = langOverride || i18n.language || 'en';
    const langMap: Record<string, string> = {
      en: 'en-US', fi: 'fi-FI', de: 'de-DE',
    };
    const ttsLang = langMap[lang] || 'en-US';

    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      // Wait for voices to load on Chrome mobile with more aggressive retrying
      const waitForVoicesAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Checking voices:', voices.length, 'loaded flag:', voicesLoaded.current);
        
        if (voices.length === 0 && !voicesLoaded.current) {
          // Voices not loaded yet, try multiple strategies
          let retryCount = 0;
          const maxRetries = isMobile.current ? 100 : 50; // More retries for mobile
          
          const retryVoiceLoad = () => {
            retryCount++;
            console.log(`Voice retry attempt ${retryCount}/${maxRetries}`);
            
            // Try to trigger voice loading by calling getVoices again
            const currentVoices = window.speechSynthesis.getVoices();
            
            if (currentVoices.length > 0 || retryCount >= maxRetries) {
              console.log(`Voice loading ${currentVoices.length > 0 ? 'successful' : 'timed out'}`);
              voicesLoaded.current = currentVoices.length > 0;
              proceedWithSpeech(currentVoices);
            } else {
              // Use exponential backoff for mobile
              const delay = isMobile.current ? Math.min(retryCount * 20, 500) : 100;
              setTimeout(retryVoiceLoad, delay);
            }
          };
          
          setTimeout(retryVoiceLoad, 100);
          return;
        }
        
        console.log('Proceeding with', voices.length, 'voices');
        proceedWithSpeech(voices);
      };

      const proceedWithSpeech = (voices: SpeechSynthesisVoice[]) => {
        // Handle break tags by splitting text and creating timed pauses
        const processTextWithBreaks = (textWithBreaks: string): { type: 'text' | 'pause', content: string | number }[] => {
          const segments = textWithBreaks.split(/(<break time="\d+s"\s*\/?>)/);
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

        // More robust chunking strategy for text segments (smaller chunks for mobile)
        const splitIntoChunks = (textToSplit: string, maxLen = isMobile.current ? 100 : 200): string[] => {
          if (textToSplit.length <= maxLen) return [textToSplit];
          const sentences = textToSplit.match(/[^.!?]+[.!?]*|[^.!?]+$/g) || [];
          const chunks: string[] = [];
          let currentChunk = '';

          sentences.forEach(sentence => {
            if ((currentChunk + sentence).length > maxLen) {
              if (currentChunk.trim()) chunks.push(currentChunk.trim());
              currentChunk = '';
            }
            currentChunk += sentence + ' ';
          });
          if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
          
          return chunks;
        };

        // Process the cleaned text with breaks
        const segments = processTextWithBreaks(cleanedText);
        
        // Get available voices for the language with mobile-friendly fallbacks
        console.log('Available voices:', voices.length);
        voices.forEach((v, i) => console.log(`${i}: ${v.name} (${v.lang}) ${v.default ? '[DEFAULT]' : ''}`));
        
        const languageVoices = voices.filter(voice => voice.lang.startsWith(lang));
        
        // Try to find the selected voice by name and language since voice objects may not be the same reference
        let chosenVoice: SpeechSynthesisVoice | null = null;
        if (selectedVoice) {
          chosenVoice = voices.find(v => v.name === selectedVoice.name && v.lang === selectedVoice.lang) || null;
          console.log('User selected voice found:', chosenVoice ? `${chosenVoice.name} (${chosenVoice.lang})` : 'Not found - will use fallback');
        }
        
        // Fallback to default voice selection if no user selection or selected voice not found
        if (!chosenVoice) {
          // For mobile, prioritize finding a working voice
          if (isMobile.current) {
            // Try language-specific voices first
            if (languageVoices.length > 0) {
              chosenVoice = languageVoices[0];
              console.log('Mobile: Using first language voice:', chosenVoice.name);
            } else {
              // Fall back to default voice or first available
              const defaultVoice = voices.find(v => v.default);
              chosenVoice = defaultVoice || voices[0] || null;
              console.log('Mobile: Using fallback voice:', chosenVoice?.name || 'None');
            }
          } else {
            // Desktop logic
            chosenVoice = languageVoices[voiceIndex] || voices[voiceIndex] || voices[0] || null;
          }
        }
        
        console.log('Final chosen voice:', chosenVoice?.name || 'None');
        
        // For mobile, ensure TTS is unlocked before proceeding
        if (isMobile.current && !isMobileTTSUnlocked.current) {
          console.log('Mobile TTS not unlocked, attempting unlock...');
          unlockMobileTTS();
          // Wait a bit for unlock, then retry
          setTimeout(() => {
            console.log('Retrying TTS after unlock attempt...');
            readAloud(text, langOverride, rate, voiceIndex);
          }, 500);
          return;
        }
        
        // Create utterances for text segments and handle pauses manually
        utteranceQueue.current = [];
        let utteranceCount = 0;
        
        segments.forEach(segment => {
          if (segment.type === 'text') {
            const chunks = splitIntoChunks(segment.content as string);
            chunks.forEach(chunk => {
              const utterance = new window.SpeechSynthesisUtterance(chunk);
              utterance.lang = ttsLang;
              utterance.rate = isMobile.current ? Math.max(0.5, rate - 0.1) : rate; // Slightly slower on mobile
              utterance.pitch = 1;
              utterance.volume = 1;
              
              if (chosenVoice) {
                utterance.voice = chosenVoice;
              }
              
              utteranceCount++;
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

        console.log(`Created ${utteranceCount} utterances for speech synthesis`);

        // Start the speech synthesis
        if (utteranceQueue.current.length > 0) {
          setTtsState('playing');
        } else {
          console.log('No utterances created, not starting TTS');
        }
      };

      // Start the voice loading and speaking process
      waitForVoicesAndSpeak();

    } else if (Platform.OS !== 'web') {
      Speech.speak(cleanedText, {
        language: ttsLang,
        rate: rate,
        pitch: 1.0,
        onDone: () => setTtsState('idle'),
        onError: (error) => {
          console.error('Speech error:', error);
          setTtsState('idle');
        }
      });
      setTtsState('playing'); // Reflect native state
    } else {
      alert('Text-to-speech is not supported in this browser.');
      setTtsState('idle');
    }
  }, [i18n.language, stopTTS]);

  return { readAloud, stopTTS, ttsState };
}