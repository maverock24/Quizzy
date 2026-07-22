import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// Galloping Unicorn — runs across the screen with a bouncy gait
// ============================================================
const GallopingUnicorn: React.FC<{
  fromLeft: boolean;
  delay: number;
  size: number;
  row: number;
}> = ({ fromLeft, delay, size, row }) => {
  const x = useRef(new Animated.Value(fromLeft ? -100 : SCREEN_WIDTH + 100)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gallop across
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(x, {
        toValue: fromLeft ? SCREEN_WIDTH + 100 : -100,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();

    // Bouncy gallop — up and down rhythmically
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -15, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: -12, duration: 130, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 130, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: -10, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]),
      { iterations: 4 }
    ).start();

    // Sparkle trail
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      { iterations: 8 }
    ).start();
  }, []);

  const top = 80 + row * 100;

  return (
    <>
      {/* Sparkle trail behind */}
      <Animated.Text
        style={{
          position: 'absolute',
          top: top + 20,
          fontSize: size * 0.5,
          opacity: sparkle,
          transform: [{ translateX: Animated.subtract(x, 30) }],
        }}
      >
        ✨
      </Animated.Text>
      {/* The galloping unicorn */}
      <Animated.Text
        style={{
          position: 'absolute',
          top,
          fontSize: size,
          transform: [
            { translateX: x },
            { translateY: bounce },
            { scaleX: fromLeft ? 1 : -1 },
          ],
        }}
      >
        🦄
      </Animated.Text>
    </>
  );
};

// ============================================================
// Dancing Unicorn — center stage, hops and sparkles
// ============================================================
const DancingUnicorn: React.FC = () => {
  const scale = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance: pop in with spring
    Animated.sequence([
      Animated.delay(400),
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 80, useNativeDriver: true }),
    ]).start();

    // Happy hops
    Animated.loop(
      Animated.sequence([
        Animated.timing(hop, { toValue: -25, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0, duration: 200, easing: Easing.bounce, useNativeDriver: true }),
        Animated.delay(100),
        Animated.timing(hop, { toValue: -20, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0, duration: 180, easing: Easing.bounce, useNativeDriver: true }),
        Animated.delay(150),
        Animated.timing(hop, { toValue: -35, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0, duration: 250, easing: Easing.bounce, useNativeDriver: true }),
      ]),
      { iterations: 3 }
    ).start();

    // Little wiggle
    Animated.loop(
      Animated.sequence([
        Animated.timing(spin, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(spin, { toValue: -1, duration: 600, useNativeDriver: true }),
        Animated.timing(spin, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      { iterations: 3 }
    ).start();
  }, []);

  const wiggle = spin.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const centerX = SCREEN_WIDTH / 2 - 60;

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: centerX,
        top: 160,
        fontSize: 120,
        transform: [{ scale }, { translateY: hop }, { rotate: wiggle }],
      }}
    >
      🦄
    </Animated.Text>
  );
};

// ============================================================
// Rainbow Sweep — arcs across the screen
// ============================================================
const RainbowSweep: React.FC = () => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(progress, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, []);

  const colors = ['#FF6B6B', '#FF922B', '#FFD93D', '#6BCB77', '#4D96FF', '#845EF7'];

  return (
    <View style={styles.rainbowContainer} pointerEvents="none">
      {colors.map((color, i) => {
        const offset = i * 8;
        const arcY = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [400, 120, 400],
        });
        const arcX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, SCREEN_WIDTH + 50],
        });
        const arcOpacity = progress.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.rainbowStripe,
              {
                backgroundColor: color,
                top: Animated.add(arcY, offset),
                left: Animated.add(arcX, offset),
                opacity: arcOpacity,
                width: 80,
                height: 6,
                borderRadius: 3,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// ============================================================
// Floating Hearts — rise up gently
// ============================================================
const FloatingHearts: React.FC = () => {
  const hearts = ['💕', '💖', '💗', '💝', '🦄', '🌈', '💕', '💖'];

  return (
    <>
      {hearts.map((heart, i) => (
        <FloatingHeart key={i} emoji={heart} index={i} />
      ))}
    </>
  );
};

const FloatingHeart: React.FC<{ emoji: string; index: number }> = ({ emoji, index }) => {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const xOffset = (index - 3.5) * 45 + (Math.random() - 0.5) * 30;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(600 + index * 120),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 1500, delay: 800, useNativeDriver: true }),
        Animated.timing(y, { toValue: -250, duration: 2000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: SCREEN_WIDTH / 2 + xOffset,
        top: 350,
        fontSize: 28,
        opacity,
        transform: [{ translateY: y }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
};

// ============================================================
// Main CelebrationOverload
// ============================================================
export const CelebrationOverload: React.FC<{
  visible: boolean;
  x: number;
  y: number;
}> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Galloping unicorns across the screen */}
      <GallopingUnicorn fromLeft delay={0} size={70} row={0} />
      <GallopingUnicorn fromLeft={false} delay={600} size={60} row={1} />

      {/* Center stage dancing unicorn */}
      <DancingUnicorn />

      {/* Rainbow sweep */}
      <RainbowSweep />

      {/* Floating hearts and emojis */}
      <FloatingHearts />

      {/* Big celebration text */}
      <WooHooText />
    </View>
  );
};

// ============================================================
// WooHoo Text
// ============================================================
const WooHooText: React.FC = () => {
  const scale = useRef(new Animated.Value(0.2)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [text] = useState(() => {
    const texts = ['SUPER! 🦄', 'WOOOHOO! 🌈', 'TOLL! 🦄', 'GENIAL! 🌈', 'KLASSE! 🦄'];
    return texts[Math.floor(Math.random() * texts.length)];
  });

  useEffect(() => {
    Animated.sequence([
      Animated.delay(500),
      Animated.spring(scale, { toValue: 1.2, friction: 3, tension: 100, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.Text style={[styles.wooHoo, { opacity, transform: [{ scale }] }]}>
      {text}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  wooHoo: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    fontSize: 50,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 10,
  },
  rainbowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rainbowStripe: {
    position: 'absolute',
  },
});
