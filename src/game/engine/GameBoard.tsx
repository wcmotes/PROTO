import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './gameStore';
import { getLevelConfig, getAtmosphereForLevel, getStoryFragmentForLevel } from './levelConfig';
import { PUZZLE_COMPONENTS } from '../puzzles';
import { PuzzleType, AtmosphereType } from '../../types/game';
import { useAudio } from '../audio/useAudio';

interface GameBoardProps {
  onMenuReturn?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ onMenuReturn }) => {
  const {
    currentLevel,
    puzzleState,
    atmosphere,
    storyProgress,
    playerProgress,
    audioSettings,
    completeLevel,
    setAtmosphereLevel,
    addStoryFragment,
    resetGame
  } = useGameStore();
  const { playLevelComplete, playClick, playAtmosphereTransition } = useAudio();

  const [showStoryFragment, setShowStoryFragment] = useState(false);
  const [currentStoryText, setCurrentStoryText] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  const levelConfig = getLevelConfig(currentLevel);
  const PuzzleComponent = PUZZLE_COMPONENTS[levelConfig.puzzleType as keyof typeof PUZZLE_COMPONENTS];

  // Handle level progression and atmosphere changes
  useEffect(() => {
    const newAtmosphere = getAtmosphereForLevel(currentLevel);
    if (newAtmosphere !== atmosphere) {
      setIsTransitioning(true);
      setTimeout(() => {
        setAtmosphereLevel(newAtmosphere);
        setIsTransitioning(false);
      }, 500);
    }

    // Show story fragment if available
    const storyFragment = getStoryFragmentForLevel(currentLevel);
    if (storyFragment && !playerProgress.storyFragmentsSeen.includes(storyFragment.id)) {
      setCurrentStoryText(storyFragment.text);
      setShowStoryFragment(true);
      addStoryFragment(storyFragment);
    }
  }, [currentLevel, atmosphere, playerProgress.storyFragmentsSeen, setAtmosphereLevel, addStoryFragment]);

  const handlePuzzleComplete = useCallback(() => {
    playLevelComplete();
    setShowLevelComplete(true);
    
    setTimeout(() => {
      completeLevel(currentLevel);
      setShowLevelComplete(false);
      // Play atmosphere transition sound when advancing to new level
      if (currentLevel % 5 === 0) {
        playAtmosphereTransition();
      }
    }, 2000);
  }, [completeLevel, playLevelComplete, playAtmosphereTransition, currentLevel]);

  const handleStoryFragmentClose = () => {
    setShowStoryFragment(false);
  };

  const getBackgroundStyle = (atmosphere: AtmosphereType) => {
    const backgrounds = {
      cheerful: {
        background: 'linear-gradient(135deg, #FFF5F5 0%, #FED7D7 50%, #FBB6CE 100%)',
        filter: 'brightness(1.1)'
      },
      neutral: {
        background: 'linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 50%, #E2E8F0 100%)',
        filter: 'brightness(1)'
      },
      unsettling: {
        background: 'linear-gradient(135deg, #FDF6E3 0%, #FAF089 30%, #D69E2E 100%)',
        filter: 'brightness(0.9) contrast(1.1)'
      },
      dark_transition: {
        background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 50%, #171923 100%)',
        filter: 'brightness(0.8) contrast(1.2)'
      },
      horror: {
        background: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A2E 30%, #2C1810 70%, #000000 100%)',
        filter: 'brightness(0.6) contrast(1.4) saturate(0.8)'
      }
    };
    
    return backgrounds[atmosphere];
  };

  const getTextColor = (atmosphere: AtmosphereType) => {
    return atmosphere === 'dark_transition' || atmosphere === 'horror' ? '#E2E8F0' : '#1A202C';
  };

  const getLevelTitle = () => {
    const titles = {
      cheerful: `Level ${currentLevel}: ${levelConfig.puzzleType.replace('_', ' ').toUpperCase()}`,
      neutral: `Level ${currentLevel}: ${levelConfig.puzzleType.replace('_', ' ').toUpperCase()}`,
      unsettling: `Level ${currentLevel}: Something feels... different`,
      dark_transition: `Level ${currentLevel}: The shadows grow longer`,
      horror: `Level ${currentLevel}: ${levelConfig.puzzleType.replace('_', ' ').toUpperCase()} OF DESPAIR`
    };
    
    return titles[atmosphere];
  };

  const getProgressText = () => {
    const totalLevels = 25;
    const progressPercent = Math.round((currentLevel / totalLevels) * 100);
    
    if (atmosphere === 'horror') {
      return `${progressPercent}% consumed by darkness`;
    } else if (atmosphere === 'dark_transition') {
      return `${progressPercent}% into the void`;
    } else if (atmosphere === 'unsettling') {
      return `${progressPercent}% deeper`;
    } else {
      return `Progress: ${progressPercent}%`;
    }
  };

  const backgroundStyle = getBackgroundStyle(atmosphere);
  const textColor = getTextColor(atmosphere);

  return (
    <div 
      className="min-h-screen transition-all duration-1000 relative overflow-hidden"
      style={{
        background: backgroundStyle.background,
        filter: isTransitioning ? 'blur(2px)' : backgroundStyle.filter
      }}
    >
      {/* Atmospheric overlay effects */}
      {atmosphere === 'horror' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-20 animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute bg-red-900 opacity-10 rounded-full animate-ping"
                style={{
                  width: `${Math.random() * 100 + 50}px`,
                  height: `${Math.random() * 100 + 50}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => { playClick(); onMenuReturn?.(); }}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: atmosphere === 'horror' ? '#2C1810' : 
                             atmosphere === 'dark_transition' ? '#4A5568' : '#E2E8F0',
              border: '2px solid #2D3748',
              color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
            }}
          >
            ← Menu
          </button>
          
          <div className="text-center">
            <h1 
              className="text-2xl font-bold mb-2 transition-all duration-500"
              style={{ 
                color: textColor,
                textShadow: atmosphere === 'horror' ? '0 0 10px rgba(139, 0, 0, 0.5)' : 'none'
              }}
            >
              {getLevelTitle()}
            </h1>
            <p 
              className="text-sm opacity-75"
              style={{ color: textColor }}
            >
              {getProgressText()}
            </p>
          </div>
          
          <button
            onClick={() => { playClick(); resetGame(); }}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: atmosphere === 'horror' ? '#2C1810' : 
                             atmosphere === 'dark_transition' ? '#4A5568' : '#E2E8F0',
              border: '2px solid #2D3748',
              color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
            }}
          >
            Reset
          </button>
        </div>

        {/* Game Stats */}
        <div className="flex justify-center space-x-8 mb-8">
          <div className="text-center">
            <div 
              className="text-lg font-semibold"
              style={{ color: textColor }}
            >
              {puzzleState.moves}
            </div>
            <div 
              className="text-xs opacity-75"
              style={{ color: textColor }}
            >
              Moves
            </div>
          </div>
          
          <div className="text-center">
            <div 
              className="text-lg font-semibold"
              style={{ color: textColor }}
            >
              {playerProgress.completedLevels.length}
            </div>
            <div 
              className="text-xs opacity-75"
              style={{ color: textColor }}
            >
              Completed
            </div>
          </div>
          
          <div className="text-center">
            <div 
              className="text-lg font-semibold"
              style={{ color: textColor }}
            >
              {Math.round(playerProgress.totalTime / 60)}m
            </div>
            <div 
              className="text-xs opacity-75"
              style={{ color: textColor }}
            >
              Play Time
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-10 flex justify-center items-center px-6 pb-6">
        <div 
          className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl transition-all duration-500"
          style={{
            backgroundColor: atmosphere === 'horror' ? 'rgba(0,0,0,0.3)' : 
                           atmosphere === 'dark_transition' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
            border: `2px solid ${atmosphere === 'horror' ? '#2C1810' : 
                                atmosphere === 'dark_transition' ? '#4A5568' : '#E2E8F0'}`,
            boxShadow: atmosphere === 'horror' ? '0 0 30px rgba(139, 0, 0, 0.3)' : 
                      atmosphere === 'dark_transition' ? '0 0 20px rgba(0, 0, 0, 0.5)' : 
                      '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}
        >
          <AnimatePresence mode="wait">
            {!isTransitioning && PuzzleComponent && (
              <motion.div
                key={currentLevel}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              >
                <PuzzleComponent
                  puzzleData={{
                    type: levelConfig.puzzleType as PuzzleType,
                    difficulty: levelConfig.difficultyRating,
                    grid: [],
                    solution: [],
                    moves: 0,
                    isCompleted: false
                  }}
                  atmosphere={atmosphere}
                  onComplete={handlePuzzleComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Story Fragment Modal */}
      <AnimatePresence>
        {showStoryFragment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-6"
            onClick={handleStoryFragmentClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-2xl w-full p-8 rounded-2xl shadow-2xl"
              style={{
                backgroundColor: atmosphere === 'horror' ? '#0F0F0F' : 
                               atmosphere === 'dark_transition' ? '#1A202C' : '#FFFFFF',
                border: `3px solid ${atmosphere === 'horror' ? '#8B0000' : 
                                    atmosphere === 'dark_transition' ? '#4A5568' : '#E2E8F0'}`,
                color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-4">
                  {atmosphere === 'horror' ? 'The Darkness Speaks...' : 
                   atmosphere === 'dark_transition' ? 'A Memory Surfaces...' : 
                   atmosphere === 'unsettling' ? 'Something Stirs...' : 
                   'Story Fragment'}
                </h3>
                <div className="text-lg leading-relaxed">
                  {currentStoryText}
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => { playClick(); handleStoryFragmentClose(); }}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: atmosphere === 'horror' ? '#2C1810' : 
                                   atmosphere === 'dark_transition' ? '#4A5568' : '#3182CE',
                    color: '#E2E8F0',
                    border: '2px solid #2D3748'
                  }}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Complete Modal */}
      <AnimatePresence>
        {showLevelComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-center p-8 rounded-2xl shadow-2xl"
              style={{
                backgroundColor: atmosphere === 'horror' ? '#0F0F0F' : 
                               atmosphere === 'dark_transition' ? '#1A202C' : '#FFFFFF',
                border: `3px solid ${atmosphere === 'horror' ? '#8B0000' : 
                                    atmosphere === 'dark_transition' ? '#4A5568' : '#38A169'}`,
                color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
              }}
            >
              <h2 className="text-3xl font-bold mb-4">
                {atmosphere === 'horror' ? 'You Survived... This Time' : 
                 atmosphere === 'dark_transition' ? 'Level Conquered' : 
                 'Level Complete!'}
              </h2>
              <p className="text-lg">
                {atmosphere === 'horror' ? 'The darkness retreats, but it will return...' : 
                 atmosphere === 'dark_transition' ? 'The shadows part, revealing the next challenge...' : 
                 'Well done! Preparing next level...'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;