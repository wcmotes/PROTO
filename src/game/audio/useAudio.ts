import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../engine/gameStore';
import { AtmosphereType } from '../../types/game';

interface UseAudioReturn {
  playEffect: (effectType: string, volume?: number) => void;
  playSuccess: () => void;
  playError: () => void;
  playClick: () => void;
  playHover: () => void;
  playLevelComplete: () => void;
  playAtmosphereTransition: () => void;
  setMasterVolume: (volume: number) => void;
  isAudioEnabled: boolean;
}

export const useAudio = (): UseAudioReturn => {
  const { atmosphere, audioSettings, updateAudioSettings } = useGameStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const effectsCache = useRef<Map<string, AudioBuffer>>(new Map());

  // Initialize audio context
  useEffect(() => {
    if (audioSettings.enabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }, [audioSettings.enabled]);

  // Generate sound effect based on atmosphere and type
  const generateSoundEffect = useCallback((effectType: string, atmosphere: AtmosphereType): AudioBuffer | null => {
    if (!audioContextRef.current) return null;

    const cacheKey = `${effectType}_${atmosphere}`;
    if (effectsCache.current.has(cacheKey)) {
      return effectsCache.current.get(cacheKey) || null;
    }

    const sampleRate = audioContextRef.current.sampleRate;
    const duration = effectType.includes('transition') ? 2 : 0.3;
    const frameCount = sampleRate * duration;
    const audioBuffer = audioContextRef.current.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Generate different sounds based on effect type and atmosphere
    switch (effectType) {
      case 'click':
        generateClickSound(channelData, sampleRate, atmosphere);
        break;
      case 'hover':
        generateHoverSound(channelData, sampleRate, atmosphere);
        break;
      case 'success':
        generateSuccessSound(channelData, sampleRate, atmosphere);
        break;
      case 'error':
        generateErrorSound(channelData, sampleRate, atmosphere);
        break;
      case 'level_complete':
        generateLevelCompleteSound(channelData, sampleRate, atmosphere);
        break;
      case 'atmosphere_transition':
        generateTransitionSound(channelData, sampleRate, atmosphere);
        break;
      default:
        generateGenericSound(channelData, sampleRate, atmosphere);
    }

    effectsCache.current.set(cacheKey, audioBuffer);
    return audioBuffer;
  }, []);

  // Sound generation functions
  const generateClickSound = (data: Float32Array, sampleRate: number, atmosphere: AtmosphereType) => {
    const freq = getAtmosphereFrequency(atmosphere, 'click');
    const baseFreq = Array.isArray(freq) ? freq[0] : freq;
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 20);
      data[i] = Math.sin(2 * Math.PI * baseFreq * t) * envelope * 0.3;
    }
  };

  const generateHoverSound = (data: Float32Array, sampleRate: number, atmosphere: AtmosphereType) => {
    const freq = getAtmosphereFrequency(atmosphere, 'hover');
    const baseFreq = Array.isArray(freq) ? freq[0] : freq;
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 15);
      data[i] = Math.sin(2 * Math.PI * baseFreq * t) * envelope * 0.2;
    }
  };

  const generateSuccessSound = (data: Float32Array, sampleRate: number, atmosphere: AtmosphereType) => {
    const frequencies = getAtmosphereFrequency(atmosphere, 'success');
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      if (Array.isArray(frequencies)) {
        data[i] = frequencies.reduce((sum, freq, index) => {
          return sum + Math.sin(2 * Math.PI * freq * t) * envelope * (0.2 / frequencies.length);
        }, 0);
      } else {
        data[i] = Math.sin(2 * Math.PI * frequencies * t) * envelope * 0.3;
      }
    }
  };

  const generateErrorSound = (data: Float32Array, sampleRate: number, atmosphere: AtmosphereType) => {
    const freq = getAtmosphereFrequency(atmosphere, 'error');
    const baseFreq = Array.isArray(freq) ? freq[0] : freq;
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 12);
      const vibrato = 1 + 0.1 * Math.sin(2 * Math.PI * 5 * t);
      data[i] = Math.sin(2 * Math.PI * baseFreq * vibrato * t) * envelope * 0.4;
    }
  };

  const generateLevelCompleteSound = (data: Float32Array, sampleRate: number, atmosphere: AtmosphereType) => {
    const frequencies = getAtmosphereFrequency(atmosphere, 'level_complete');
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3);
      if (Array.isArray(frequencies)) {
        data[i] = frequencies.reduce((sum, freq, index) => {
          const delay = index * 0.1;
          const delayedT = Math.max(0, t - delay);
          return sum + Math.sin(2 * Math.PI * freq * delayedT) * 
                 Math.exp(-delayedT * 3) * (0.3 / frequencies.length);
        }, 0);
      } else {
        data[i] = Math.sin(2 * Math.PI * frequencies * t) * envelope * 0.4;
      }
    }
  };

  const generateTransitionSound = (data: Float32Array, sampleRate: number, atmosphere: AtmosphereType) => {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const progress = t / 2; // 2 second duration
      
      switch (atmosphere) {
        case 'cheerful':
          data[i] = Math.sin(2 * Math.PI * (200 + 300 * progress) * t) * (1 - progress) * 0.3;
          break;
        case 'neutral':
          data[i] = Math.sin(2 * Math.PI * (150 + 100 * progress) * t) * (1 - progress) * 0.2;
          break;
        case 'unsettling':
          data[i] = Math.sin(2 * Math.PI * (100 - 50 * progress) * t) * (1 - progress) * 0.4 +
                   (Math.random() * 2 - 1) * 0.1 * progress;
          break;
        case 'dark_transition':
          data[i] = Math.sin(2 * Math.PI * (80 - 40 * progress) * t) * (1 - progress) * 0.5 +
                   (Math.random() * 2 - 1) * 0.2 * progress;
          break;
        case 'horror':
          data[i] = Math.sin(2 * Math.PI * (60 - 30 * progress) * t) * (1 - progress) * 0.6 +
                   (Math.random() * 2 - 1) * 0.3 * progress;
          break;
      }
    }
  };

  const generateGenericSound = (data: Float32Array, sampleRate: number, atmosphere: AtmosphereType) => {
    const freq = getAtmosphereFrequency(atmosphere, 'generic');
    const baseFreq = Array.isArray(freq) ? freq[0] : freq;
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 10);
      data[i] = Math.sin(2 * Math.PI * baseFreq * t) * envelope * 0.2;
    }
  };

  // Get frequency based on atmosphere and effect type
  const getAtmosphereFrequency = (atmosphere: AtmosphereType, effectType: string): number | number[] => {
    const frequencyMap = {
      cheerful: {
        click: 800,
        hover: 600,
        success: [523, 659, 784], // C major chord
        error: 300,
        level_complete: [523, 659, 784, 1047], // C major arpeggio
        generic: 440
      },
      neutral: {
        click: 500,
        hover: 400,
        success: [440, 554, 659], // A minor chord
        error: 250,
        level_complete: [440, 554, 659, 880],
        generic: 350
      },
      unsettling: {
        click: 300,
        hover: 250,
        success: [415, 466, 554], // Slightly detuned
        error: 200,
        level_complete: [415, 466, 554, 830],
        generic: 280
      },
      dark_transition: {
        click: 200,
        hover: 180,
        success: [220, 277, 330], // Lower, darker tones
        error: 150,
        level_complete: [220, 277, 330, 440],
        generic: 200
      },
      horror: {
        click: 100,
        hover: 90,
        success: [110, 138, 165], // Very low, ominous
        error: 80,
        level_complete: [110, 138, 165, 220],
        generic: 120
      }
    };

    return frequencyMap[atmosphere][effectType as keyof typeof frequencyMap[typeof atmosphere]] || 440;
  };

  // Play sound effect
  const playEffect = useCallback((effectType: string, volume: number = 1) => {
    if (!audioSettings.enabled || !audioContextRef.current) return;

    const audioBuffer = generateSoundEffect(effectType, atmosphere);
    if (!audioBuffer) return;

    const source = audioContextRef.current.createBufferSource();
    const gainNode = audioContextRef.current.createGain();
    
    source.buffer = audioBuffer;
    gainNode.gain.setValueAtTime(
      volume * (audioSettings.masterVolume || 1),
      audioContextRef.current.currentTime
    );
    
    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    source.start();
    
    // Cleanup
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  }, [atmosphere, audioSettings.enabled, audioSettings.masterVolume, generateSoundEffect]);

  // Convenience methods
  const playSuccess = useCallback(() => playEffect('success'), [playEffect]);
  const playError = useCallback(() => playEffect('error'), [playEffect]);
  const playClick = useCallback(() => playEffect('click', 0.5), [playEffect]);
  const playHover = useCallback(() => playEffect('hover', 0.3), [playEffect]);
  const playLevelComplete = useCallback(() => playEffect('level_complete'), [playEffect]);
  const playAtmosphereTransition = useCallback(() => playEffect('atmosphere_transition'), [playEffect]);

  const setMasterVolume = useCallback((volume: number) => {
    updateAudioSettings({ masterVolume: Math.max(0, Math.min(1, volume)) });
  }, [updateAudioSettings]);

  return {
    playEffect,
    playSuccess,
    playError,
    playClick,
    playHover,
    playLevelComplete,
    playAtmosphereTransition,
    setMasterVolume,
    isAudioEnabled: audioSettings.enabled
  };
};

export default useAudio;