import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';

/** One item's delay, so a screen reads as a single gesture rather than a burst. */
const STAGGER_MS = 55;
/** The twentieth row should not wait over a second. */
const MAX_STEPS = 8;
const DURATION_MS = 340;
const BASE_DELAY_MS = 60;
/** How far off to the left a button starts. */
const DISTANCE = 44;

type EntranceProps = {
  /** Position in the sequence, top to bottom. */
  index?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Slides its children in from the left, fading as it goes, once on mount.
 * Honours the OS "reduce motion" setting, in which case content simply appears.
 */
export function Entrance({ index = 0, children, style }: EntranceProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    const play = () => {
      if (cancelled) return;
      Animated.timing(progress, {
        toValue: 1,
        duration: DURATION_MS,
        delay: BASE_DELAY_MS + Math.min(index, MAX_STEPS) * STAGGER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => (reduced ? progress.setValue(1) : play()))
      .catch(play);

    return () => {
      cancelled = true;
    };
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-DISTANCE, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default Entrance;
