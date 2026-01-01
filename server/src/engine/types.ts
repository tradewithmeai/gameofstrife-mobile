// Engine abstraction types - matches existing MatchState structure
export interface EngineState {
  board: (string | null)[]  // 9 squares for tic-tac-toe
  currentTurn: 'P1' | 'P2' | null
  winner: 'P1' | 'P2' | 'draw' | null
  winningLine: number[] | null
  version: number
  finishedAt?: Date
}

export interface ValidationResult {
  valid: boolean
  reason?: 'invalid_square' | 'square_occupied' | 'not_your_turn' | 'match_finished'
  isRemoval?: boolean // True if this is a token removal operation
}

export interface ClaimApplication {
  board: (string | null)[]
  version: number
  nextTurn: 'P1' | 'P2' | null
  engineState?: any // Optional engine-specific state for complex games
}

export interface WinCheckResult {
  isWin: boolean
  line?: number[]
}

export interface ResultCheck {
  status: 'active' | 'finished'
  winner?: 'P1' | 'P2' | 'draw'
  winningLine?: number[]
  updatedState?: any  // For engines that simulate/transform state (e.g., Game of Strife Conway simulation)
}

// Optional parameters for game-specific claim logic
export interface ClaimOptions {
  superpowerType?: number  // For Game of Strife: 0-7 (0=normal, 1-7=superpower types)
}

// Main engine interface
export interface GameEngine {
  // Initialize a new game state
  initState(): EngineState

  // Validate if a claim is legal
  validateClaim(state: EngineState, seat: 'P1' | 'P2', squareId: number): ValidationResult

  // Apply a validated claim and return the mutation
  applyClaim(state: EngineState, seat: 'P1' | 'P2', squareId: number, options?: ClaimOptions): ClaimApplication

  // Check for win/draw after a move
  checkResult(state: EngineState): ResultCheck
}