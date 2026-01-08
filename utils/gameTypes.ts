// Game of Strife types adapted for 2-player system

export interface Cell {
  player: number | null; // 0 for player 1, 1 for player 2, null for empty
  alive: boolean;
  superpowerType: number; // 0 = normal, 1-7 = different superpower types
  memory: number; // 32-bit flags for persistent memory
  lives: number; // Number of lives remaining (default: 1 for normal cells)
}

export type GameStage = 'placement' | 'simulation' | 'paused' | 'finished' | 'waiting';

// Memory bit flags
export const MEMORY_FLAGS = {
  HAS_SURVIVED_DEATH: 1 << 0,
  HAS_CAUSED_BIRTH: 1 << 1,
  IS_VETERAN: 1 << 2,
  HAS_SPREAD: 1 << 3,
  BATTLE_SCARRED: 1 << 4,
};

// Game of Strife specific state that extends the base game state
export interface GameOfStrifeState {
  // Core game data
  board: Cell[][]
  boardSize: number
  stage: GameStage
  generation: number

  // Player data
  currentPlayer: 0 | 1 | null
  playerTokens: {
    player0: number
    player1: number
  }

  // Game flow
  winner: 0 | 1 | null
  isFinished: boolean

  // Conway simulation
  simulationSpeed: number
  simulationRunning: boolean

  // Metadata
  version: number
  startedAt?: Date
  finishedAt?: Date
}

// Conway's Game of Life rules
export interface ConwayRules {
  birthRules: number[]     // Neighbor counts that cause birth
  survivalRules: number[]  // Neighbor counts that allow survival
}

export const DEFAULT_CONWAY_RULES: ConwayRules = {
  birthRules: [3],        // Standard Conway's rule: birth on 3 neighbors
  survivalRules: [2, 3]   // Standard Conway's rule: survive on 2 or 3 neighbors
}

// Game configuration
export interface GameOfStrifeConfig {
  boardSize: number
  tokensPerPlayer: number
  conwayRules: ConwayRules
  simulationGenerations?: number
  simulationSpeed?: number // milliseconds between generations
}

export const DEFAULT_GAME_CONFIG: GameOfStrifeConfig = {
  boardSize: 15,
  tokensPerPlayer: 20, // Updated to match settings default (was 10 - legacy value)
  conwayRules: DEFAULT_CONWAY_RULES,
  simulationGenerations: 100,
  simulationSpeed: 200
}

// Action types for the game
export type GameOfStrifeAction =
  | { type: 'PLACE_TOKEN'; payload: { row: number; col: number; player: 0 | 1 } }
  | { type: 'START_SIMULATION' }
  | { type: 'PAUSE_SIMULATION' }
  | { type: 'RESUME_SIMULATION' }
  | { type: 'STEP_SIMULATION' }
  | { type: 'FINISH_GAME'; payload: { winner: 0 | 1 | null } }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_BOARD'; payload: { board: Cell[][] } }

// Utility functions
export function createEmptyCell(): Cell {
  return {
    player: null,
    alive: false,
    superpowerType: 0,
    memory: 0,
    lives: 0  // Normal cells have 0 lives (die immediately)
  }
}

export function createEmptyBoard(size: number): Cell[][] {
  return Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => createEmptyCell())
  )
}

export function isCellEmpty(cell: Cell): boolean {
  return cell.player === null
}

export function isCellOccupied(cell: Cell): boolean {
  return cell.player !== null
}

export function countLivingCells(board: Cell[][], player?: number): number {
  let count = 0
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col]
      if (cell.alive && (player === undefined || cell.player === player)) {
        count++
      }
    }
  }
  return count
}

export function getBoardFromFlat(flatBoard: (string | null)[], boardSize: number): Cell[][] {
  const board = createEmptyBoard(boardSize)

  for (let i = 0; i < flatBoard.length; i++) {
    const row = Math.floor(i / boardSize)
    const col = i % boardSize

    if (row < boardSize && col < boardSize && flatBoard[i] !== null) {
      board[row][col] = {
        player: flatBoard[i] === 'P1' ? 0 : 1,
        alive: true,
        superpowerType: 0,
        memory: 0
      }
    }
  }

  return board
}

export function flattenBoard(board: Cell[][]): (string | null)[] {
  const flat: (string | null)[] = []

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col]
      if (cell.player !== null) {
        flat.push(cell.player === 0 ? 'P1' : 'P2')
      } else {
        flat.push(null)
      }
    }
  }

  return flat
}

// Position utilities
export function positionToIndex(row: number, col: number, boardSize: number): number {
  return row * boardSize + col
}

