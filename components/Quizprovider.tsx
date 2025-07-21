import i18n from '@/components/i18n';
import { REMOTE_QUIZ } from '@/constants/Urls';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { Quiz } from './types';

type QuizContextType = {
  userQuizLoadEnabled: boolean; // Add userQuizLoadEnabled to the context
  setUserQuizLoadEnabled: (enabled: boolean) => void; // Add setter for userQuizLoadEnabled
  language: string;
  setLanguage: (lang: string) => void;
  selectedQuizName: string | null;
  setSelectedQuizName: (name: string | null) => void;
  flashcardsEnabled: boolean;
  setFlashcardsEnabled: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  showExplanation: boolean;
  setShowExplanation: (show: boolean) => void;
  quizzes: Quiz[]; // Add quizzes to the context
  checkForQuizzesUpdate: () => Promise<boolean>; // Function to check for updates
  totalQuestionsAnswered: number;
  setTotalQuestionsAnswered: (total: number) => void;
  totalCorrectAnswers: number;
  setTotalCorrectAnswers: (total: number) => void;
  totalWrongAnswers: number;
  setTotalWrongAnswers: (total: number) => void;
  totalWonGames: number;
  setTotalWonGames: (total: number) => void;
  totalLostGames: number;
  setTotalLostGames: (total: number) => void;
  setAudioEnabled: (enabled: boolean) => void;
  audioEnabled: boolean;
  setRemoteUpdateEnabled: (enabled: boolean) => void;
  remoteUpdateEnabled: boolean;
  setRemoteAdress: (address: string) => void;
  remoteAddress: string;
  resetState: () => void;
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  readerModeEnabled: boolean;
  setReaderModeEnabled: (enabled: boolean) => void;
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Updated getLocalQuizzes to accept userQuizzes
const getLocalQuizzes = (userQuizzes?: Quiz[]) => {
  console.log('getLocalQuizzes userQuizzes:', userQuizzes);
  const lang = i18n.language || 'en';
  const getQuizName = (quiz: any) => quiz.name || quiz.nimi || '';
  let quizzes;
  if (lang.startsWith('fi')) {
    quizzes = require('../assets/quizzes_fi.json');
  } else if (lang.startsWith('de')) {
    quizzes = require('../assets/quizzes_de.json');
  } else {
    quizzes = require('../assets/quizzes_en.json');
  }
  let all = quizzes;
  if (userQuizzes && userQuizzes.length > 0) {
    all = quizzes.concat(userQuizzes);
  }
  return all.sort((a: any, b: any) =>
    getQuizName(a).localeCompare(getQuizName(b)),
  );
};

export const QuizProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const GOOGLE_DRIVE_DIRECT_LINK = 'https://drive.google.com/uc?export=download&id=1Nr-9H-3z_8O0IafoUTjC9iJI9aZJQ_SH';
  const [data, setData] = useState(null);
  const [language, setLanguageState] = useState<string>(i18n.language || 'en');
  const [isLanguageReady, setIsLanguageReady] = useState(false);
  const [selectedQuizName, setSelectedQuizName] = useState<string | null>(null);
  const [flashcardsEnabled, setFlashcardsEnabledState] = useState<boolean>(
    false,
  );
  const [notificationsEnabled, setNotificationsEnabledState] = useState<
    boolean
  >(true);
  const [showExplanation, setShowExplanationState] = useState<boolean>(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>(getLocalQuizzes());
  const [totalQuestionsAnswered, setTotalQuestionsAnsweredState] = useState<
    number
  >(0);
  const [totalCorrectAnswers, setTotalCorrectAnswersState] = useState<number>(
    0,
  );
  const [totalWrongAnswers, setTotalWrongAnswersState] = useState<number>(0);
  const [totalWonGames, setTotalWonGamesState] = useState<number>(0);
  const [totalLostGames, setTotalLostGamesState] = useState<number>(0);
  const [audioEnabled, setAudioEnabledState] = useState<boolean>(true);
  const [remoteUpdateEnabled, setRemoteUpdateEnabledState] = useState<boolean>(
    false,
  );
  const [remoteAddress, setRemoteAddressState] = useState<string>('');
  const [lastUpdateDate, setLastUpdateDateState] = useState<string | null>(
    null,
  );
  const [userQuizLoadEnabled, setUserQuizLoadEnabledState] = useState<boolean>(
    false,
  );
  const [musicEnabled, setMusicEnabledState] = useState<boolean>(false);
  const [readerModeEnabled, setReaderModeEnabledState] = useState<boolean>(false);
  const setMusicEnabled = useCallback(async (enabled: boolean) => {
    setMusicEnabledState(enabled);
    try {
      await AsyncStorage.setItem('musicEnabled', String(enabled));
    } catch (error) {
      console.error('Failed to save music setting', error);
    }
  }, []);

  const setReaderModeEnabled = useCallback(async (enabled: boolean) => {
    setReaderModeEnabledState(enabled);
    try {
      await AsyncStorage.setItem('readerModeEnabled', String(enabled));
    } catch (error) {
      console.error('Failed to save reader mode setting', error);
    }
  }, []);

  const setUserQuizLoadEnabled = useCallback((enabled: boolean) => {
    setUserQuizLoadEnabledState(enabled);
    // Save the user quiz load setting
    AsyncStorage.setItem('userQuizLoadEnabled', String(enabled)).catch(
      (error) => {
        console.error('Failed to save user quiz load setting', error);
      },
    );
  }, []);

  // Helper to load user quizzes (native or web)
  const loadUserQuizzes = async (): Promise<Quiz[]> => {
    try {
      const stored = await AsyncStorage.getItem('userQuizzes');
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang).catch((error) => {
      console.error('Failed to change language:', error);
    });
    // Save the language setting
    AsyncStorage.setItem('language', lang).catch((error) => {
      console.error('Failed to save language setting', error);
    });
    // No need to call setQuizzes here, effect above will handle it
  }, []);
  const setAudioEnabled = useCallback(async (enabled: boolean) => {
    setAudioEnabledState(enabled);
    try {
      await AsyncStorage.setItem('audioEnabled', String(enabled));
    } catch (error) {
      console.error('Failed to save audio setting', error);
    }
  }, []);
  const setRemoteUpdateEnabled = useCallback(async (enabled: boolean) => {
    setRemoteUpdateEnabledState(enabled);
    try {
      await AsyncStorage.setItem('remoteUpdateEnabled', String(enabled));
    } catch (error) {
      console.error('Failed to save remote update setting', error);
    }
  }, []);
  const setRemoteAdress = useCallback(async (address: string) => {
    setRemoteAddressState(address);
    try {
      await AsyncStorage.setItem('remoteAddress', address);
    } catch (error) {
      console.error('Failed to save remote address setting', error);
    }
  }, []);

  //Get todays date e.g. 12.12.2024
  const getTodaysDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Function to reset state
  const resetState = useCallback(() => {
    setSelectedQuizName(null);
    setFlashcardsEnabledState(false);
    setNotificationsEnabledState(true);
    setShowExplanationState(false);
    setQuizzes(getLocalQuizzes());
    setTotalQuestionsAnsweredState(0);
    setTotalCorrectAnswersState(0);
    setTotalWrongAnswersState(0);
    setTotalWonGamesState(0);
    setTotalLostGamesState(0);
    setAudioEnabledState(false);
    setRemoteUpdateEnabledState(false);
    setRemoteAddressState('');
    setLanguageState(i18n.language || 'en');
    setMusicEnabledState(false);
    setReaderModeEnabledState(false);
  }, []);

  // Function to check for and download updated quizzes
  const checkForQuizzesUpdate = async (): Promise<boolean> => {
    // Don't proceed if remote updates are disabled
    if (!remoteUpdateEnabled) {
      console.log('Remote updates are disabled');
      return false;
    }

    // Get the download URL with fallback to default
    const downloadUrl = remoteAddress || REMOTE_QUIZ;

    try {
      // Handle platform-specific update logic
      if (Platform.OS === 'web') {
        return await handleWebUpdate();
      } else {
        return await handleNativeUpdate(downloadUrl);
      }
    } catch (error) {
      console.error('Error checking for quizzes update:', error);
      return false;
    }
  };

  // Handle updates for native platforms (iOS & Android)
  const handleNativeUpdate = async (downloadUrl: string): Promise<boolean> => {
    try {
      const tempPath = FileSystem.documentDirectory + 'temp_quizzes.json';
      const permanentPath = FileSystem.documentDirectory + 'quizzes.json';

      // Platform-specific logging
      console.log(`Downloading quizzes on ${Platform.OS}...`);

      // Download file - iOS has stricter sandbox rules than Android
      const { status } = await FileSystem.downloadAsync(downloadUrl, tempPath);

      if (status !== 200) {
        console.log(`Failed to download quizzes file on ${Platform.OS}`);
        return false;
      }

      // Read the downloaded temp file
      const newQuizzesJson = await FileSystem.readAsStringAsync(tempPath);
      const newQuizzes = JSON.parse(newQuizzesJson);

      // Check if new quizzes are different
      const currentQuizzesJson = JSON.stringify(quizzes);
      const isNewer = currentQuizzesJson !== JSON.stringify(newQuizzes);

      if (isNewer) {
        console.log(`New quizzes found on ${Platform.OS}, updating...`);

        // iOS might need additional permissions for certain directories
        if (Platform.OS === 'ios') {
          await FileSystem.writeAsStringAsync(permanentPath, newQuizzesJson, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        } else if (Platform.OS === 'android') {
          // Android can use the same method but might have different permissions
          await FileSystem.writeAsStringAsync(permanentPath, newQuizzesJson);
        }

        // Update state
        setQuizzes(newQuizzes);
        console.log(`Quizzes updated successfully on ${Platform.OS}`);
      } else {
        console.log(`Quizzes are already up to date on ${Platform.OS}`);
      }

      // Clean up temp file
      await FileSystem.deleteAsync(tempPath);
      return isNewer;
    } catch (error) {
      console.error(`${Platform.OS} update error:`, error);
      return false;
    }
  };

  const handleWebUpdate = async (): Promise<boolean> => {
    // Inside handleWebUpdate function
    try {
      const encodedRemoteAddress = encodeURIComponent(
        remoteAddress || REMOTE_QUIZ,
      ); // Use state or default
      const response = await fetch(
        `/remoteUpdate?remoteAddress=${encodedRemoteAddress}`,
      );
      if (!response.ok) {
        // Try to get error text from backend's JSON response
        let errorText = `Failed: ${response.status} ${response.statusText}`;
        try {
          const errorJson = await response.json(); // Backend sends JSON on error
          errorText = errorJson.error || errorText;
        } catch (e) {
          // If parsing error fails, read as text
          errorText = await response.text();
        }
        console.error('Failed to download quizzes:', errorText);
        return false;
      }

      // Get the actual content type from the backend response
      const contentType = response.headers.get('content-type');
      let newQuizzesData;

      // Decide how to process based on expected content (e.g., quizzes are JSON)
      if (contentType && contentType.includes('application/json')) {
        newQuizzesData = await response.json(); // If backend confirms it's JSON
      } else {
        // If it's not JSON (or backend didn't specify), treat as text or handle other types
        const rawData = await response.text();
        console.log(
          'Downloaded raw data (assuming text/quiz format):',
          rawData,
        );
        // Attempt to parse if you still expect JSON structure within a text file
        try {
          newQuizzesData = JSON.parse(rawData);
        } catch (parseError) {
          console.error('Failed to parse downloaded data as JSON:', parseError);
          // Handle scenario where download succeeded but wasn't valid JSON
          // Maybe save the raw text, or show an error depending on requirements
          return false; // Or handle differently
        }
      }

      console.log('Processed quizzes data:', newQuizzesData);

      const currentQuizzesJson = JSON.stringify(quizzes); // Current state quizzes
      const isNewer = currentQuizzesJson !== JSON.stringify(newQuizzesData);

      if (isNewer) {
        localStorage.setItem('quizzes', JSON.stringify(newQuizzesData)); // Save updated data
        setQuizzes(newQuizzesData); // Update state
        return true;
      } else {
        console.log('Quizzes are already up to date');
        return false;
      }
    } catch (error) {
      console.error('Web update fetch/processing error:', error);
      return false;
    }
  };

  const setFlashcardsEnabled = useCallback(async (enabled: boolean) => {
    setFlashcardsEnabledState(enabled);
    try {
      await AsyncStorage.setItem('flashcardsEnabled', String(enabled));
    } catch (error) {
      console.error('Failed to save flashcards setting', error);
    }
  }, []);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    try {
      await AsyncStorage.setItem('notificationsEnabled', String(enabled));
    } catch (error) {
      console.error('Failed to save notifications setting', error);
    }
  }, []);

  const setShowExplanation = useCallback(async (show: boolean) => {
    setShowExplanationState(show);
    try {
      await AsyncStorage.setItem('showExplanation', String(show));
      console.log('Explanation setting saved:', show);
    } catch (error) {
      console.error('Failed to save explanation setting', error);
    }
  }, []);

  const setTotalQuestionsAnswered = useCallback(async (total: number) => {
    setTotalQuestionsAnsweredState(total);
    try {
      await AsyncStorage.setItem('totalQuestionsAnswered', String(total));
      console.log('Total questions answered saved:', total);
    } catch (error) {
      console.error('Failed to save total questions answered', error);
    }
  }, []);

  const setTotalCorrectAnswers = useCallback(async (total: number) => {
    setTotalCorrectAnswersState(total);
    try {
      await AsyncStorage.setItem('totalCorrectAnswers', String(total));
      console.log('Total correct answers saved:', total);
    } catch (error) {
      console.error('Failed to save total correct answers', error);
    }
  }, []);

  const setTotalWrongAnswers = useCallback(async (total: number) => {
    setTotalWrongAnswersState(total);
    try {
      await AsyncStorage.setItem('totalWrongAnswers', String(total));
      console.log('Total wrong answers saved:', total);
    } catch (error) {
      console.error('Failed to save total wrong answers', error);
    }
  }, []);

  const setTotalWonGames = useCallback(async (total: number) => {
    setTotalWonGamesState(total);
    try {
      await AsyncStorage.setItem('totalWonGames', String(total));
      console.log('Total won games saved:', total);
    } catch (error) {
      console.error('Failed to save total won games', error);
    }
  }, []);

  const setTotalLostGames = useCallback(async (total: number) => {
    setTotalLostGamesState(total);
    try {
      await AsyncStorage.setItem('totalLostGames', String(total));
      console.log('Total lost games saved:', total);
    } catch (error) {
      console.error('Failed to save total lost games', error);
    }
  }, []);

  const setLastUpdated = useCallback(async (date: string) => {
    setLastUpdateDateState(date);
    try {
      await AsyncStorage.setItem('lastUpdateDate', date);
      console.log('Last update date saved:', date);
    } catch (error) {
      console.error('Failed to save last update date', error);
    }
  }, []);

  // In your loadSettings function:
  const loadSettings = async () => {
    try {
      const notificationsSetting = await AsyncStorage.getItem(
        'notificationsEnabled',
      );
      const flashcardsSetting = await AsyncStorage.getItem('flashcardsEnabled');
      const explanationSetting = await AsyncStorage.getItem('showExplanation');
      const audioSetting = await AsyncStorage.getItem('audioEnabled');
      const remoteUpdateSetting = await AsyncStorage.getItem(
        'remoteUpdateEnabled',
      );
      const remoteAddressSetting = await AsyncStorage.getItem('remoteAddress');
      const lastUpdateDateSetting = await AsyncStorage.getItem(
        'lastUpdateDate',
      );
      const savedLanguage = await AsyncStorage.getItem('language');
      const musicSetting = await AsyncStorage.getItem('musicEnabled');
      const readerModeSetting = await AsyncStorage.getItem('readerModeEnabled');

      // Update all state values
      setNotificationsEnabledState(notificationsSetting === 'true');
      setFlashcardsEnabledState(flashcardsSetting === 'true');
      setShowExplanationState(explanationSetting === 'true');
      setAudioEnabledState(
        audioSetting === null ? true : audioSetting === 'true',
      );
      setRemoteUpdateEnabledState(remoteUpdateSetting === 'true');
      setRemoteAddressState(remoteAddressSetting || '');
      setLastUpdateDateState(lastUpdateDateSetting || null);
      setLanguageState(savedLanguage || i18n.language || 'en');
      setMusicEnabledState(musicSetting === 'true');
      setReaderModeEnabledState(readerModeSetting === 'true');
      if (savedLanguage && savedLanguage !== i18n.language) {
        i18n.changeLanguage(savedLanguage);
      }
      // Create a separate effect to handle checking for updates
    } catch (error) {
      console.error('Failed to load settings', error);
    }
    setUserQuizLoadEnabledState(
      (await AsyncStorage.getItem('userQuizLoadEnabled')) === 'true',
    );
  };

  // Add a separate useEffect that watches remoteUpdateEnabled
  useEffect(() => {
    // Only run checkForQuizzesUpdate after the initial load
    // and when remoteUpdateEnabled changes to true
    if (remoteUpdateEnabled && lastUpdateDate !== getTodaysDate()) {
      checkForQuizzesUpdate().then((updated) => {
        console.log('Quizzes updated:', updated);
        if (updated) {
          AsyncStorage.setItem('lastUpdateDate', getTodaysDate());
        }
      });
    }
  }, [remoteUpdateEnabled]); // This effect runs when remoteUpdateEnabled changes

  // --- Configuration ---
