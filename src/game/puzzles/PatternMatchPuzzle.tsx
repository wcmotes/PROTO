import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzleData, AtmosphereType } from '../../types/game';
import { useGameStore } from '../engine/gameStore';
import { useAudio } from '../audio/useAudio';

interface PatternMatchPuzzleProps {
  puzzleData: PuzzleData;
  atmosphere: AtmosphereType;
  onComplete: () => void;
}

interface PatternTile {
  id: number;
  color: string;
  symbol: string;
  isRevealed: boolean;
  isMatched: boolean;
  position: number;
}

const PatternMatchPuzzle: React.FC<PatternMatchPuzzleProps> = ({
  puzzleData,
  atmosphere,
  onComplete,
}) => {
  const { updatePuzzleState } = useGameStore();
  const { playClick, playSuccess, playError } = useAudio();
  const [tiles, setTiles] = useState<PatternTile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [showPattern, setShowPattern] = useState(true);
  const gridSize = Math.min(4 + Math.floor(puzzleData.difficulty / 2), 6); // 4x4 to 6x6

  const getSymbolsForAtmosphere = (atmosphere: AtmosphereType): string[] => {
    const symbols = {
      cheerful: ['🌟', '⭐', '🎯', '🎨', '🎪', '🎭', '🎨', '🌈', '🎵', '🎪'],
      neutral: ['●', '■', '▲', '♦', '♠', '♣', '♥', '◆', '▼', '◀'],
      unsettling: ['👁️', '🔍', '⚠️', '🔺', '⬟', '◊', '⬢', '⬡', '⬠', '⬞'],
      dark_transition: ['▣', '▤', '▥', '▦', '▧', '▨', '▩', '▪', '▫', '▬'],
      horror: ['☠️', '👻', '🕷️', '🦇', '⚡', '💀', '🔥', '👹', '🌙', '⚰️']
    };
    return symbols[atmosphere];
  };

  const getColorsForAtmosphere = (atmosphere: AtmosphereType): string[] => {
    const colors = {
      cheerful: ['#FFE5B4', '#B4E5FF', '#E5FFB4', '#FFB4E5', '#B4FFE5', '#E5B4FF'],
      neutral: ['#E2E8F0', '#CBD5E0', '#A0AEC0', '#718096', '#4A5568', '#2D3748'],
      unsettling: ['#D69E2E', '#B7791F', '#975A16', '#744210', '#553C0B', '#3D2B08'],
      dark_transition: ['#4A5568', '#2D3748', '#1A202C', '#171923', '#0F1419', '#0A0E13'],
      horror: ['#2C1810', '#1A1A2E', '#16213E', '#0F0F0F', '#1A0000', '#000000']
    };
    return colors[atmosphere];
  };

  // Initialize puzzle
  useEffect(() => {
    initializePuzzle();
  }, [puzzleData.difficulty, atmosphere]);

  const initializePuzzle = useCallback(() => {
    const symbols = getSymbolsForAtmosphere(atmosphere);
    const colors = getColorsForAtmosphere(atmosphere);
    const totalTiles = gridSize * gridSize;
    const pairCount = Math.floor(totalTiles / 2);
    
    const newTiles: PatternTile[] = [];
    
    // Create pairs
    for (let i = 0; i < pairCount; i++) {
      const symbol = symbols[i % symbols.length];
      const color = colors[i % colors.length];
      
      // Add two tiles with same pattern
      newTiles.push(
        {
          id: i * 2,
          color,
          symbol,
          isRevealed: false,
          isMatched: false,
          position: i * 2
        },
        {
          id: i * 2 + 1,
          color,
          symbol,
          isRevealed: false,
          isMatched: false,
          position: i * 2 + 1
        }
      );
    }

    // Shuffle tiles
    for (let i = newTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
      newTiles[i].position = i;
      newTiles[j].position = j;
    }

    setTiles(newTiles);
    setSelectedTiles([]);
    setMoves(0);
    setShowPattern(true);
    
    // Show pattern briefly
    setTimeout(() => setShowPattern(false), 2000 + puzzleData.difficulty * 500);
    
    updatePuzzleState({ moves: 0, isCompleted: false });
  }, [gridSize, atmosphere, puzzleData.difficulty, updatePuzzleState]);

  const handleTileClick = (tileId: number) => {
    if (selectedTiles.length >= 2) return;
    if (selectedTiles.includes(tileId)) return;
    if (tiles.find(t => t.id === tileId)?.isMatched) return;

    playClick();
    const newSelectedTiles = [...selectedTiles, tileId];
    setSelectedTiles(newSelectedTiles);

    // Reveal the tile
    setTiles(prev => prev.map(tile => 
      tile.id === tileId ? { ...tile, isRevealed: true } : tile
    ));

    if (newSelectedTiles.length === 2) {
      setMoves(prev => prev + 1);
      updatePuzzleState({ moves: moves + 1 });
      
      const [firstId, secondId] = newSelectedTiles;
      const firstTile = tiles.find(t => t.id === firstId);
      const secondTile = tiles.find(t => t.id === secondId);

      if (firstTile && secondTile && 
          firstTile.symbol === secondTile.symbol && 
          firstTile.color === secondTile.color) {
        // Match found
        playSuccess();
        setTimeout(() => {
          setTiles(prev => prev.map(tile => 
            newSelectedTiles.includes(tile.id) 
              ? { ...tile, isMatched: true }
              : tile
          ));
          setSelectedTiles([]);
          checkCompletion();
        }, 1000);
      } else {
        // No match
        playError();
        setTimeout(() => {
          setTiles(prev => prev.map(tile => 
            newSelectedTiles.includes(tile.id) 
              ? { ...tile, isRevealed: false }
              : tile
          ));
          setSelectedTiles([]);
        }, 1500);
      }
    }
  };

  const checkCompletion = () => {
    setTimeout(() => {
      const allMatched = tiles.every(tile => tile.isMatched);
      if (allMatched) {
        updatePuzzleState({ isCompleted: true });
        onComplete();
      }
    }, 100);
  };

  const getTileStyle = (tile: PatternTile, isSelected: boolean) => {
    const baseStyle = {
      background: tile.isRevealed || tile.isMatched || showPattern ? tile.color : '#4A5568',
      border: `2px solid ${isSelected ? '#FFD700' : '#2D3748'}`,
      color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C',
      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
      filter: atmosphere === 'horror' ? 'contrast(1.3) brightness(0.7)' : 'none',
      opacity: tile.isMatched ? 0.7 : 1
    };

    if (atmosphere === 'horror') {
      baseStyle.background = tile.isRevealed || tile.isMatched || showPattern 
        ? tile.color 
        : 'linear-gradient(135deg, #1A0000, #000000)';
    }

    return baseStyle;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-lg font-semibold">
        Moves: {moves}
      </div>
      
      {showPattern && (
        <div className="text-center text-sm opacity-75">
          Memorize the pattern...
        </div>
      )}
      
      <div 
        className={`grid gap-2 p-4 rounded-lg`}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          background: atmosphere === 'horror' ? '#0F0F0F' : 
                     atmosphere === 'dark_transition' ? '#1A1A1A' : '#F7FAFC'
        }}
      >
        {tiles.map((tile) => {
          const isSelected = selectedTiles.includes(tile.id);
          const tileStyle = getTileStyle(tile, isSelected);

          return (
            <AnimatePresence key={tile.id}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-300"
                style={tileStyle}
                onClick={() => handleTileClick(tile.id)}
              >
                {(tile.isRevealed || tile.isMatched || showPattern) && tile.symbol}
              </motion.div>
            </AnimatePresence>
          );
        })}
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
        New Pattern
      </button>
    </div>
  );
};

export default PatternMatchPuzzle;