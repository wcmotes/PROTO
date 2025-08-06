import { LevelConfig, AtmosphereType, PuzzleType } from '../../types/game';

// Color schemes for different atmosphere levels
const atmosphereColors = {
  cheerful: {
    primaryColor: '#FFE5B4',
    secondaryColor: '#B4E5FF',
    backgroundColor: '#E5FFB4',
    textColor: '#2D3748',
    shadowIntensity: 0.1,
    glitchEffect: false,
    particleCount: 20,
  },
  neutral: {
    primaryColor: '#E2E8F0',
    secondaryColor: '#CBD5E0',
    backgroundColor: '#F7FAFC',
    textColor: '#4A5568',
    shadowIntensity: 0.2,
    glitchEffect: false,
    particleCount: 15,
  },
  unsettling: {
    primaryColor: '#D69E2E',
    secondaryColor: '#B7791F',
    backgroundColor: '#FFF5E6',
    textColor: '#744210',
    shadowIntensity: 0.4,
    glitchEffect: false,
    particleCount: 10,
  },
  dark_transition: {
    primaryColor: '#4A5568',
    secondaryColor: '#2D3748',
    backgroundColor: '#1A202C',
    textColor: '#E2E8F0',
    shadowIntensity: 0.6,
    glitchEffect: true,
    particleCount: 5,
  },
  horror: {
    primaryColor: '#2C1810',
    secondaryColor: '#1A1A2E',
    backgroundColor: '#16213E',
    textColor: '#F56565',
    shadowIntensity: 0.8,
    glitchEffect: true,
    particleCount: 3,
  },
};

// Story fragments for each level
const storyFragments: Record<number, string> = {
  1: 'Welcome to a world of colorful puzzles...',
  2: 'Everything seems so bright and happy here.',
  3: 'The patterns are becoming more interesting...',
  4: 'Something feels... different today.',
  5: 'Did the colors always look this way?',
  6: 'The shadows seem longer than before.',
  7: 'There\'s a whisper in the silence between moves.',
  8: 'The tiles feel cold under your touch.',
  9: 'Time moves strangely in this place.',
  10: 'The shadows are growing longer...',
  11: 'You hear something that isn\'t there.',
  12: 'The patterns are watching you.',
  13: 'Reality flickers at the edges.',
  14: 'The game remembers your mistakes.',
  15: 'Time is running out. Always running out.',
  16: 'The darkness has a voice now.',
  17: 'You are not alone in this space.',
  18: 'The puzzles solve themselves sometimes.',
  19: 'Your reflection moves wrong.',
  20: 'You should not have come this far.',
  21: 'There is no escape through completion.',
  22: 'The game plays you now.',
  23: 'Every move echoes in the void.',
  24: 'The end is just another beginning.',
  25: 'Welcome to forever.',
};

// Generate level configurations
export const levelConfigs: LevelConfig[] = Array.from({ length: 25 }, (_, index) => {
  const levelNumber = index + 1;
  
  // Determine atmosphere based on level
  let atmosphereTheme: AtmosphereType;
  if (levelNumber <= 5) atmosphereTheme = 'cheerful';
  else if (levelNumber <= 10) atmosphereTheme = 'neutral';
  else if (levelNumber <= 15) atmosphereTheme = 'unsettling';
  else if (levelNumber <= 20) atmosphereTheme = 'dark_transition';
  else atmosphereTheme = 'horror';
  
  // Determine puzzle type based on level and atmosphere
  let puzzleType: PuzzleType;
  if (levelNumber <= 5) {
    puzzleType = levelNumber % 2 === 1 ? 'sliding_tiles' : 'pattern_match';
  } else if (levelNumber <= 10) {
    const types: PuzzleType[] = ['sliding_tiles', 'pattern_match', 'logic_grid'];
    puzzleType = types[levelNumber % 3];
  } else if (levelNumber <= 15) {
    const types: PuzzleType[] = ['logic_grid', 'memory_sequence', 'complex_logic'];
    puzzleType = types[levelNumber % 3];
  } else if (levelNumber <= 20) {
    const types: PuzzleType[] = ['complex_logic', 'timed_pressure'];
    puzzleType = types[levelNumber % 2];
  } else {
    puzzleType = 'psychological';
  }
  
  // Calculate difficulty (1-10 scale)
  const difficultyRating = Math.min(Math.floor(levelNumber / 3) + 1, 10);
  
  return {
    levelNumber,
    puzzleType,
    difficultyRating,
    atmosphereTheme,
    visualConfig: atmosphereColors[atmosphereTheme],
    audioConfig: {
      musicVolume: atmosphereTheme === 'horror' ? 0.3 : 0.5,
      sfxVolume: atmosphereTheme === 'cheerful' ? 0.8 : 0.6,
    },
    storyFragment: storyFragments[levelNumber],
    unlockRequirements: {
      previousLevelCompleted: levelNumber > 1 ? levelNumber - 1 : null,
      minimumMoves: levelNumber > 10 ? Math.floor(levelNumber * 1.5) : null,
    },
  };
});

// Helper functions
export const getLevelConfig = (level: number): LevelConfig | undefined => {
  return levelConfigs.find(config => config.levelNumber === level);
};

export const getAtmosphereForLevel = (level: number): AtmosphereType => {
  const config = getLevelConfig(level);
  return config?.atmosphereTheme || 'cheerful';
};

export const getStoryFragment = (level: number): string | undefined => {
  return storyFragments[level];
};

export const getStoryFragmentForLevel = (level: number): { id: string; text: string; level: number } | undefined => {
  const text = storyFragments[level];
  if (!text) return undefined;
  
  return {
    id: `story_${level}`,
    text,
    level
  };
};

export const isLevelUnlocked = (level: number, completedLevels: number[]): boolean => {
  if (level === 1) return true;
  return completedLevels.includes(level - 1);
};

// Atmosphere transition helpers
export const shouldTriggerAtmosphereChange = (fromLevel: number, toLevel: number): boolean => {
  const fromAtmosphere = getAtmosphereForLevel(fromLevel);
  const toAtmosphere = getAtmosphereForLevel(toLevel);
  return fromAtmosphere !== toAtmosphere;
};

export const getAtmosphereTransitionDuration = (fromAtmosphere: AtmosphereType, toAtmosphere: AtmosphereType): number => {
  // Return transition duration in milliseconds
  const transitions: Record<string, number> = {
    'cheerful->neutral': 2000,
    'neutral->unsettling': 3000,
    'unsettling->dark_transition': 4000,
    'dark_transition->horror': 5000,
  };
  
  const key = `${fromAtmosphere}->${toAtmosphere}`;
  return transitions[key] || 2000;
};