// 1. This points to the local API route at app/remoteUpdate.ts
const API_ENDPOINT_URL = '/api/remoteUpdate';
const absoluteApiEndpointUrl = `${origin}${API_ENDPOINT_URL}`;
// 2. Using the storage key from your provided snippet.
const STORAGE_KEY = 'quizzes_de';

const updateDataFromGoogleDrive = async () => {
  
  try {
    // The fetch call targets the internal route.
    const response = await fetch('https://raw.githubusercontent.com/maverock24/data/refs/heads/main/quizzes_de.json');
    
    if (!response.ok) {
      throw new Error(`API route responded with an error: ${response.statusText}`);
    }
    
    const jsonData = await response.json();
console.log('Fetched data from API route:', jsonData);
    // Save the fetched data to AsyncStorage for persistence.
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(jsonData));
    
    // Update the component's state to reflect the new data.
    setData(jsonData);
    console.log('Data successfully updated in AsyncStorage');

  } catch (error) {
    console.error('Error updating data:', error);
  } 
};

  // Load settings from AsyncStorage on component mount
  useEffect(() => {
    (async () => {
      await loadSettings();
      setIsLanguageReady(true);
    })();
    updateDataFromGoogleDrive();
  }, []);

  // Listen for i18n.language or userQuizLoadEnabled changes and update quizzes accordingly
  React.useEffect(() => {
    (async () => {
      console.log('userQuizLoadEnabled:', userQuizLoadEnabled);
      if (userQuizLoadEnabled) {
        const userQuizzes = await loadUserQuizzes();
        console.log('Loaded user quizzes:', userQuizzes);
        setQuizzes(getLocalQuizzes(userQuizzes));
      } else {
        setQuizzes(getLocalQuizzes());
      }
      setLanguageState(i18n.language);
    })();
  }, [i18n.language, userQuizLoadEnabled]);

  if (!isLanguageReady) {
    // Optionally, show a splash/loading screen or null
    return null;
  }

  return (
    <QuizContext.Provider
      value={{
        selectedQuizName,
        setSelectedQuizName,
        flashcardsEnabled,
        setFlashcardsEnabled,
        notificationsEnabled,
        setNotificationsEnabled,
        showExplanation,
        setShowExplanation,
        quizzes, // Expose quizzes through context
        checkForQuizzesUpdate, // Expose the update function
        totalQuestionsAnswered,
        setTotalQuestionsAnswered,
        totalCorrectAnswers,
        setTotalCorrectAnswers,
        totalWrongAnswers,
        setTotalWrongAnswers,
        totalWonGames,
        setTotalWonGames,
        totalLostGames,
        setTotalLostGames,
        setAudioEnabled,
        audioEnabled,
        setRemoteUpdateEnabled,
        remoteUpdateEnabled,
        setRemoteAdress,
        remoteAddress,
        resetState, // Expose the reset function
        language,
        setLanguage, // Expose the language setter
        userQuizLoadEnabled,
        setUserQuizLoadEnabled, // Expose the user quiz load setter
        musicEnabled,
        setMusicEnabled, // Expose the music enabled setter
        readerModeEnabled,
        setReaderModeEnabled, // Expose the reader mode setter
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
