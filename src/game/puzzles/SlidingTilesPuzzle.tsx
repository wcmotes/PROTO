import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzleData, AtmosphereType } from '../../types/game';
import { useGameStore } from '../engine/gameStore';
import { useAudio } from '../audio/useAudio';

interface SlidingTilesPuzzleProps {
  puzzleData: PuzzleData;
  atmosphere: AtmosphereType;
  onComplete: () => void;
}

interface Tile {
  id: number;
  value: number;
  position: { x: number; y: number };
  isEmpty: boolean;
}

const SlidingTilesPuzzle: React.FC<SlidingTilesPuzzleProps> = ({
  puzzleData,
  atmosphere,
  onComplete,
}) => {
  const { updatePuzzleState } = useGameStore();
  const { playClick, playSuccess, playError } = useAudio();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [emptyPosition, setEmptyPosition] = useState({ x: 2, y: 2 });
  const [moves, setMoves] = useState(0);
  const gridSize = 3; // 3x3 grid for sliding tiles

  // Initialize puzzle
  useEffect(() => {
    initializePuzzle();
  }, [puzzleData.difficulty]);

  const initializePuzzle = useCallback(() => {
    const newTiles: Tile[] = [];
    const numbers = Array.from({ length: gridSize * gridSize - 1 }, (_, i) => i + 1);
    
    // Shuffle the numbers
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // Create tiles
    let numberIndex = 0;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (x === gridSize - 1 && y === gridSize - 1) {
          // Empty space
          setEmptyPosition({ x, y });
        } else {
          newTiles.push({
            id: numberIndex,
            value: numbers[numberIndex],
            position: { x, y },
            isEmpty: false,
          });
          numberIndex++;
        }
      }
    }

    setTiles(newTiles);
    setMoves(0);
    updatePuzzleState({ moves: 0, isCompleted: false });
  }, [gridSize, updatePuzzleState]);

  const canMoveTile = (tilePosition: { x: number; y: number }): boolean => {
    const dx = Math.abs(tilePosition.x - emptyPosition.x);
    const dy = Math.abs(tilePosition.y - emptyPosition.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  };

  const moveTile = (tileId: number) => {
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || !canMoveTile(tile.position)) {
      playError();
      return;
    }

    playClick();
    const newTiles = tiles.map(t => {
      if (t.id === tileId) {
        return { ...t, position: { ...emptyPosition } };
      }
      return t;
    });

    setEmptyPosition(tile.position);
    setTiles(newTiles);
    setMoves(prev => prev + 1);
    updatePuzzleState({ moves: moves + 1 });

    // Check if puzzle is solved
    setTimeout(() => checkCompletion(newTiles), 100);
  };

  const checkCompletion = (currentTiles: Tile[]) => {
    const isSolved = currentTiles.every(tile => {
      const expectedPosition = {
        x: (tile.value - 1) % gridSize,
        y: Math.floor((tile.value - 1) / gridSize)
      };
      return tile.position.x === expectedPosition.x && tile.position.y === expectedPosition.y;
    });

    if (isSolved) {
      playSuccess();
      updatePuzzleState({ isCompleted: true });
      onComplete();
    }
  };

  const getTileStyle = (atmosphere: AtmosphereType) => {
    const baseStyle = {
      cheerful: {
        background: 'linear-gradient(135deg, #FFE5B4, #B4E5FF)',
        border: '2px solid #E5FFB4',
        color: '#2D3748',
        shadow: '0 4px 8px rgba(0,0,0,0.1)'
      },
      neutral: {
        background: 'linear-gradient(135deg, #E2E8F0, #CBD5E0)',
        border: '2px solid #A0AEC0',
        color: '#2D3748',
        shadow: '0 4px 8px rgba(0,0,0,0.2)'
      },
      unsettling: {
        background: 'linear-gradient(135deg, #D69E2E, #B7791F)',
        border: '2px solid #975A16',
        color: '#1A202C',
        shadow: '0 4px 12px rgba(0,0,0,0.3)'
      },
      dark_transition: {
        background: 'linear-gradient(135deg, #4A5568, #2D3748)',
        border: '2px solid #1A202C',
        color: '#E2E8F0',
        shadow: '0 6px 16px rgba(0,0,0,0.4)'
      },
      horror: {
        background: 'linear-gradient(135deg, #2C1810, #1A1A2E)',
        border: '2px solid #16213E',
        color: '#E2E8F0',
        shadow: '0 8px 20px rgba(0,0,0,0.6)'
      }
    };
    return baseStyle[atmosphere];
  };

  const tileStyle = getTileStyle(atmosphere);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-lg font-semibold">
        Moves: {moves}
      </div>
      
      <div 
        className="grid grid-cols-3 gap-2 p-4 rounded-lg"
        style={{
          background: atmosphere === 'horror' ? '#0F0F0F' : 
                     atmosphere === 'dark_transition' ? '#1A1A1A' : '#F7FAFC'
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const x = index % gridSize;
          const y = Math.floor(index / gridSize);
          const tile = tiles.find(t => t.position.x === x && t.position.y === y);
          const isEmpty = x === emptyPosition.x && y === emptyPosition.y;

          if (isEmpty) {
            return (
              <div
                key={`empty-${x}-${y}`}
                className="w-20 h-20 rounded-lg"
                style={{ opacity: 0.3, background: tileStyle.background }}
              />
            );
          }

          if (!tile) return null;

          const canMove = canMoveTile(tile.position);

          return (
            <AnimatePresence key={tile.id}>
              <motion.div
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={canMove ? { scale: 1.05 } : {}}
                whileTap={canMove ? { scale: 0.95 } : {}}
                className={`w-20 h-20 rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-200 ${
                  canMove ? 'hover:brightness-110' : 'cursor-not-allowed opacity-80'
                }`}
                style={{
                  background: tileStyle.background,
                  border: tileStyle.border,
                  color: tileStyle.color,
                  boxShadow: tileStyle.shadow,
                  filter: atmosphere === 'horror' ? 'contrast(1.2) brightness(0.8)' : 'none'
                }}
                onClick={() => canMove && moveTile(tile.id)}
              >
                {tile.value}
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>

      <button
        onClick={initializePuzzle}
        className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
        style={{
          background: tileStyle.background,
          border: tileStyle.border,
          color: tileStyle.color,
          boxShadow: tileStyle.shadow
        }}
      >
        Shuffle
      </button>
    </div>
  );
};

export default SlidingTilesPuzzle;