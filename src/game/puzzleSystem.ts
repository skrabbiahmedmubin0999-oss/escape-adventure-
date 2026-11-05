import { PuzzleState, PuzzleType } from './types';
import { sound } from '../audio/soundSystem';

export interface PuzzleDefinition extends PuzzleState {
  solution: unknown;
  currentValue: unknown;
}

class PuzzleSystem {
  private puzzles: Map<string, PuzzleDefinition> = new Map();
  public onPuzzleChange?: (puzzles: PuzzleState[]) => void;
  public onPuzzleSolved?: (puzzle: PuzzleState, rewardCoins: number, rewardXp: number) => void;

  constructor() {
    this.initPuzzles();
  }

  public initPuzzles() {
    this.puzzles.clear();

    // Puzzle A — Symbol Matching
    this.puzzles.set('puzzle_symbol_matching', {
      id: 'puzzle_symbol_matching',
      name: 'Pillars of the Sun Temple',
      type: 'symbol_match',
      solved: false,
      clue: 'Match the ancient triad: Sun ☀️ -> Water 🌊 -> Leaf 🍃',
      locationName: 'Sun Temple Terrace (x: 24, z: -16)',
      position: [24, 4.2, -16],
      symbols: ['Sun', 'Moon', 'Water'], // Current player selection
      solution: ['Sun', 'Water', 'Leaf'],
      currentValue: ['Sun', 'Moon', 'Water'],
    });

    // Puzzle B — Switch Sequence
    this.puzzles.set('puzzle_switch_sequence', {
      id: 'puzzle_switch_sequence',
      name: 'Waterfall Rune Levers',
      type: 'switch_sequence',
      solved: false,
      clue: 'Activate switches in the ancient order: Lever II -> IV -> I -> III',
      locationName: 'Waterfall Grotto (x: -16, z: -8)',
      position: [-16, 1.8, -8],
      switchesState: [false, false, false, false],
      solution: [1, 3, 0, 2], // Order indices: II, IV, I, III
      currentValue: [] as number[], // Sequence pressed so far
    });

    // Puzzle C — Ancient Rune Dial
    this.puzzles.set('puzzle_rune_dial', {
      id: 'puzzle_rune_dial',
      name: 'Sacred Grove Rune Altar',
      type: 'rune_dial',
      solved: false,
      clue: 'Align Solar Ring to North (0°), Ocean Ring to South (180°), and Forest Ring to East (90°)',
      locationName: 'Sacred Grove (x: 18, z: 16)',
      position: [18, 2.5, 16],
      dialAngles: [90, 0, 270], // Current angles [Outer, Middle, Inner]
      solution: [0, 180, 90],
      currentValue: [90, 0, 270],
    });
  }

  public getPuzzles(): PuzzleState[] {
    return Array.from(this.puzzles.values()).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      solved: p.solved,
      clue: p.clue,
      locationName: p.locationName,
      position: p.position,
      symbols: p.symbols,
      switchesState: p.switchesState,
      dialAngles: p.dialAngles,
    }));
  }

  public getPuzzle(id: string): PuzzleDefinition | undefined {
    return this.puzzles.get(id);
  }

  // --- Puzzle A: Symbol Matching Action ---
  public rotatePillarSymbol(puzzleId: string, pillarIndex: number): boolean {
    const puzzle = this.puzzles.get(puzzleId);
    if (!puzzle || puzzle.solved || !puzzle.symbols) return false;

    const symbolList = ['Sun', 'Water', 'Leaf', 'Moon'];
    const currentSymbol = puzzle.symbols[pillarIndex];
    const nextIndex = (symbolList.indexOf(currentSymbol) + 1) % symbolList.length;
    puzzle.symbols[pillarIndex] = symbolList[nextIndex];
    puzzle.currentValue = [...puzzle.symbols];

    sound.playClick();
    this.checkPuzzle(puzzle);
    this.notifyChange();
    return puzzle.solved;
  }

  // --- Puzzle B: Switch Sequence Action ---
  public toggleSwitch(puzzleId: string, switchIndex: number): boolean {
    const puzzle = this.puzzles.get(puzzleId);
    if (!puzzle || puzzle.solved || !puzzle.switchesState) return false;

    const currentSequence = puzzle.currentValue as number[];

    // Activate switch
    puzzle.switchesState[switchIndex] = true;
    currentSequence.push(switchIndex);
    sound.playClick();

    const targetSequence = puzzle.solution as number[];
    let matches = true;

    for (let i = 0; i < currentSequence.length; i++) {
      if (currentSequence[i] !== targetSequence[i]) {
        matches = false;
        break;
      }
    }

    if (!matches) {
      // Reset switches on error
      sound.playLand();
      puzzle.switchesState = [false, false, false, false];
      puzzle.currentValue = [];
    } else if (currentSequence.length === targetSequence.length) {
      this.checkPuzzle(puzzle);
    }

    this.notifyChange();
    return puzzle.solved;
  }

  // --- Puzzle C: Rune Dial Action ---
  public rotateRuneRing(puzzleId: string, ringIndex: number): boolean {
    const puzzle = this.puzzles.get(puzzleId);
    if (!puzzle || puzzle.solved || !puzzle.dialAngles) return false;

    puzzle.dialAngles[ringIndex] = (puzzle.dialAngles[ringIndex] + 90) % 360;
    puzzle.currentValue = [...puzzle.dialAngles];
    sound.playClick();

    this.checkPuzzle(puzzle);
    this.notifyChange();
    return puzzle.solved;
  }

  private checkPuzzle(puzzle: PuzzleDefinition) {
    if (puzzle.solved) return;

    let isMatch = false;
    if (puzzle.type === 'symbol_match') {
      const current = puzzle.symbols || [];
      const sol = puzzle.solution as string[];
      isMatch = current.length === sol.length && current.every((val, idx) => val === sol[idx]);
    } else if (puzzle.type === 'switch_sequence') {
      const current = puzzle.currentValue as number[];
      const sol = puzzle.solution as number[];
      isMatch = current.length === sol.length && current.every((val, idx) => val === sol[idx]);
    } else if (puzzle.type === 'rune_dial') {
      const current = puzzle.dialAngles || [];
      const sol = puzzle.solution as number[];
      isMatch = current.length === sol.length && current.every((val, idx) => val === sol[idx]);
    }

    if (isMatch) {
      puzzle.solved = true;
      sound.playAltarActivate();

      if (this.onPuzzleSolved) {
        this.onPuzzleSolved(
          {
            id: puzzle.id,
            name: puzzle.name,
            type: puzzle.type,
            solved: true,
            clue: puzzle.clue,
            locationName: puzzle.locationName,
            position: puzzle.position,
          },
          100, // reward coins
          200  // reward XP
        );
      }
    }
  }

  private notifyChange() {
    if (this.onPuzzleChange) {
      this.onPuzzleChange(this.getPuzzles());
    }
  }

  public resetPuzzles() {
    this.initPuzzles();
    this.notifyChange();
  }
}

export const puzzleSystem = new PuzzleSystem();
