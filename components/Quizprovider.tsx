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

  // Function to check for and download updated quizzes
  const checkForQuizzesUpdate = async (): Promise<boolean> => {
    try {
      // Google Drive direct download link
      // Note: This link transformation might need adjustment based on your actual Google Drive setup
      const downloadUrl =
        'https://drive.google.com/uc?export=download&id=15uhq_YATQvPQ8QPlson-pUE_2_1OrShE';

      // Fetch the remote file
      console.log('Checking for quizzes update...');
      const { status } = await FileSystem.downloadAsync(
        downloadUrl,
        FileSystem.documentDirectory + 'temp_quizzes.json',
      );

      if (status !== 200) {
        console.log('Failed to download quizzes file');
        return false;
      }

      // Read the downloaded temp file
      const newQuizzesJson = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + 'temp_quizzes.json',
      );
      const newQuizzes = JSON.parse(newQuizzesJson);

      // Check if new quizzes are different from current ones
      const currentQuizzesJson = JSON.stringify(quizzes);
      const isNewer = currentQuizzesJson !== JSON.stringify(newQuizzes);

      if (isNewer) {
        console.log('New quizzes version found, updating...');

        // Save to assets directory (may require additional permissions)
        const assetsPath = FileSystem.documentDirectory + 'quizzes.json';
        await FileSystem.writeAsStringAsync(assetsPath, newQuizzesJson);

        // Update the state with new quizzes
        setQuizzes(newQuizzes);
        console.log('Quizzes updated successfully');

        // Clean up temp file
        await FileSystem.deleteAsync(
          FileSystem.documentDirectory + 'temp_quizzes.json',
        );
        return true;
      }

      console.log('Quizzes are already up to date');
      // Clean up temp file
      await FileSystem.deleteAsync(
        FileSystem.documentDirectory + 'temp_quizzes.json',
      );
      return false;
    } catch (error) {
      console.error('Error checking for quizzes update:', error);
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

  const loadSettings = async () => {
    try {
      const notificationsSetting = await AsyncStorage.getItem(
        'notificationsEnabled',
      );
      const explanationSetting = await AsyncStorage.getItem('showExplanation');

      setNotificationsEnabled(notificationsSetting === 'true');
      setShowExplanation(explanationSetting === 'true');

      // Check for quizzes update on app load
      await checkForQuizzesUpdate();
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

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