export function indexToPosition(index: number, boardSize: number): { row: number, col: number } {
  return {
    row: Math.floor(index / boardSize),
    col: index % boardSize
  }
}

// Conway's Game of Life simulation
export function simulateOneGeneration(board: Cell[][], rules: ConwayRules = DEFAULT_CONWAY_RULES): Cell[][] {
  const size = board.length
  const newBoard = createEmptyBoard(size)

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = board[row][col]
      const neighbors = getNeighbors(board, row, col)
      const aliveNeighbors = neighbors.filter(n => n.alive).length

      // Apply Conway's rules
      const shouldLive = shouldCellLive(cell, aliveNeighbors, rules)
      const newOwner = determineNewOwner(cell, neighbors, aliveNeighbors, rules)

      // Lives system: cells can survive death by spending lives
      let finalAlive = shouldLive
      let finalLives = cell.lives
      let finalMemory = updateMemory(cell, shouldLive, aliveNeighbors)

      if (cell.alive && !shouldLive) {
        // Cell would die - check if it has lives to spend
        if (cell.lives >= 1) {
          // Has lives to spend - survive and decrement
          finalAlive = true
          finalLives = cell.lives - 1
          finalMemory |= MEMORY_FLAGS.HAS_SURVIVED_DEATH
        } else {
          // No lives (0) - dies immediately like normal cell
          finalAlive = false
          finalLives = 0
        }
      } else if (!cell.alive && shouldLive) {
        // Cell is born - inherit lives from parent cells (for now default to 0)
        // Lives will be set properly when cell is placed
        finalLives = 0
      }

      newBoard[row][col] = {
        player: newOwner,
        alive: finalAlive,
        superpowerType: finalAlive ? cell.superpowerType : 0,
        memory: finalMemory,
        lives: finalLives
      }
    }
  }

  return newBoard
}

function getNeighbors(board: Cell[][], row: number, col: number): Cell[] {
  const neighbors: Cell[] = []
  const size = board.length

  // Moore neighborhood (8 directions) with toroidal wraparound
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue // Skip self

      // Wraparound using modulo (toroidal topology)
      // Adding size before modulo ensures positive results for negative indices
      const wrappedRow = (row + dr + size) % size
      const wrappedCol = (col + dc + size) % size
      neighbors.push(board[wrappedRow][wrappedCol])
    }
  }

  return neighbors
}

function shouldCellLive(cell: Cell, aliveNeighbors: number, rules: ConwayRules): boolean {
  if (cell.alive) {
    // Living cell: check survival rules
    return rules.survivalRules.includes(aliveNeighbors)
  } else {
    // Dead cell: check birth rules
    return rules.birthRules.includes(aliveNeighbors)
  }
}

function determineNewOwner(cell: Cell, neighbors: Cell[], aliveNeighbors: number, rules: ConwayRules): number | null {
  const aliveNeighborsList = neighbors.filter(n => n.alive)

  if (aliveNeighborsList.length === 0) {
    return null // No living neighbors
  }

  // If cell was alive and stays alive, keep owner
  if (cell.alive && shouldCellLive(cell, aliveNeighbors, rules)) {
    return cell.player
  }

  // For new births, inherit from dominant neighbor
  const playerCounts: Record<number, number> = { 0: 0, 1: 0 }
  aliveNeighborsList.forEach(neighbor => {
    if (neighbor.player !== null) {
      playerCounts[neighbor.player]++
    }
  })

  // Return player with most neighbors, or null if tied
  if (playerCounts[0] > playerCounts[1]) return 0
  if (playerCounts[1] > playerCounts[0]) return 1
  return null // Tie or no ownership
}

function updateMemory(cell: Cell, willLive: boolean, _aliveNeighbors: number): number {
  let memory = cell.memory

  if (cell.alive && !willLive) {
    // Cell is dying
    memory |= MEMORY_FLAGS.BATTLE_SCARRED
  }

  if (!cell.alive && willLive) {
    // Cell is being born
    memory |= MEMORY_FLAGS.HAS_CAUSED_BIRTH
  }

  if (cell.alive && willLive) {
    // Cell survived another generation
    memory |= MEMORY_FLAGS.IS_VETERAN
  }

  return memory
}

// Check if two boards are equal (for detecting stable states)
export function boardsEqual(board1: Cell[][], board2: Cell[][]): boolean {
  if (board1.length !== board2.length) return false

  for (let row = 0; row < board1.length; row++) {
    if (board1[row].length !== board2[row].length) return false

    for (let col = 0; col < board1[row].length; col++) {
      const cell1 = board1[row][col]
      const cell2 = board2[row][col]

      if (cell1.alive !== cell2.alive || cell1.player !== cell2.player) {
        return false
      }
    }
  }

  return true
}