import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useTranslation } from 'react-i18next';
import { QuizzyLogo } from './QuizzyLogo';

/**
 * Shortest time the splash stays up. Without a floor it flashes for a frame,
 * because loading settings is usually faster than the eye, and a brand moment
 * that brief reads as a glitch rather than a screen. Lower it if it feels like
 * waiting.
 */
const MIN_DISPLAY_MS = 900;
const INTRO_MS = 460;
const EXIT_MS = 320;
/** Barely perceptible, but it stops the backdrop looking like a still image. */
const ZOOM_TO = 1.06;

const stars = require('../assets/images/stars.jpeg');

type AppSplashProps = {
  /** True once the app has everything it needs to render the main view. */
  ready: boolean;
  /** Called after the exit animation finishes, so the caller can unmount. */
  onDone: () => void;
};

export const AppSplash: React.FC<AppSplashProps> = ({ ready, onDone }) => {
  const { t } = useTranslation();
  const mountAt = useRef(Date.now());
  const [doneWaiting, setDoneWaiting] = useState(false);

  const intro = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const zoom = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;

  // Hand over from the native splash to this screen without a white gap.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    const reveal = () => {
      Animated.timing(intro, {
        toValue: 1,
        duration: INTRO_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // The tab screen drifts its starfield slowly; this matches that mood
      // without the twenty second loop, which nobody would see here anyway.
      Animated.timing(zoom, {
        toValue: ZOOM_TO,
        duration: MIN_DISPLAY_MS + EXIT_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();

      const breathing = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 0.95,
            duration: 780,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 780,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      breathing.start();
      return breathing;
    };

    let breathing: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled) return;
        if (reduced) {
          intro.setValue(1);
          zoom.setValue(ZOOM_TO);
        } else {
          breathing = reveal();
        }
      })
      .catch(() => {
        if (!cancelled) breathing = reveal();
      });

    return () => {
      cancelled = true;
      breathing?.stop();
    };
  }, [intro, pulse, zoom]);

  // Hold the floor, then remember that the minimum is spent.
  useEffect(() => {
    const elapsed = Date.now() - mountAt.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
    const timer = setTimeout(() => setDoneWaiting(true), remaining);
    return () => clearTimeout(timer);
  }, []);

  // Leave once loading is done and the floor is spent: fade and lift away.
  useEffect(() => {
    if (!ready || !doneWaiting) return;
    Animated.timing(fade, {
      toValue: 0,
      duration: EXIT_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [ready, doneWaiting, fade, onDone]);

  const logoStyle = {
    opacity: intro,
    transform: [
      {
        scale: intro.interpolate({
          inputRange: [0, 1],
          outputRange: [0.84, 1],
        }),
      },
      { scale: pulse },
    ],
  };

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ scale: zoom }] }]}
      >
        <ImageBackground source={stars} resizeMode="cover" style={styles.fill}>
          {/* Scrim, so the wordmark stays readable over the photo. */}
          <LinearGradient
            colors={[
              'rgba(29, 40, 54, 0.55)',
              'rgba(20, 28, 38, 0.82)',
              'rgba(15, 21, 28, 0.94)',
            ]}
            style={styles.fill}
          />
        </ImageBackground>
      </Animated.View>

      <Animated.View style={logoStyle}>
        <QuizzyLogo size={124} />
      </Animated.View>

      <Animated.Text style={[styles.wordmark, { opacity: intro }]}>
        {t('quiz_title')}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // This replaces the app rather than covering it, so it takes the whole box
    // instead of absolute-filling a parent that may not have one.
    flex: 1,
    backgroundColor: 'rgb(15, 21, 28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  wordmark: {
    marginTop: 26,
    color: 'white',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});

export default AppSplash;
