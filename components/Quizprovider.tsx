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
import { Quiz } from './types';
import { REMOTE_QUIZ } from '@/constants/Urls';
import { Platform } from 'react-native';

// Load local quizzes file
const localQuizzes = require('../assets/quizzes.json');

type QuizContextType = {
  selectedQuizName: string | null;
  setSelectedQuizName: (name: string | null) => void;
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
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedQuizName, setSelectedQuizName] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<
    boolean
  >(true);
  const [showExplanation, setShowExplanationState] = useState<boolean>(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>(localQuizzes);
  const [totalQuestionsAnswered, setTotalQuestionsAnsweredState] = useState<
    number
  >(0);
  const [totalCorrectAnswers, setTotalCorrectAnswersState] = useState<number>(
    0,
  );
  const [totalWrongAnswers, setTotalWrongAnswersState] = useState<number>(0);
  const [totalWonGames, setTotalWonGamesState] = useState<number>(0);
  const [totalLostGames, setTotalLostGamesState] = useState<number>(0);
  const [audioEnabled, setAudioEnabledState] = useState<boolean>(false);
  const [remoteUpdateEnabled, setRemoteUpdateEnabledState] =
    useState<boolean>(false);
  const [remoteAddress, setRemoteAddressState] = useState<string>('');
  const setAudioEnabled = useCallback(async (enabled: boolean) => {
    setAudioEnabledState(enabled);
    try {
      await AsyncStorage.setItem('audioEnabled', String(enabled));
      console.log('Audio setting saved:', enabled);
    } catch (error) {
      console.error('Failed to save audio setting', error);
    }
  }
  , []);
  const setRemoteUpdateEnabled = useCallback(async (enabled: boolean) => {
    setRemoteUpdateEnabledState(enabled);
    try {
      await AsyncStorage.setItem('remoteUpdateEnabled', String(enabled));
      console.log('Remote update setting saved:', enabled);
    } catch (error) {
      console.error('Failed to save remote update setting', error);
    }
  }
  , []);
  const setRemoteAdress = useCallback(async (address: string) => {
    setRemoteAddressState(address);
    try {
      await AsyncStorage.setItem('remoteAddress', address);
      console.log('Remote address setting saved:', address);
    } catch (error) {
      console.error('Failed to save remote address setting', error);
    }
  }
  , []);

  // Function to reset state
  const resetState = useCallback(() => {
    setSelectedQuizName(null);
    setNotificationsEnabledState(true);
    setShowExplanationState(false);
    setQuizzes(localQuizzes);
    setTotalQuestionsAnsweredState(0);
    setTotalCorrectAnswersState(0);
    setTotalWrongAnswersState(0);
    setTotalWonGamesState(0);
    setTotalLostGamesState(0);
    setAudioEnabledState(false);
    setRemoteUpdateEnabledState(false);
    setRemoteAddressState('');
  }, []);

  // Function to check for and download updated quizzes
const checkForQuizzesUpdate = async (): Promise<boolean> => {
  // Don't proceed if remote updates are disabled
  console.log('Checking for quizzes update...');
  if (!remoteUpdateEnabled) {
    console.log('Remote updates are disabled');
    return false;
  }
  
  // Get the download URL with fallback to default
  const downloadUrl = remoteAddress || REMOTE_QUIZ;
  
  try {
    // Handle platform-specific update logic
    if (Platform.OS === 'web') {
      return await handleWebUpdate(downloadUrl);
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
          encoding: FileSystem.EncodingType.UTF8
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

// Handle updates for web platform
const handleWebUpdate = async (downloadUrl: string): Promise<boolean> => {
  try {
    console.log('Downloading quizzes in web browser...');
    
    // Web platforms need to use fetch API instead of FileSystem
    const response = await fetch('/remote?remoteAddress=' + encodeURIComponent(downloadUrl));
    if (!response.ok) {
      console.log('Failed to download quizzes file in browser');
      return false;
    }
    
    const newQuizzesJson = await response.text();
    const newQuizzes = JSON.parse(newQuizzesJson);
    
    // Check if new quizzes are different
    const currentQuizzesJson = JSON.stringify(quizzes);
    const isNewer = currentQuizzesJson !== JSON.stringify(newQuizzes);
    
    if (isNewer) {
      console.log('New quizzes found in browser, updating...');
      
      // Save to localStorage for web
      localStorage.setItem('quizzes', newQuizzesJson);
      
      // Update state
      setQuizzes(newQuizzes);
      console.log('Quizzes updated successfully in browser');
      return true;
    }
    
    console.log('Quizzes are already up to date in browser');
    return false;
  } catch (error) {
    console.error('Web update error:', error);
    return false;
  }
};

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    try {
      await AsyncStorage.setItem('notificationsEnabled', String(enabled));
      console.log('Notifications setting saved:', enabled);
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

  // In your loadSettings function:
const loadSettings = async () => {
  try {
    const notificationsSetting = await AsyncStorage.getItem('notificationsEnabled');
    const explanationSetting = await AsyncStorage.getItem('showExplanation');
    const audioSetting = await AsyncStorage.getItem('audioEnabled');
    const remoteUpdateSetting = await AsyncStorage.getItem('remoteUpdateEnabled');
    const remoteAddressSetting = await AsyncStorage.getItem('remoteAddress');
    
    console.log('remoteUpdateSetting', remoteUpdateSetting);
    
    // Update all state values
    setNotificationsEnabledState(notificationsSetting === 'true');
    setShowExplanationState(explanationSetting === 'true');
    setAudioEnabledState(audioSetting === 'true');
    setRemoteUpdateEnabledState(remoteUpdateSetting === 'true');
    setRemoteAddressState(remoteAddressSetting || '');

    // Create a separate effect to handle checking for updates
  } catch (error) {
    console.error('Failed to load settings', error);
  }
};

// Add a separate useEffect that watches remoteUpdateEnabled
useEffect(() => {
  // Only run checkForQuizzesUpdate after the initial load
  // and when remoteUpdateEnabled changes to true
  if (remoteUpdateEnabled) {
    console.log('Remote updates enabled, checking for updates...');
    checkForQuizzesUpdate();
  }
}, [remoteUpdateEnabled]); // This effect runs when remoteUpdateEnabled changes

// Load settings from AsyncStorage on component mount
useEffect(() => {
  loadSettings();
  console.log('Settings loaded');
}, []);

  return (
    <QuizContext.Provider
      value={{
        selectedQuizName,
        setSelectedQuizName,
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
