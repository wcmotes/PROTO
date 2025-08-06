import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzleData, AtmosphereType } from '../../types/game';
import { useGameStore } from '../engine/gameStore';

interface WordAssociationPuzzleProps {
  puzzleData: PuzzleData;
  atmosphere: AtmosphereType;
  onComplete: () => void;
}

interface WordPair {
  id: string;
  word: string;
  category: string;
  isSelected: boolean;
  isMatched: boolean;
  position: number;
}

const WordAssociationPuzzle: React.FC<WordAssociationPuzzleProps> = ({
  puzzleData,
  atmosphere,
  onComplete,
}) => {
  const { updatePuzzleState } = useGameStore();
  const [words, setWords] = useState<WordPair[]>([]);
  const [selectedWords, setSelectedWords] = useState<WordPair[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const getWordSetsForAtmosphere = (atmosphere: AtmosphereType, difficulty: number) => {
    const baseSets: Record<AtmosphereType, Record<string, string[]>> = {
      cheerful: {
        nature: ['flower', 'tree', 'bird', 'sun'],
        colors: ['red', 'blue', 'green', 'yellow'],
        animals: ['cat', 'dog', 'fish', 'rabbit'],
        food: ['apple', 'bread', 'milk', 'cake']
      },
      neutral: {
        tools: ['hammer', 'screwdriver', 'wrench', 'pliers'],
        furniture: ['chair', 'table', 'bed', 'sofa'],
        weather: ['rain', 'snow', 'wind', 'cloud'],
        transport: ['car', 'bus', 'train', 'plane']
      },
      unsettling: {
        shadows: ['whisper', 'echo', 'silence', 'void'],
        forgotten: ['memory', 'dream', 'ghost', 'past'],
        mystery: ['secret', 'hidden', 'unknown', 'riddle'],
        time: ['clock', 'hour', 'moment', 'eternity']
      },
      dark_transition: {
        decay: ['rust', 'rot', 'fade', 'crumble'],
        isolation: ['alone', 'empty', 'distant', 'cold'],
        doubt: ['fear', 'worry', 'question', 'uncertain'],
        endings: ['last', 'final', 'close', 'finish']
      },
      horror: {
        nightmare: ['scream', 'terror', 'dread', 'panic'],
        darkness: ['abyss', 'shadow', 'void', 'black'],
        death: ['grave', 'bone', 'skull', 'corpse'],
        madness: ['insane', 'twisted', 'broken', 'lost']
      }
    };

    const sets = baseSets[atmosphere];
    const categories = Object.keys(sets);
    const numCategories = Math.min(2 + difficulty, categories.length);
    const selectedCategories = categories.slice(0, numCategories);
    
    const wordPairs: WordPair[] = [];
    let id = 0;
    
    selectedCategories.forEach(category => {
      const categoryWords = sets[category as keyof typeof sets] || [];
      const wordsToUse = categoryWords.slice(0, Math.min(3 + difficulty, categoryWords.length));
      
      wordsToUse.forEach(word => {
        wordPairs.push({
          id: `${id++}`,
          word,
          category,
          isSelected: false,
          isMatched: false,
          position: 0
        });
      });
    });
    
    return wordPairs;
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const initializePuzzle = useCallback(() => {
    const wordPairs = getWordSetsForAtmosphere(atmosphere, puzzleData.difficulty);
    const shuffledWords = shuffleArray(wordPairs).map((word, index) => ({
      ...word,
      position: index
    }));
    
    setWords(shuffledWords);
    setSelectedWords([]);
    setMatches([]);
    setMoves(0);
    setShowHint(false);
    updatePuzzleState({ moves: 0, isCompleted: false });
  }, [atmosphere, puzzleData.difficulty, updatePuzzleState]);

  useEffect(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  const handleWordClick = (clickedWord: WordPair) => {
    if (clickedWord.isMatched || clickedWord.isSelected) {
      // Deselect if already selected
      if (clickedWord.isSelected) {
        setSelectedWords(prev => prev.filter(w => w.id !== clickedWord.id));
        setWords(prev => prev.map(w => 
          w.id === clickedWord.id ? { ...w, isSelected: false } : w
        ));
      }
      return;
    }

    const newSelectedWords = [...selectedWords, clickedWord];
    setSelectedWords(newSelectedWords);
    setWords(prev => prev.map(w => 
      w.id === clickedWord.id ? { ...w, isSelected: true } : w
    ));
    setMoves(prev => prev + 1);
    updatePuzzleState({ moves: moves + 1 });

    // Check if we have enough words selected to form a group
    const minGroupSize = 3;
    if (newSelectedWords.length >= minGroupSize) {
      checkForMatch(newSelectedWords);
    }
  };

  const checkForMatch = (selectedWords: WordPair[]) => {
    // Group by category
    const categoryGroups: { [key: string]: WordPair[] } = {};
    selectedWords.forEach(word => {
      if (!categoryGroups[word.category]) {
        categoryGroups[word.category] = [];
      }
      categoryGroups[word.category].push(word);
    });

    // Find the largest group
    let largestGroup: WordPair[] = [];
    let largestCategory = '';
    
    Object.entries(categoryGroups).forEach(([category, group]) => {
      if (group.length > largestGroup.length) {
        largestGroup = group;
        largestCategory = category;
      }
    });

    // Check if we have a valid match (3+ words from same category)
    if (largestGroup.length >= 3) {
      // Mark matched words
      setWords(prev => prev.map(w => 
        largestGroup.some(lg => lg.id === w.id) 
          ? { ...w, isMatched: true, isSelected: false }
          : { ...w, isSelected: false }
      ));
      
      setMatches(prev => [...prev, largestCategory]);
      setSelectedWords([]);
      
      // Check if puzzle is complete
      const totalCategories = new Set(words.map(w => w.category)).size;
      if (matches.length + 1 >= totalCategories) {
        setTimeout(() => {
          updatePuzzleState({ isCompleted: true });
          onComplete();
        }, 1000);
      }
    } else if (selectedWords.length >= 4) {
      // Too many words selected without a match - clear selection
      setWords(prev => prev.map(w => ({ ...w, isSelected: false })));
      setSelectedWords([]);
    }
  };

  const getWordStyle = (word: WordPair) => {
    const baseStyles = {
      cheerful: {
        background: word.isMatched ? '#C6F6D5' : word.isSelected ? '#FED7D7' : '#F7FAFC',
        border: word.isSelected ? '#E53E3E' : '#E2E8F0',
        color: '#1A202C'
      },
      neutral: {
        background: word.isMatched ? '#E6FFFA' : word.isSelected ? '#FFF5F5' : '#F7FAFC',
        border: word.isSelected ? '#3182CE' : '#CBD5E0',
        color: '#2D3748'
      },
      unsettling: {
        background: word.isMatched ? '#FAF089' : word.isSelected ? '#FED7AA' : '#FDF6E3',
        border: word.isSelected ? '#D69E2E' : '#D69E2E',
        color: '#744210'
      },
      dark_transition: {
        background: word.isMatched ? '#4A5568' : word.isSelected ? '#2D3748' : '#1A202C',
        border: word.isSelected ? '#718096' : '#4A5568',
        color: '#E2E8F0'
      },
      horror: {
        background: word.isMatched ? '#2C1810' : word.isSelected ? '#1A1A2E' : '#0F0F0F',
        border: word.isSelected ? '#8B0000' : '#2C1810',
        color: word.isMatched ? '#E2E8F0' : word.isSelected ? '#E2E8F0' : '#A0AEC0'
      }
    };

    const style = baseStyles[atmosphere];
    return {
      backgroundColor: style.background,
      borderColor: style.border,
      color: style.color,
      borderWidth: '2px',
      borderStyle: 'solid',
      opacity: word.isMatched ? 0.7 : 1,
      transform: word.isSelected ? 'scale(1.05)' : 'scale(1)',
      boxShadow: word.isSelected 
        ? `0 0 15px ${style.border}` 
        : atmosphere === 'horror' 
          ? '0 4px 12px rgba(0,0,0,0.6)' 
          : '0 2px 4px rgba(0,0,0,0.1)'
    };
  };

  const getHintText = () => {
    if (!showHint) return '';
    
    const categories = Array.from(new Set(words.map(w => w.category)));
    const unmatched = categories.filter(cat => !matches.includes(cat));
    
    if (unmatched.length > 0) {
      const hintCategory = unmatched[0];
      const categoryWords = words.filter(w => w.category === hintCategory && !w.isMatched);
      
      if (atmosphere === 'horror') {
        return `The shadows whisper of: ${hintCategory}...`;
      } else if (atmosphere === 'dark_transition') {
        return `Look for connections in: ${hintCategory}`;
      } else {
        return `Find words related to: ${hintCategory}`;
      }
    }
    
    return '';
  };

  const getInstructions = () => {
    if (atmosphere === 'horror') {
      return 'Group the cursed words... if you can remember what they mean.';
    } else if (atmosphere === 'dark_transition') {
      return 'Find the hidden connections between words.';
    } else if (atmosphere === 'unsettling') {
      return 'Something connects these words... but what?';
    } else {
      return 'Group words that belong together (3+ words per group).';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">
          Moves: {moves} | Groups Found: {matches.length}
        </div>
        <div 
          className="text-sm mb-4"
          style={{
            color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#A0AEC0' : '#4A5568'
          }}
        >
          {getInstructions()}
        </div>
      </div>

      <div 
        className="grid gap-3 p-6 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(words.length))}, 1fr)`,
          background: atmosphere === 'horror' ? '#0F0F0F' : 
                     atmosphere === 'dark_transition' ? '#1A1A1A' : '#F7FAFC',
          minWidth: '400px'
        }}
      >
        <AnimatePresence>
          {words.map((word) => (
            <motion.button
              key={word.id}
              className="px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none"
              style={getWordStyle(word)}
              onClick={() => handleWordClick(word)}
              disabled={word.isMatched}
              whileHover={!word.isMatched ? { scale: 1.02 } : {}}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: word.isSelected ? 1.05 : 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              layout
            >
              {word.word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Selected words indicator */}
      {selectedWords.length > 0 && (
        <div className="text-center">
          <div 
            className="text-sm mb-2"
            style={{
              color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#2D3748'
            }}
          >
            Selected: {selectedWords.map(w => w.word).join(', ')}
          </div>
          <div className="text-xs opacity-75">
            {selectedWords.length >= 3 ? 'Click another word or wait for match check' : `Need ${3 - selectedWords.length} more word(s)`}
          </div>
        </div>
      )}

      {/* Hint system */}
      <div className="flex space-x-4">
        <button
          onClick={() => setShowHint(!showHint)}
          className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105"
          style={{
            background: atmosphere === 'horror' ? '#2C1810' : 
                       atmosphere === 'dark_transition' ? '#4A5568' : '#E2E8F0',
            border: '2px solid #2D3748',
            color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
          }}
        >
          {showHint ? 'Hide Hint' : 'Show Hint'}
        </button>
        
        <button
          onClick={initializePuzzle}
          className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105"
          style={{
            background: atmosphere === 'horror' ? '#2C1810' : 
                       atmosphere === 'dark_transition' ? '#4A5568' : '#E2E8F0',
            border: '2px solid #2D3748',
            color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
          }}
        >
          New Puzzle
        </button>
      </div>

      {/* Hint display */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center text-sm p-3 rounded-lg"
            style={{
              background: atmosphere === 'horror' ? '#1A1A2E' : 
                         atmosphere === 'dark_transition' ? '#2D3748' : '#EDF2F7',
              color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#2D3748',
              border: `1px solid ${atmosphere === 'horror' ? '#2C1810' : '#CBD5E0'}`
            }}
          >
            {getHintText()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matched categories display */}
      {matches.length > 0 && (
        <div className="text-center">
          <div 
            className="text-sm font-medium mb-2"
            style={{
              color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#2D3748'
            }}
          >
            Completed Groups:
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {matches.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: atmosphere === 'horror' ? '#2C1810' : 
                             atmosphere === 'dark_transition' ? '#4A5568' : '#C6F6D5',
                  color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
                }}
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordAssociationPuzzle;