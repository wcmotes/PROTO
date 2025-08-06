import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../engine/gameStore';
import { AtmosphereType } from '../../types/game';

interface AudioManagerProps {
  children?: React.ReactNode;
}

interface SoundEffect {
  id: string;
  type: 'ambient' | 'effect' | 'music';
  volume: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

interface AtmosphereAudio {
  ambient: string[];
  effects: string[];
  music?: string;
  volume: number;
}

const AudioManager: React.FC<AudioManagerProps> = ({ children }) => {
  const { atmosphere, audioSettings, currentLevel } = useGameStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentAmbient, setCurrentAmbient] = useState<HTMLAudioElement | null>(null);
  const [currentMusic, setCurrentMusic] = useState<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const effectsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize Web Audio API
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Create audio context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create master gain node
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        
        setIsInitialized(true);
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
        setIsInitialized(false);
      }
    };

    initializeAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update master volume
  useEffect(() => {
    if (gainNodeRef.current && audioSettings.masterVolume !== undefined) {
      gainNodeRef.current.gain.setValueAtTime(
        audioSettings.masterVolume,
        audioContextRef.current?.currentTime || 0
      );
    }
  }, [audioSettings.masterVolume]);

  // Generate procedural audio based on atmosphere
  const generateAtmosphereAudio = (atmosphere: AtmosphereType): AtmosphereAudio => {
    const audioConfigs = {
      cheerful: {
        ambient: ['birds', 'gentle_wind', 'soft_chimes'],
        effects: ['success_chime', 'button_click', 'puzzle_complete'],
        volume: 0.3
      },
      neutral: {
        ambient: ['room_tone', 'subtle_hum'],
        effects: ['click', 'success', 'error'],
        volume: 0.2
      },
      unsettling: {
        ambient: ['distant_wind', 'creaking', 'subtle_whispers'],
        effects: ['unsettling_click', 'ominous_success', 'warning_tone'],
        volume: 0.4
      },
      dark_transition: {
        ambient: ['deep_drone', 'echoing_drops', 'distant_thunder'],
        effects: ['dark_click', 'hollow_success', 'ominous_error'],
        volume: 0.5
      },
      horror: {
        ambient: ['horror_drone', 'whispers', 'heartbeat', 'static'],
        effects: ['horror_click', 'scream_success', 'terror_error'],
        music: 'horror_theme',
        volume: 0.6
      }
    };

    return audioConfigs[atmosphere];
  };

  // Create procedural audio using Web Audio API
  const createProceduralAudio = (type: string, duration: number = 2): AudioBuffer | null => {
    if (!audioContextRef.current) return null;

    const sampleRate = audioContextRef.current.sampleRate;
    const frameCount = sampleRate * duration;
    const audioBuffer = audioContextRef.current.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    switch (type) {
      case 'birds':
        // Generate bird-like chirping sounds
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate;
          channelData[i] = Math.sin(2 * Math.PI * (800 + 400 * Math.sin(t * 10)) * t) * 
                          Math.exp(-t * 2) * 0.1 * (Math.random() * 0.5 + 0.5);
        }
        break;

      case 'gentle_wind':
        // Generate wind-like noise
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = (Math.random() * 2 - 1) * 0.05 * 
                          (1 + Math.sin(i / sampleRate * 0.5));
        }
        break;

      case 'deep_drone':
        // Generate low-frequency drone
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate;
          channelData[i] = Math.sin(2 * Math.PI * 60 * t) * 0.3 + 
                          Math.sin(2 * Math.PI * 90 * t) * 0.2 + 
                          (Math.random() * 2 - 1) * 0.05;
        }
        break;

      case 'horror_drone':
        // Generate unsettling horror drone
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate;
          const freq1 = 40 + 20 * Math.sin(t * 0.3);
          const freq2 = 66.6 + 13.3 * Math.sin(t * 0.7);
          channelData[i] = Math.sin(2 * Math.PI * freq1 * t) * 0.4 + 
                          Math.sin(2 * Math.PI * freq2 * t) * 0.3 + 
                          (Math.random() * 2 - 1) * 0.1;
        }
        break;

      case 'whispers':
        // Generate whisper-like sounds
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate;
          channelData[i] = (Math.random() * 2 - 1) * 0.15 * 
                          Math.sin(t * 2 * Math.PI * 0.5) * 
                          (1 + Math.sin(t * 15));
        }
        break;

      case 'heartbeat':
        // Generate heartbeat rhythm
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate;
          const beat = Math.floor(t * 1.2) % 2; // 72 BPM
          const beatTime = (t * 1.2) % 1;
          if (beatTime < 0.1) {
            channelData[i] = Math.sin(2 * Math.PI * 60 * t) * 
                            Math.exp(-beatTime * 20) * 0.3;
          } else if (beatTime < 0.2 && beat === 0) {
            channelData[i] = Math.sin(2 * Math.PI * 80 * t) * 
                            Math.exp(-(beatTime - 0.1) * 30) * 0.2;
          } else {
            channelData[i] = 0;
          }
        }
        break;

      default:
        // Generate simple tone
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
        }
    }

    return audioBuffer;
  };

  // Play procedural audio
  const playProceduralAudio = (type: string, loop: boolean = false, volume: number = 1): AudioBufferSourceNode | null => {
    if (!audioContextRef.current || !gainNodeRef.current) return null;

    const audioBuffer = createProceduralAudio(type);
    if (!audioBuffer) return null;

    const source = audioContextRef.current.createBufferSource();
    const gainNode = audioContextRef.current.createGain();
    
    source.buffer = audioBuffer;
    source.loop = loop;
    gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    
    source.connect(gainNode);
    gainNode.connect(gainNodeRef.current);
    
    source.start();
    
    return source;
  };

  // Handle atmosphere changes
  useEffect(() => {
    if (!isInitialized || !audioSettings.enabled) return;

    const handleAtmosphereChange = async () => {
      setIsTransitioning(true);
      
      // Fade out current audio
      if (currentAmbient) {
        const fadeOutDuration = 1;
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.exponentialRampToValueAtTime(
            0.001,
            (audioContextRef.current?.currentTime || 0) + fadeOutDuration
          );
        }
        
        setTimeout(() => {
          currentAmbient.pause();
          setCurrentAmbient(null);
        }, fadeOutDuration * 1000);
      }

      // Wait for fade out
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Start new atmosphere audio
      const atmosphereConfig = generateAtmosphereAudio(atmosphere);
      
      if (atmosphereConfig.ambient.length > 0) {
        const ambientType = atmosphereConfig.ambient[Math.floor(Math.random() * atmosphereConfig.ambient.length)];
        const ambientSource = playProceduralAudio(ambientType, true, atmosphereConfig.volume);
        
        if (ambientSource && gainNodeRef.current) {
          // Fade in new audio
          gainNodeRef.current.gain.setValueAtTime(0.001, audioContextRef.current?.currentTime || 0);
          gainNodeRef.current.gain.exponentialRampToValueAtTime(
            atmosphereConfig.volume * (audioSettings.masterVolume || 1),
            (audioContextRef.current?.currentTime || 0) + 2
          );
        }
      }
      
      setIsTransitioning(false);
    };

    handleAtmosphereChange();
  }, [atmosphere, isInitialized, audioSettings.enabled]);

  // Play sound effect
  const playSoundEffect = (effectType: string) => {
    if (!isInitialized || !audioSettings.enabled) return;
    
    const atmosphereConfig = generateAtmosphereAudio(atmosphere);
    const effectSource = playProceduralAudio(effectType, false, 0.5);
    
    // Auto-cleanup after effect finishes
    if (effectSource) {
      effectSource.onended = () => {
        effectSource.disconnect();
      };
    }
  };

  // Expose audio functions to global scope for puzzle components
  useEffect(() => {
    (window as any).gameAudio = {
      playEffect: playSoundEffect,
      setVolume: (volume: number) => {
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current?.currentTime || 0);
        }
      }
    };

    return () => {
      delete (window as any).gameAudio;
    };
  }, [isInitialized]);

  // Audio visualization for horror atmosphere
  const renderAudioVisualization = () => {
    if (atmosphere !== 'horror' || !audioSettings.enabled) return null;

    return (
      <div className="fixed bottom-4 left-4 z-30 pointer-events-none">
        <div className="flex space-x-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 opacity-60"
              style={{
                height: `${Math.random() * 20 + 5}px`,
                animation: `pulse ${0.5 + Math.random() * 0.5}s infinite alternate`
              }}
            />
          ))}
        </div>
        <div className="text-xs text-red-400 mt-1 opacity-75">
          {isTransitioning ? 'Transitioning...' : 'Audio Active'}
        </div>
      </div>
    );
  };

  return (
    <>
      {children}
      {renderAudioVisualization()}
      
      {/* Audio status indicator */}
      {audioSettings.enabled && (
        <div className="fixed top-4 right-4 z-30 pointer-events-none">
          <div 
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: atmosphere === 'horror' ? '#2C1810' : 
                             atmosphere === 'dark_transition' ? '#4A5568' : '#E2E8F0',
              color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C',
              opacity: 0.7
            }}
          >
            🔊 {Math.round((audioSettings.masterVolume || 1) * 100)}%
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </>
  );
};

export default AudioManager;