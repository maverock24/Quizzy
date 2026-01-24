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
import { GamificationProvider, AchievementModal } from '@/components/gamification';
import { Music } from '@/components/Music';
import i18n from '@/components/i18n';

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
      // Wait for window to fully load before registering SW
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          console.log('[App] Service Worker registered with scope:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[App] New content available, please refresh.');
                }
              });
            }
          });
        } catch (error) {
          console.error('[App] Service Worker registration failed:', error);
        }
      };

      // Register after page fully loads
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
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
        <GamificationProvider>
          <MusicFromContext />
          <AchievementModal />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </GamificationProvider>
      </QuizProvider>
    </ThemeProvider>
  );
}

