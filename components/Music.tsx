import React, { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export const Music: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    async function playMusic() {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/elevator_music.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
      await sound.setVolumeAsync(0.2); // Lower volume
      await sound.playAsync();
    }
    async function stopMusic() {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    }
    if (enabled) {
      playMusic();
    } else {
      stopMusic();
    }
    return () => {
      stopMusic();
    };
  }, [enabled]);

  return null;
};
