import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzleData, AtmosphereType } from '../../types/game';
import { useGameStore } from '../engine/gameStore';

interface LogicGridPuzzleProps {
  puzzleData: PuzzleData;
  atmosphere: AtmosphereType;
  onComplete: () => void;
}

interface GridCell {
  id: string;
  value: number | null;
  isFixed: boolean;
  isHighlighted: boolean;
  isError: boolean;
}

const LogicGridPuzzle: React.FC<LogicGridPuzzleProps> = ({
  puzzleData,
  atmosphere,
  onComplete,
}) => {
  const { updatePuzzleState } = useGameStore();
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [moves, setMoves] = useState(0);
  const gridSize = Math.min(3 + Math.floor(puzzleData.difficulty / 2), 6); // 3x3 to 6x6

  // Initialize puzzle
  useEffect(() => {
    initializePuzzle();
  }, [puzzleData.difficulty]);

  const initializePuzzle = useCallback(() => {
    const newGrid: GridCell[][] = [];
    
    // Create a valid solution first
    const solution = generateValidSolution(gridSize);
    
    // Remove some numbers to create the puzzle
    const difficultyFactor = Math.min(puzzleData.difficulty / 10, 0.7);
    const cellsToRemove = Math.floor(gridSize * gridSize * difficultyFactor);
    
    for (let row = 0; row < gridSize; row++) {
      newGrid[row] = [];
      for (let col = 0; col < gridSize; col++) {
        newGrid[row][col] = {
          id: `${row}-${col}`,
          value: solution[row][col],
          isFixed: true,
          isHighlighted: false,
          isError: false
        };
      }
    }
    
    // Remove cells to create puzzle
    const cellsToRemoveList: {row: number, col: number}[] = [];
    while (cellsToRemoveList.length < cellsToRemove) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      if (!cellsToRemoveList.some(cell => cell.row === row && cell.col === col)) {
        cellsToRemoveList.push({row, col});
      }
    }
    
    cellsToRemoveList.forEach(({row, col}) => {
      newGrid[row][col].value = null;
      newGrid[row][col].isFixed = false;
    });

    setGrid(newGrid);
    setSelectedCell(null);
    setMoves(0);
    updatePuzzleState({ moves: 0, isCompleted: false });
  }, [gridSize, puzzleData.difficulty, updatePuzzleState]);

  const generateValidSolution = (size: number): number[][] => {
    const solution: number[][] = [];
    
    // Generate a simple pattern that ensures each row and column has unique numbers
    for (let row = 0; row < size; row++) {
      solution[row] = [];
      for (let col = 0; col < size; col++) {
        // Latin square pattern
        solution[row][col] = ((row + col) % size) + 1;
      }
    }
    
    // Shuffle rows and columns to make it more interesting
    for (let i = 0; i < size * 2; i++) {
      const row1 = Math.floor(Math.random() * size);
      const row2 = Math.floor(Math.random() * size);
      [solution[row1], solution[row2]] = [solution[row2], solution[row1]];
    }
    
    return solution;
  };

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].isFixed) return;
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (number: number) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    if (grid[row][col].isFixed) return;

    const newGrid = [...grid];
    const oldValue = newGrid[row][col].value;
    newGrid[row][col].value = number;
    newGrid[row][col].isError = false;
    
    // Check for conflicts
    const hasConflict = checkConflicts(newGrid, row, col, number);
    if (hasConflict) {
      newGrid[row][col].isError = true;
    }
    
    setGrid(newGrid);
    
    if (oldValue !== number) {
      setMoves(prev => prev + 1);
      updatePuzzleState({ moves: moves + 1 });
    }
    
    // Check completion
    setTimeout(() => checkCompletion(newGrid), 100);
  };

  const checkConflicts = (currentGrid: GridCell[][], row: number, col: number, value: number): boolean => {
    // Check row
    for (let c = 0; c < gridSize; c++) {
      if (c !== col && currentGrid[row][c].value === value) {
        return true;
      }
    }
    
    // Check column
    for (let r = 0; r < gridSize; r++) {
      if (r !== row && currentGrid[r][col].value === value) {
        return true;
      }
    }
    
    return false;
  };

  const checkCompletion = (currentGrid: GridCell[][]) => {
    // Check if all cells are filled
    const allFilled = currentGrid.every(row => 
      row.every(cell => cell.value !== null)
    );
    
    // Check if no errors
    const noErrors = currentGrid.every(row => 
      row.every(cell => !cell.isError)
    );
    
    if (allFilled && noErrors) {
      updatePuzzleState({ isCompleted: true });
      onComplete();
    }
  };

  const clearCell = () => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    if (grid[row][col].isFixed) return;

    const newGrid = [...grid];
    newGrid[row][col].value = null;
    newGrid[row][col].isError = false;
    
    setGrid(newGrid);
    setMoves(prev => prev + 1);
    updatePuzzleState({ moves: moves + 1 });
  };

  const getCellStyle = (cell: GridCell, isSelected: boolean) => {
    const baseColors = {
      cheerful: {
        background: cell.isFixed ? '#E5FFB4' : '#FFFFFF',
        border: isSelected ? '#4299E1' : cell.isError ? '#E53E3E' : '#CBD5E0',
        text: cell.isFixed ? '#2D3748' : '#1A202C'
      },
      neutral: {
        background: cell.isFixed ? '#E2E8F0' : '#FFFFFF',
        border: isSelected ? '#4299E1' : cell.isError ? '#E53E3E' : '#A0AEC0',
        text: '#2D3748'
      },
      unsettling: {
        background: cell.isFixed ? '#D69E2E' : '#FFF5E6',
        border: isSelected ? '#D69E2E' : cell.isError ? '#C53030' : '#B7791F',
        text: '#1A202C'
      },
      dark_transition: {
        background: cell.isFixed ? '#4A5568' : '#2D3748',
        border: isSelected ? '#63B3ED' : cell.isError ? '#FC8181' : '#718096',
        text: '#E2E8F0'
      },
      horror: {
        background: cell.isFixed ? '#2C1810' : '#1A1A2E',
        border: isSelected ? '#FF6B6B' : cell.isError ? '#FF4444' : '#16213E',
        text: '#E2E8F0'
      }
    };

    const colors = baseColors[atmosphere];
    
    return {
      background: colors.background,
      border: `2px solid ${colors.border}`,
      color: colors.text,
      fontWeight: cell.isFixed ? 'bold' : 'normal',
      opacity: cell.isError ? 0.8 : 1
    };
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-lg font-semibold">
        Moves: {moves}
      </div>
      
      <div className="text-sm text-center opacity-75">
        Fill the grid so each row and column contains unique numbers
      </div>
      
      <div 
        className="grid gap-1 p-4 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          background: atmosphere === 'horror' ? '#0F0F0F' : 
                     atmosphere === 'dark_transition' ? '#1A1A1A' : '#F7FAFC'
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const cellStyle = getCellStyle(cell, isSelected);

            return (
              <motion.div
                key={cell.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded flex items-center justify-center text-lg font-medium cursor-pointer transition-all duration-200"
                style={cellStyle}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell.value}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Number input buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: gridSize }, (_, i) => i + 1).map(number => (
          <motion.button
            key={number}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-lg font-bold transition-all duration-200"
            style={{
              background: atmosphere === 'horror' ? '#2C1810' : 
                         atmosphere === 'dark_transition' ? '#4A5568' : '#E2E8F0',
              border: '2px solid #2D3748',
              color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
            }}
            onClick={() => handleNumberInput(number)}
          >
            {number}
          </motion.button>
        ))}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-lg font-bold transition-all duration-200"
          style={{
            background: atmosphere === 'horror' ? '#1A0000' : 
                       atmosphere === 'dark_transition' ? '#2D3748' : '#CBD5E0',
            border: '2px solid #2D3748',
            color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
          }}
          onClick={clearCell}
        >
          ✕
        </motion.button>
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
        New Puzzle
      </button>
    </div>
  );
};

export default LogicGridPuzzle;