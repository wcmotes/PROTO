import SlidingTilesPuzzle from './SlidingTilesPuzzle';
import PatternMatchPuzzle from './PatternMatchPuzzle';
import LogicGridPuzzle from './LogicGridPuzzle';
import MemorySequencePuzzle from './MemorySequencePuzzle';
import WordAssociationPuzzle from './WordAssociationPuzzle';
import RiddlePuzzle from './RiddlePuzzle';

export { SlidingTilesPuzzle, PatternMatchPuzzle, LogicGridPuzzle, MemorySequencePuzzle, WordAssociationPuzzle, RiddlePuzzle };

// Puzzle type mapping for dynamic imports
export const PUZZLE_COMPONENTS = {
  sliding_tiles: SlidingTilesPuzzle,
  pattern_match: PatternMatchPuzzle,
  logic_grid: LogicGridPuzzle,
  memory_sequence: MemorySequencePuzzle,
  word_association: WordAssociationPuzzle,
  riddle: RiddlePuzzle,
} as const;

export type PuzzleComponentType = keyof typeof PUZZLE_COMPONENTS;