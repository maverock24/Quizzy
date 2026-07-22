import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Only unicorns and rainbows for the main celebration
const KIDS_EMOJIS = ['🦄', '🌈', '🦄', '🌈', '🦄', '🌈', '🦄', '🌈'];
const KIDS_COLORS = ['#E1BEE7', '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF922B', '#E599F7', '#20C997'];

interface CelebrationParticle {
  id: number;
  emoji: string;
  startX: number;
  startY: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  size: number;
}

export const CelebrationOverload: React.FC<{
  visible: boolean;
  x: number;
  y: number;
}> = ({ visible, x, y }) => {
  const centerX = SCREEN_WIDTH / 2;
  const centerY = 200;

  const [particles] = useState<CelebrationParticle[]>(() => {
    const p: CelebrationParticle[] = [];
    // Central unicorn/rainbow burst — fewer but bigger particles
    for (let i = 0; i < 12; i++) {
      p.push({
        id: i,
        emoji: KIDS_EMOJIS[i % KIDS_EMOJIS.length],
        startX: centerX + (Math.random() - 0.5) * 60,
        startY: centerY,
        driftX: (Math.random() - 0.5) * 180,
        driftY: -(100 + Math.random() * 200),
        duration: 1200 + Math.random() * 1000,
        delay: i * 80,
        size: 40 + Math.random() * 30,
      });
    }
    return p;
  });

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p) => (
        <CelebrationParticleView key={p.id} {...p} />
      ))}
      <WooHooText />
      <RainbowBurst x={centerX} y={centerY} />
    </View>
  );
};

const CelebrationParticleView: React.FC<CelebrationParticle> = ({
  emoji, startX, startY, driftX, driftY, duration, delay, size,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scale, { toValue: 1.4, friction: 3, tension: 80, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: driftY,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: driftX,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          delay: duration * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '30deg'],
  });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: startX - size / 2,
        top: startY,
        fontSize: size,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: spin }, { scale }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
};

// Big celebration text
const WooHooText: React.FC = () => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.2)).current;
  const [text] = useState(() => {
    const texts = ['SUPER! 🦄', 'WOOOHOOO! 🌈', 'TOLL! 🦄', 'GENIAL! 🌈', 'KLASSE! 🦄'];
    return texts[Math.floor(Math.random() * texts.length)];
  });

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.3, friction: 3, tension: 100, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -60, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[styles.wooHoo, { opacity, transform: [{ scale }, { translateY }] }]}
    >
      {text}
    </Animated.Text>
  );
};

// Rainbow burst rings
const RainbowBurst: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <>
    {[0, 1, 2, 3].map((i) => (
      <RainbowRing key={i} x={x} y={y} delay={i * 120} color={KIDS_COLORS[i]} />
    ))}
  </>
);

const RainbowRing: React.FC<{ x: number; y: number; delay: number; color: string }> = ({ x, y, delay, color }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.8, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          left: x - 80,
          top: y - 80,
          borderColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
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
    top: '35%',
    alignSelf: 'center',
    fontSize: 52,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 10,
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
  },
});
