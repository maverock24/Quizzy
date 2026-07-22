import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Extra celebration particles for kids mode
const KIDS_EMOJIS = ['🌟', '⭐', '🎉', '🎊', '💫', '✨', '🌈', '🦄', '🎀', '💖', '🏆', '👑', '🦋', '🌸', '💎'];
const KIDS_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF922B', '#E599F7', '#20C997', '#FF4081'];

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
  const [particles] = useState<CelebrationParticle[]>(() => {
    const p: CelebrationParticle[] = [];
    for (let i = 0; i < 30; i++) {
      p.push({
        id: i,
        emoji: KIDS_EMOJIS[i % KIDS_EMOJIS.length],
        startX: x + (Math.random() - 0.5) * 120,
        startY: y + (Math.random() - 0.5) * 40,
        driftX: (Math.random() - 0.5) * 200,
        driftY: -(60 + Math.random() * 150),
        duration: 800 + Math.random() * 1200,
        delay: Math.random() * 300,
        size: 18 + Math.random() * 22,
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
      <RainbowBurst x={x} y={y} />
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
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: duration - 100, useNativeDriver: true }),
      ]),
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
          delay: duration * 0.4,
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
    outputRange: ['0deg', `${360 + Math.random() * 720}deg`],
  });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: startX,
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

// Big "WOOOHOOO!" text that flies up
const WooHooText: React.FC = () => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.2, friction: 3, tension: 100, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -80, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const texts = ['SUPER!', 'WOOOHOOO!', 'TOLL!', 'GENIAL!', 'KLASSE!'];
  const text = texts[Math.floor(Math.random() * texts.length)];

  return (
    <Animated.Text
      style={[styles.wooHoo, { opacity, transform: [{ scale }, { translateY }] }]}
    >
      {text}
    </Animated.Text>
  );
};

// Rainbow burst rings
const RainbowBurst: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const rings = [0, 1, 2];
  return (
    <>
      {rings.map((i) => (
        <RainbowRing key={i} x={x} y={y} delay={i * 150} color={KIDS_COLORS[i]} />
      ))}
    </>
  );
};

const RainbowRing: React.FC<{ x: number; y: number; delay: number; color: string }> = ({ x, y, delay, color }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          left: x - 60,
          top: y - 60,
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
    top: '30%',
    alignSelf: 'center',
    fontSize: 48,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
});
