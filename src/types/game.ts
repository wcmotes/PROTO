// Core game types for the mysterious puzzle game

export type AtmosphereType = 'cheerful' | 'neutral' | 'unsettling' | 'dark_transition' | 'horror';

export type PuzzleType = 'sliding_tiles' | 'pattern_match' | 'logic_grid' | 'memory_sequence' | 'complex_logic' | 'timed_pressure' | 'psychological';

export interface GameState {
  currentLevel: number;
  puzzleState: PuzzleData;
  atmosphere: AtmosphereType;
  storyProgress: StoryFragment[];
  playerProgress: ProgressData;
  audioSettings: AudioConfig & { enabled: boolean };
}

export interface PuzzleData {
  type: PuzzleType;
  difficulty: number;
  grid: any[][];
  solution: any[][];
  moves: number;
  timeLimit?: number;
  isCompleted: boolean;
}

export interface StoryFragment {
  id: string;
  level: number;
  text: string;
  atmosphereHint?: AtmosphereType;
  displayDuration?: number;
}

export interface ProgressData {
  completedLevels: number[];
  currentLevel: number;
  totalMoves: number;
  totalTime: number;
  achievementsUnlocked: string[];
  storyFragmentsSeen: string[];
}

export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  currentTrack?: string;
  atmosphereAudio?: string;
}

export interface LevelConfig {
  levelNumber: number;
  puzzleType: PuzzleType;
  difficultyRating: number;
  atmosphereTheme: AtmosphereType;
  visualConfig: VisualConfig;
  audioConfig: Partial<AudioConfig>;
  storyFragment?: string;
  unlockRequirements?: any;
}

export interface VisualConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  shadowIntensity: number;
  glitchEffect: boolean;
  particleCount: number;
}

export interface GameSettings {
  audio: AudioConfig;
  graphics: {
    brightness: number;
    contrast: number;
    fullscreen: boolean;
    particleEffects: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

// Event types for game interactions
export interface GameEvent {
  type: 'LEVEL_COMPLETE' | 'PUZZLE_MOVE' | 'STORY_FRAGMENT' | 'ATMOSPHERE_CHANGE' | 'AUDIO_TRIGGER';
  payload: any;
  timestamp: number;
}

// Canvas rendering types
export interface CanvasElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  visible: boolean;
}

export interface PuzzleTile extends CanvasElement {
  value: any;
  isCorrect: boolean;
  isSelected: boolean;
  animationState?: 'idle' | 'moving' | 'glitching' | 'corrupting';
}

// Audio types
export interface SoundEffect {
  id: string;
  src: string;
  volume: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

export interface BackgroundMusic extends SoundEffect {
  atmosphereType: AtmosphereType;
  crossfadeDuration: number;
}