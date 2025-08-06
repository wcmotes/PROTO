import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzleData, AtmosphereType } from '../../types/game';
import { useGameStore } from '../engine/gameStore';

interface RiddlePuzzleProps {
  puzzleData: PuzzleData;
  atmosphere: AtmosphereType;
  onComplete: () => void;
}

interface Riddle {
  id: string;
  question: string;
  answer: string;
  hints: string[];
  difficulty: number;
}

const RiddlePuzzle: React.FC<RiddlePuzzleProps> = ({
  puzzleData,
  atmosphere,
  onComplete,
}) => {
  const { updatePuzzleState } = useGameStore();
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [moves, setMoves] = useState(0);
  const maxAttempts = 3;
  const totalRiddles = 3 + puzzleData.difficulty;

  const getRiddlesForAtmosphere = (atmosphere: AtmosphereType): Riddle[] => {
    const riddleSets = {
      cheerful: [
        {
          id: '1',
          question: 'I have keys but no locks. I have space but no room. You can enter, but you can\'t go outside. What am I?',
          answer: 'keyboard',
          hints: ['I help you type', 'I have letters and numbers', 'You use me with a computer'],
          difficulty: 1
        },
        {
          id: '2',
          question: 'What has hands but cannot clap?',
          answer: 'clock',
          hints: ['I tell time', 'I have numbers on my face', 'I tick and tock'],
          difficulty: 1
        },
        {
          id: '3',
          question: 'I\'m tall when I\'m young, and short when I\'m old. What am I?',
          answer: 'candle',
          hints: ['I give light', 'I melt as I burn', 'I have a wick'],
          difficulty: 2
        },
        {
          id: '4',
          question: 'What gets wet while drying?',
          answer: 'towel',
          hints: ['I\'m used in the bathroom', 'I absorb water', 'I help you get dry'],
          difficulty: 2
        },
        {
          id: '5',
          question: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?',
          answer: 'map',
          hints: ['I show locations', 'I help with navigation', 'I can be folded'],
          difficulty: 3
        }
      ],
      neutral: [
        {
          id: '1',
          question: 'What comes once in a minute, twice in a moment, but never in a thousand years?',
          answer: 'letter m',
          hints: ['Think about spelling', 'Look at the letters in the words', 'It\'s about the alphabet'],
          difficulty: 2
        },
        {
          id: '2',
          question: 'I am not alive, but I grow; I don\'t have lungs, but I need air; I don\'t have a mouth, but water kills me. What am I?',
          answer: 'fire',
          hints: ['I am hot', 'I consume oxygen', 'I can spread quickly'],
          difficulty: 2
        },
        {
          id: '3',
          question: 'The more you take, the more you leave behind. What am I?',
          answer: 'footsteps',
          hints: ['Think about walking', 'I\'m left on the ground', 'I show where you\'ve been'],
          difficulty: 3
        },
        {
          id: '4',
          question: 'What has one eye but cannot see?',
          answer: 'needle',
          hints: ['I\'m used for sewing', 'I\'m sharp and thin', 'Thread goes through me'],
          difficulty: 2
        },
        {
          id: '5',
          question: 'I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?',
          answer: 'echo',
          hints: ['I repeat sounds', 'I\'m found in mountains and caves', 'I bounce back to you'],
          difficulty: 3
        }
      ],
      unsettling: [
        {
          id: '1',
          question: 'I follow you everywhere, but you can never catch me. In light I shrink, in darkness I grow. What am I?',
          answer: 'shadow',
          hints: ['I mimic your movements', 'I change with the sun', 'I have no substance'],
          difficulty: 2
        },
        {
          id: '2',
          question: 'I have no voice, yet I speak to you. I tell of the past, though I\'ve never lived. What am I?',
          answer: 'book',
          hints: ['I contain stories', 'I have pages', 'I preserve knowledge'],
          difficulty: 2
        },
        {
          id: '3',
          question: 'I am always hungry, I must always be fed. The finger I touch will soon turn red. What am I?',
          answer: 'fire',
          hints: ['I consume everything', 'I burn what I touch', 'I need fuel to survive'],
          difficulty: 3
        },
        {
          id: '4',
          question: 'I have a face but no eyes, hands but no arms. I move but have no legs. What am I?',
          answer: 'clock',
          hints: ['I mark the passage of time', 'I have numbers', 'I tick constantly'],
          difficulty: 3
        },
        {
          id: '5',
          question: 'I am born in darkness, I live in light, but I die when touched by brightness. What am I?',
          answer: 'shadow',
          hints: ['I exist because of light', 'I disappear in direct light', 'I am the absence of illumination'],
          difficulty: 4
        }
      ],
      dark_transition: [
        {
          id: '1',
          question: 'I consume all things: birds, beasts, trees, flowers. I gnaw iron, bite steel, grind hard stones to meal. What am I?',
          answer: 'time',
          hints: ['I affect everything', 'I never stop moving', 'I age all things'],
          difficulty: 3
        },
        {
          id: '2',
          question: 'I have no beginning and no end. I am everywhere and nowhere. I am the space between thoughts. What am I?',
          answer: 'silence',
          hints: ['I am the absence of sound', 'I exist in empty spaces', 'I can be deafening'],
          difficulty: 4
        },
        {
          id: '3',
          question: 'I am the end of everything, the beginning of eternity, the start of every end. What am I?',
          answer: 'letter e',
          hints: ['Look at the spelling', 'I appear in specific places', 'I am part of the alphabet'],
          difficulty: 4
        },
        {
          id: '4',
          question: 'I grow stronger the more I am shared, yet I die when spoken aloud. What am I?',
          answer: 'secret',
          hints: ['I am hidden knowledge', 'I lose power when revealed', 'I bind people together'],
          difficulty: 4
        },
        {
          id: '5',
          question: 'I am the memory of what never was, the echo of silence, the shadow of light. What am I?',
          answer: 'dream',
          hints: ['I exist only in sleep', 'I am not real but feel real', 'I fade upon waking'],
          difficulty: 5
        }
      ],
      horror: [
        {
          id: '1',
          question: 'I am the whisper in empty rooms, the footstep with no feet, the breath of the breathless. What am I?',
          answer: 'ghost',
          hints: ['I am the departed', 'I haunt the living', 'I exist between worlds'],
          difficulty: 4
        },
        {
          id: '2',
          question: 'I feed on fear, grow with terror, and feast on the screams of the innocent. Yet I have no mouth. What am I?',
          answer: 'nightmare',
          hints: ['I visit in sleep', 'I am born from darkness', 'I torment the mind'],
          difficulty: 5
        },
        {
          id: '3',
          question: 'I am the last thing you see, the final breath you take, the end of all stories. What am I?',
          answer: 'death',
          hints: ['I am inevitable', 'I come to all', 'I am the final mystery'],
          difficulty: 5
        },
        {
          id: '4',
          question: 'I am the darkness behind your eyes, the voice that speaks when you are alone, the truth you refuse to see. What am I?',
          answer: 'madness',
          hints: ['I break minds', 'I distort reality', 'I am the loss of reason'],
          difficulty: 6
        },
        {
          id: '5',
          question: 'I am the hunger that cannot be fed, the thirst that cannot be quenched, the void that consumes all. What am I?',
          answer: 'abyss',
          hints: ['I am endless emptiness', 'I devour everything', 'I am the ultimate void'],
          difficulty: 6
        }
      ]
    };

    return riddleSets[atmosphere];
  };

  const initializePuzzle = useCallback(() => {
    const riddles = getRiddlesForAtmosphere(atmosphere);
    const availableRiddles = riddles.filter(r => r.difficulty <= puzzleData.difficulty + 2);
    
    if (availableRiddles.length > 0) {
      setCurrentRiddle(availableRiddles[0]);
      setRiddleIndex(0);
    }
    
    setUserAnswer('');
    setAttempts(0);
    setHintsUsed(0);
    setShowHint(false);
    setIsCorrect(null);
    setMoves(0);
    updatePuzzleState({ moves: 0, isCompleted: false });
  }, [atmosphere, puzzleData.difficulty, updatePuzzleState]);

  useEffect(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  const normalizeAnswer = (answer: string): string => {
    return answer.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  };

  const checkAnswer = () => {
    if (!currentRiddle) return;
    
    const normalizedUserAnswer = normalizeAnswer(userAnswer);
    const normalizedCorrectAnswer = normalizeAnswer(currentRiddle.answer);
    
    setAttempts(prev => prev + 1);
    setMoves(prev => prev + 1);
    updatePuzzleState({ moves: moves + 1 });
    
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setIsCorrect(true);
      
      setTimeout(() => {
        if (riddleIndex + 1 >= totalRiddles) {
          // Puzzle completed
          updatePuzzleState({ isCompleted: true });
          onComplete();
        } else {
          // Next riddle
          const riddles = getRiddlesForAtmosphere(atmosphere);
          const availableRiddles = riddles.filter(r => r.difficulty <= puzzleData.difficulty + 2);
          const nextIndex = (riddleIndex + 1) % availableRiddles.length;
          
          setCurrentRiddle(availableRiddles[nextIndex]);
          setRiddleIndex(riddleIndex + 1);
          setUserAnswer('');
          setAttempts(0);
          setHintsUsed(0);
          setShowHint(false);
          setIsCorrect(null);
        }
      }, 2000);
    } else {
      setIsCorrect(false);
      
      if (attempts >= maxAttempts - 1) {
        // Show answer and move to next riddle
        setTimeout(() => {
          if (riddleIndex + 1 >= totalRiddles) {
            updatePuzzleState({ isCompleted: true });
            onComplete();
          } else {
            const riddles = getRiddlesForAtmosphere(atmosphere);
            const availableRiddles = riddles.filter(r => r.difficulty <= puzzleData.difficulty + 2);
            const nextIndex = (riddleIndex + 1) % availableRiddles.length;
            
            setCurrentRiddle(availableRiddles[nextIndex]);
            setRiddleIndex(riddleIndex + 1);
            setUserAnswer('');
            setAttempts(0);
            setHintsUsed(0);
            setShowHint(false);
            setIsCorrect(null);
          }
        }, 3000);
      } else {
        setTimeout(() => {
          setIsCorrect(null);
        }, 1500);
      }
    }
  };

  const useHint = () => {
    if (!currentRiddle || hintsUsed >= currentRiddle.hints.length) return;
    
    setHintsUsed(prev => prev + 1);
    setShowHint(true);
    setMoves(prev => prev + 1);
    updatePuzzleState({ moves: moves + 1 });
  };

  const getQuestionStyle = () => {
    const styles = {
      cheerful: {
        background: '#F7FAFC',
        border: '#E2E8F0',
        color: '#1A202C'
      },
      neutral: {
        background: '#F7FAFC',
        border: '#CBD5E0',
        color: '#2D3748'
      },
      unsettling: {
        background: '#FDF6E3',
        border: '#D69E2E',
        color: '#744210'
      },
      dark_transition: {
        background: '#1A202C',
        border: '#4A5568',
        color: '#E2E8F0'
      },
      horror: {
        background: '#0F0F0F',
        border: '#2C1810',
        color: '#E2E8F0'
      }
    };
    
    return styles[atmosphere];
  };

  const getFeedbackMessage = () => {
    if (isCorrect === true) {
      return atmosphere === 'horror' 
        ? 'The darkness retreats... for now.' 
        : atmosphere === 'dark_transition'
        ? 'Correct. The shadows whisper approval.'
        : 'Correct! Well done.';
    } else if (isCorrect === false) {
      if (attempts >= maxAttempts) {
        return atmosphere === 'horror'
          ? `The answer was "${currentRiddle?.answer}". The void consumes your failure.`
          : atmosphere === 'dark_transition'
          ? `The answer was "${currentRiddle?.answer}". Try to remember next time.`
          : `The answer was "${currentRiddle?.answer}". Better luck next time!`;
      } else {
        return atmosphere === 'horror'
          ? 'Wrong. The darkness grows stronger.'
          : atmosphere === 'dark_transition'
          ? 'Incorrect. The shadows mock your attempt.'
          : 'Not quite right. Try again!';
      }
    }
    return '';
  };

  if (!currentRiddle) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading riddle...</div>
      </div>
    );
  }

  const questionStyle = getQuestionStyle();

  return (
    <div className="flex flex-col items-center space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">
          Riddle {riddleIndex + 1} of {totalRiddles} | Moves: {moves}
        </div>
        <div className="text-sm opacity-75">
          Attempts: {attempts}/{maxAttempts} | Hints Used: {hintsUsed}/{currentRiddle.hints.length}
        </div>
      </div>

      {/* Question */}
      <div 
        className="p-6 rounded-lg border-2 w-full"
        style={{
          backgroundColor: questionStyle.background,
          borderColor: questionStyle.border,
          color: questionStyle.color
        }}
      >
        <div className="text-lg font-medium text-center leading-relaxed">
          {currentRiddle.question}
        </div>
      </div>

      {/* Answer Input */}
      <div className="w-full max-w-md">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
          placeholder={atmosphere === 'horror' ? 'Speak the answer...' : 'Your answer'}
          disabled={isCorrect !== null}
          className="w-full px-4 py-3 rounded-lg border-2 text-center font-medium focus:outline-none transition-all duration-200"
          style={{
            backgroundColor: questionStyle.background,
            borderColor: isCorrect === true ? '#38A169' : isCorrect === false ? '#E53E3E' : questionStyle.border,
            color: questionStyle.color
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={checkAnswer}
          disabled={!userAnswer.trim() || isCorrect !== null}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: atmosphere === 'horror' ? '#2C1810' : 
                           atmosphere === 'dark_transition' ? '#4A5568' : '#3182CE',
            color: '#E2E8F0',
            border: '2px solid #2D3748'
          }}
        >
          Submit Answer
        </button>
        
        <button
          onClick={useHint}
          disabled={hintsUsed >= currentRiddle.hints.length || isCorrect !== null}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: atmosphere === 'horror' ? '#1A1A2E' : 
                           atmosphere === 'dark_transition' ? '#2D3748' : '#D69E2E',
            color: '#E2E8F0',
            border: '2px solid #2D3748'
          }}
        >
          Use Hint ({currentRiddle.hints.length - hintsUsed} left)
        </button>
      </div>

      {/* Hint Display */}
      <AnimatePresence>
        {showHint && hintsUsed > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-md p-4 rounded-lg border"
            style={{
              backgroundColor: atmosphere === 'horror' ? '#1A1A2E' : 
                             atmosphere === 'dark_transition' ? '#2D3748' : '#EDF2F7',
              borderColor: questionStyle.border,
              color: questionStyle.color
            }}
          >
            <div className="text-sm font-medium mb-2">Hint:</div>
            <div className="text-sm">
              {currentRiddle.hints[hintsUsed - 1]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center p-4 rounded-lg font-medium"
            style={{
              backgroundColor: isCorrect ? '#C6F6D5' : '#FED7D7',
              color: isCorrect ? '#1A202C' : '#1A202C',
              border: `2px solid ${isCorrect ? '#38A169' : '#E53E3E'}`
            }}
          >
            {getFeedbackMessage()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restart Button */}
      <button
        onClick={initializePuzzle}
        className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105"
        style={{
          backgroundColor: atmosphere === 'horror' ? '#2C1810' : 
                         atmosphere === 'dark_transition' ? '#4A5568' : '#E2E8F0',
          border: '2px solid #2D3748',
          color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
        }}
      >
        Restart Riddles
      </button>
    </div>
  );
};

export default RiddlePuzzle;