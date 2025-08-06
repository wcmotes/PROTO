import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { GameState, AtmosphereType, PuzzleData, ProgressData, AudioConfig, StoryFragment } from '../../types/game';

interface GameStore extends GameState {
  // Actions
  setCurrentLevel: (level: number) => void;
  updatePuzzleState: (puzzleState: Partial<PuzzleData>) => void;
  setAtmosphereLevel: (atmosphere: AtmosphereType) => void;
  addStoryFragment: (fragment: StoryFragment) => void;
  updateProgress: (progress: Partial<ProgressData>) => void;
  updateAudioConfig: (config: Partial<AudioConfig>) => void;
  updateAudioSettings: (config: Partial<AudioConfig>) => void;
  completeLevel: (level: number) => void;
  resetGame: () => void;
  loadProgress: () => void;
}

const initialPuzzleState: PuzzleData = {
  type: 'sliding_tiles',
  difficulty: 1,
  grid: [],
  solution: [],
  moves: 0,
  isCompleted: false,
};

const initialProgressData: ProgressData = {
  completedLevels: [],
  currentLevel: 1,
  totalMoves: 0,
  totalTime: 0,
  achievementsUnlocked: [],
  storyFragmentsSeen: [],
};

const initialAudioConfig: AudioConfig = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  isMuted: false,
};

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentLevel: 1,
        puzzleState: initialPuzzleState,
        atmosphere: 'cheerful',
        storyProgress: [],
        playerProgress: initialProgressData,
        audioSettings: { ...initialAudioConfig, enabled: true },

        // Actions
        setCurrentLevel: (level: number) => {
          set({ currentLevel: level }, false, 'setCurrentLevel');
        },

        updatePuzzleState: (puzzleState: Partial<PuzzleData>) => {
          set(
            (state) => ({
              puzzleState: { ...state.puzzleState, ...puzzleState },
            }),
            false,
            'updatePuzzleState'
          );
        },

        setAtmosphereLevel: (atmosphere: AtmosphereType) => {
          set({ atmosphere: atmosphere }, false, 'setAtmosphereLevel');
        },

        addStoryFragment: (fragment: StoryFragment) => {
          set(
            (state) => ({
              storyProgress: [...state.storyProgress, fragment],
              playerProgress: {
                ...state.playerProgress,
                storyFragmentsSeen: [...state.playerProgress.storyFragmentsSeen, fragment.id],
              },
            }),
            false,
            'addStoryFragment'
          );
        },

        updateProgress: (progress: Partial<ProgressData>) => {
          set(
            (state) => ({
              playerProgress: { ...state.playerProgress, ...progress },
            }),
            false,
            'updateProgress'
          );
        },

        updateAudioConfig: (config: Partial<AudioConfig>) => {
          set(
            (state) => ({
              audioSettings: { ...state.audioSettings, ...config },
            }),
            false,
            'updateAudioConfig'
          );
        },

        updateAudioSettings: (config: Partial<AudioConfig>) => {
          set(
            (state) => ({
              audioSettings: { ...state.audioSettings, ...config },
            }),
            false,
            'updateAudioSettings'
          );
        },

        completeLevel: (level: number) => {
          const state = get();
          const newCompletedLevels = [...state.playerProgress.completedLevels];
          if (!newCompletedLevels.includes(level)) {
            newCompletedLevels.push(level);
          }

          set(
            {
              currentLevel: level + 1,
              playerProgress: {
                ...state.playerProgress,
                completedLevels: newCompletedLevels,
                currentLevel: level + 1,
              },
              puzzleState: {
                ...initialPuzzleState,
                difficulty: Math.min(level + 1, 10),
              },
            },
            false,
            'completeLevel'
          );
        },

        resetGame: () => {
          set(
            {
              currentLevel: 1,
              puzzleState: initialPuzzleState,
              atmosphere: 'cheerful',
              storyProgress: [],
              playerProgress: initialProgressData,
              audioSettings: { ...initialAudioConfig, enabled: true },
            },
            false,
            'resetGame'
          );
        },

        loadProgress: () => {
          // This will be called to load persisted state
          // The persist middleware handles this automatically
        },
      }),
      {
        name: 'mysterious-puzzle-game-storage',
        partialize: (state) => ({
          currentLevel: state.currentLevel,
          playerProgress: state.playerProgress,
          audioSettings: state.audioSettings,
          storyProgress: state.storyProgress,
          atmosphere: state.atmosphere,
        }),
      }
    ),
    {
      name: 'mysterious-puzzle-game',
    }
  ));