import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzleData, AtmosphereType } from '../../types/game';
import { useGameStore } from '../engine/gameStore';

interface MemorySequencePuzzleProps {
  puzzleData: PuzzleData;
  atmosphere: AtmosphereType;
  onComplete: () => void;
}

interface SequenceButton {
  id: number;
  color: string;
  sound: string;
  isActive: boolean;
  isPressed: boolean;
}

type GamePhase = 'showing' | 'waiting' | 'input' | 'success' | 'failure';

const MemorySequencePuzzle: React.FC<MemorySequencePuzzleProps> = ({
  puzzleData,
  atmosphere,
  onComplete,
}) => {
  const { updatePuzzleState } = useGameStore();
  const [buttons, setButtons] = useState<SequenceButton[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('waiting');
  const [moves, setMoves] = useState(0);
  const [level, setLevel] = useState(1);
  const buttonCount = 4;
  const maxLevel = 5 + puzzleData.difficulty;

  const getButtonColorsForAtmosphere = (atmosphere: AtmosphereType) => {
    const colorSets = {
      cheerful: {
        colors: ['#FFE5B4', '#B4E5FF', '#E5FFB4', '#FFB4E5'],
        activeColors: ['#FFD700', '#87CEEB', '#98FB98', '#DDA0DD']
      },
      neutral: {
        colors: ['#E2E8F0', '#CBD5E0', '#A0AEC0', '#718096'],
        activeColors: ['#F7FAFC', '#EDF2F7', '#E2E8F0', '#CBD5E0']
      },
      unsettling: {
        colors: ['#D69E2E', '#B7791F', '#975A16', '#744210'],
        activeColors: ['#F6E05E', '#D69E2E', '#B7791F', '#975A16']
      },
      dark_transition: {
        colors: ['#4A5568', '#2D3748', '#1A202C', '#171923'],
        activeColors: ['#718096', '#4A5568', '#2D3748', '#1A202C']
      },
      horror: {
        colors: ['#2C1810', '#1A1A2E', '#16213E', '#0F0F0F'],
        activeColors: ['#8B0000', '#4B0000', '#2F0000', '#1A0000']
      }
    };
    return colorSets[atmosphere];
  };

  // Initialize puzzle
  useEffect(() => {
    initializePuzzle();
  }, [puzzleData.difficulty, atmosphere]);

  const initializePuzzle = useCallback(() => {
    const colorSet = getButtonColorsForAtmosphere(atmosphere);
    
    const newButtons: SequenceButton[] = Array.from({ length: buttonCount }, (_, i) => ({
      id: i,
      color: colorSet.colors[i],
      sound: `note${i + 1}`,
      isActive: false,
      isPressed: false
    }));

    setButtons(newButtons);
    setSequence([]);
    setPlayerSequence([]);
    setCurrentStep(0);
    setPhase('waiting');
    setMoves(0);
    setLevel(1);
    updatePuzzleState({ moves: 0, isCompleted: false });
    
    // Start the first sequence after a brief delay
    setTimeout(() => {
      generateNewSequence(1);
    }, 1000);
  }, [atmosphere, puzzleData.difficulty, updatePuzzleState]);

  const generateNewSequence = (sequenceLevel: number) => {
    const newSequence: number[] = [];
    for (let i = 0; i < sequenceLevel + 2; i++) {
      newSequence.push(Math.floor(Math.random() * buttonCount));
    }
    
    setSequence(newSequence);
    setPlayerSequence([]);
    setCurrentStep(0);
    showSequence(newSequence);
  };

  const showSequence = async (sequenceToShow: number[]) => {
    setPhase('showing');
    
    for (let i = 0; i < sequenceToShow.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Activate button
      setButtons(prev => prev.map(btn => 
        btn.id === sequenceToShow[i] 
          ? { ...btn, isActive: true }
          : { ...btn, isActive: false }
      ));
      
      // Play sound effect (visual feedback for now)
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Deactivate button
      setButtons(prev => prev.map(btn => ({ ...btn, isActive: false })));
    }
    
    setPhase('input');
  };

  const handleButtonPress = (buttonId: number) => {
    if (phase !== 'input') return;
    
    // Visual feedback
    setButtons(prev => prev.map(btn => 
      btn.id === buttonId 
        ? { ...btn, isPressed: true }
        : { ...btn, isPressed: false }
    ));
    
    setTimeout(() => {
      setButtons(prev => prev.map(btn => ({ ...btn, isPressed: false })));
    }, 200);
    
    const newPlayerSequence = [...playerSequence, buttonId];
    setPlayerSequence(newPlayerSequence);
    setMoves(prev => prev + 1);
    updatePuzzleState({ moves: moves + 1 });
    
    // Check if the current input is correct
    if (sequence[newPlayerSequence.length - 1] !== buttonId) {
      // Wrong input
      setPhase('failure');
      setTimeout(() => {
        // Restart current level
        showSequence(sequence);
      }, 1500);
      return;
    }
    
    // Check if sequence is complete
    if (newPlayerSequence.length === sequence.length) {
      setPhase('success');
      
      if (level >= maxLevel) {
        // Puzzle completed!
        setTimeout(() => {
          updatePuzzleState({ isCompleted: true });
          onComplete();
        }, 1000);
      } else {
        // Next level
        setTimeout(() => {
          const nextLevel = level + 1;
          setLevel(nextLevel);
          generateNewSequence(nextLevel);
        }, 1500);
      }
    }
  };

  const getButtonStyle = (button: SequenceButton) => {
    const colorSet = getButtonColorsForAtmosphere(atmosphere);
    const baseColor = button.color;
    const activeColor = colorSet.activeColors[button.id];
    
    let backgroundColor = baseColor;
    let transform = 'scale(1)';
    let boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    
    if (button.isActive) {
      backgroundColor = activeColor;
      transform = 'scale(1.1)';
      boxShadow = `0 0 20px ${activeColor}`;
    } else if (button.isPressed) {
      backgroundColor = activeColor;
      transform = 'scale(0.95)';
      boxShadow = `0 0 15px ${activeColor}`;
    }
    
    if (atmosphere === 'horror') {
      boxShadow = button.isActive || button.isPressed 
        ? `0 0 25px ${activeColor}, 0 0 50px ${activeColor}` 
        : '0 4px 12px rgba(0,0,0,0.6)';
    }
    
    return {
      backgroundColor,
      transform,
      boxShadow,
      border: `3px solid ${atmosphere === 'horror' ? '#000' : '#2D3748'}`,
      filter: atmosphere === 'horror' ? 'contrast(1.3) brightness(0.8)' : 'none'
    };
  };

  const getPhaseMessage = () => {
    const messages = {
      showing: 'Watch the sequence...',
      waiting: 'Get ready...',
      input: 'Repeat the sequence',
      success: level >= maxLevel ? 'Puzzle Complete!' : 'Correct! Next level...',
      failure: 'Wrong! Try again...'
    };
    
    if (atmosphere === 'horror') {
      return {
        showing: 'Remember... or forget forever...',
        waiting: 'The sequence calls to you...',
        input: 'Follow the pattern... if you dare',
        success: level >= maxLevel ? 'You have escaped... for now.' : 'Deeper into the void...',
        failure: 'The darkness consumes your memory...'
      }[phase];
    }
    
    return messages[phase];
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-lg font-semibold">
        Level: {level} / {maxLevel} | Moves: {moves}
      </div>
      
      <div 
        className="text-center text-sm transition-all duration-300"
        style={{
          color: phase === 'failure' ? '#E53E3E' : 
                 phase === 'success' ? '#38A169' : 
                 atmosphere === 'horror' ? '#E2E8F0' : '#2D3748',
          opacity: phase === 'failure' ? 0.8 : 1
        }}
      >
        {getPhaseMessage()}
      </div>
      
      <div 
        className="grid grid-cols-2 gap-4 p-6 rounded-lg"
        style={{
          background: atmosphere === 'horror' ? '#0F0F0F' : 
                     atmosphere === 'dark_transition' ? '#1A1A1A' : '#F7FAFC'
        }}
      >
        {buttons.map((button) => {
          const buttonStyle = getButtonStyle(button);
          
          return (
            <motion.button
              key={button.id}
              className="w-24 h-24 rounded-full font-bold text-lg transition-all duration-200 focus:outline-none"
              style={buttonStyle}
              onClick={() => handleButtonPress(button.id)}
              disabled={phase !== 'input'}
              whileHover={phase === 'input' ? { scale: 1.05 } : {}}
              animate={{
                scale: button.isActive ? 1.1 : button.isPressed ? 0.95 : 1
              }}
            >
              {button.id + 1}
            </motion.button>
          );
        })}
      </div>
      
      {/* Progress indicator */}
      <div className="flex space-x-2">
        {Array.from({ length: sequence.length }).map((_, index) => (
          <div
            key={index}
            className="w-3 h-3 rounded-full transition-all duration-300"
            style={{
              backgroundColor: index < playerSequence.length 
                ? (playerSequence[index] === sequence[index] ? '#38A169' : '#E53E3E')
                : atmosphere === 'horror' ? '#2C1810' : '#CBD5E0'
            }}
          />
        ))}
      </div>

      <button
        onClick={initializePuzzle}
        className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
        style={{
          background: atmosphere === 'horror' ? '#2C1810' : 
                     atmosphere === 'dark_transition' ? '#4A5568' : '#E2E8F0',
          border: '2px solid #2D3748',
          color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
        }}
      >
        Restart
      </button>
    </div>
  );
};

export default MemorySequencePuzzle;