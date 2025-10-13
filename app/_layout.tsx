import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Theme, ThemeProvider } from '@react-navigation/native';
import { DarkTheme } from '@react-navigation/native/src/theming/DarkTheme';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { I18nextProvider } from 'react-i18next';
import { Platform } from 'react-native';

import { QuizProvider } from '@/components/Quizprovider';
import { Music } from '@/components/Music';
import i18n from '@/components/i18n';
import { OfflineIndicator } from '@/components/OfflineIndicator';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Register service worker for web
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <OfflineIndicator />
      <RootLayoutNav />
    </I18nextProvider>
  );
}

function MusicFromContext() {
  const { musicEnabled } = require('@/components/Quizprovider').useQuiz();
  return <Music enabled={musicEnabled} />;
}

function RootLayoutNav() {
  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: 'transparent',
    },
  };
  return (
    <ThemeProvider value={CustomDarkTheme}>
      <QuizProvider>
        <MusicFromContext />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </QuizProvider>
    </ThemeProvider>
  );
}
