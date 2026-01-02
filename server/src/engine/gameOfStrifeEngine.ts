import { GameEngine, EngineState, ValidationResult, ClaimApplication, ResultCheck } from './types.js'
import {
  GameOfStrifeEngineState,
  GameOfStrifeSettings,
  DEFAULT_GAME_SETTINGS,
  Cell,
  MemoryFlags,
  SuperpowerType,
  createBoard,
  isValidPosition,
  countLivingCells,
  indexToPosition
} from './gameOfStrifeTypes.js'
import { logger } from '../utils/logger.js'

export class GameOfStrifeEngine implements GameEngine {
  private settings: GameOfStrifeSettings

  constructor(settings: Partial<GameOfStrifeSettings> = {}) {
    this.settings = { ...DEFAULT_GAME_SETTINGS, ...settings }
  }

  /**
   * Generate a manifest of pre-allocated superpowers for a player
   * Ensures even distribution by guaranteeing exact percentage
   */
  private generateSuperpowerManifest(
    tokensPerPlayer: number,
    superpowerPercentage: number,
    enabledSuperpowers: number[]
  ): number[] {
    // Calculate how many superpowers this player should get
    const superpowerCount = Math.floor(tokensPerPlayer * (superpowerPercentage / 100))

    // Create array of all zeros (normal cells)
    const manifest: number[] = new Array(tokensPerPlayer).fill(0)

    // If no superpowers enabled or count is 0, return all zeros
    if (enabledSuperpowers.length === 0 || superpowerCount === 0) {
      return manifest
    }

    // Randomly select indices for superpower placements
    const superpowerIndices = new Set<number>()
    while (superpowerIndices.size < superpowerCount) {
      const randomIndex = Math.floor(Math.random() * tokensPerPlayer)
      superpowerIndices.add(randomIndex)
    }

    // Assign random superpower types to selected indices
    superpowerIndices.forEach(index => {
      const randomSuperpowerIndex = Math.floor(Math.random() * enabledSuperpowers.length)
      manifest[index] = enabledSuperpowers[randomSuperpowerIndex]
    })

    return manifest
  }

  initState(): EngineState {
    const board = createBoard(this.settings.boardSize)

    // Generate superpower manifests for both players
    const player0Superpowers = this.generateSuperpowerManifest(
      this.settings.tokensPerPlayer,
      this.settings.superpowerPercentage,
      this.settings.enabledSuperpowers
    )
    const player1Superpowers = this.generateSuperpowerManifest(
      this.settings.tokensPerPlayer,
      this.settings.superpowerPercentage,
      this.settings.enabledSuperpowers
    )

    logger.debug('[GameEngine] Generated superpower manifests', {
      player0Count: player0Superpowers.filter(s => s > 0).length,
      player1Count: player1Superpowers.filter(s => s > 0).length,
      percentage: this.settings.superpowerPercentage
    })

    const gameOfStrifeState: GameOfStrifeEngineState = {
      // Base EngineState properties - use 2D board for internal storage
      board: board,
      currentTurn: 'P1',
      winner: null,
      winningLine: null,
      version: 0,
      finishedAt: undefined,

      // Game of Strife specific properties
      currentPhase: 'placement',
      generation: 0,
      boardSize: this.settings.boardSize,
      conwayRules: this.settings.conwayRules,
      playerTokens: {
        player0: this.settings.tokensPerPlayer,
        player1: this.settings.tokensPerPlayer
      },
      turnNetPlacements: 0, // Track net placements for current turn
      player0Superpowers, // Pre-allocated superpowers for P1
      player1Superpowers, // Pre-allocated superpowers for P2
      placements: []
    }

    // Return the full GameOfStrifeEngineState directly
    return gameOfStrifeState as unknown as EngineState
  }

  validateClaim(state: EngineState, seat: 'P1' | 'P2', squareId: number): ValidationResult {
    const gosState = state as unknown as GameOfStrifeEngineState


    // Check if match is finished
    if (gosState.winner !== null || gosState.finishedAt !== undefined) {
      return { valid: false, reason: 'match_finished' }
    }

    // If GameOfStrife state is not available, treat as basic game
    if (!('currentPhase' in gosState)) {
      // This is likely a basic EngineState, so treat it as always valid for placement

      // Basic validation for non-GameOfStrife state
      if (squareId < 0 || squareId >= (state.board as any[]).length) {
        return { valid: false, reason: 'invalid_square' }
      }

      // For basic state, check if position is occupied
      if (state.board[squareId] !== null) {
        return { valid: false, reason: 'square_occupied' }
      }

      // Check turns for basic state
      if (state.currentTurn !== seat) {
        return { valid: false, reason: 'not_your_turn' }
      }

      return { valid: true }
    }

    // Check if we're in placement phase
    if (gosState.currentPhase !== 'placement') {
      return { valid: false, reason: 'match_finished' } // Using existing reason
    }

    // Convert squareId to row/col position
    const { row, col } = indexToPosition(squareId, gosState.boardSize)

    // Validate position bounds
    if (!isValidPosition(row, col, gosState.boardSize)) {
      return { valid: false, reason: 'invalid_square' }
    }

    // Check if square is already occupied
    const occupyingPlayer = gosState.board[row][col].player;
    const playerIndex = seat === 'P1' ? 0 : 1;

    if (occupyingPlayer !== null) {
      // Allow player to remove their own token
      if (occupyingPlayer === playerIndex) {
        // This is valid - player is removing their own token
        return { valid: true, isRemoval: true };
      }
      // Square occupied by opponent
      return { valid: false, reason: 'square_occupied' }
    }

    // Check if it's the player's turn (for turn-based placement)
    if (gosState.currentTurn !== seat) {
      return { valid: false, reason: 'not_your_turn' }
    }

    // Check if player has tokens remaining
    const tokensKey = playerIndex === 0 ? 'player0' : 'player1'
    if (gosState.playerTokens[tokensKey] <= 0) {
      return { valid: false, reason: 'invalid_square' } // No more tokens
    }

    return { valid: true }
  }

  applyClaim(state: EngineState, seat: 'P1' | 'P2', squareId: number, options?: { superpowerType?: number }): ClaimApplication {
    const gosState = state as unknown as GameOfStrifeEngineState
    const playerIndex = seat === 'P1' ? 0 : 1

    // Handle both GameOfStrife state and basic EngineState
    let newBoard: Cell[][]
    let boardSize: number

    if ('currentPhase' in gosState && gosState.board && Array.isArray(gosState.board[0])) {
      // This is a proper GameOfStrife state with 2D board
      boardSize = gosState.boardSize
      newBoard = gosState.board.map(row => row.map(cell => ({ ...cell })))
    } else {
      // This is a basic EngineState with flattened board, reconstruct 2D board
      // CRITICAL: Use boardSize from state, not from engine settings
      boardSize = (state as any).boardSize || this.settings.boardSize
      if (!(state as any).boardSize) {
        logger.warn('[GameOfStrifeEngine] State missing boardSize, using engine default', {
          engineBoardSize: this.settings.boardSize,
          stateBoardLength: state.board.length
        })
      }
      newBoard = createBoard(boardSize)

      // Populate from flattened board
      const flatBoard = state.board as (string | null)[]
      for (let i = 0; i < flatBoard.length; i++) {
        const { row, col } = indexToPosition(i, boardSize)
        if (flatBoard[i] !== null) {
          newBoard[row][col] = {
            player: flatBoard[i] === 'P1' ? 0 : 1,
            alive: true,
            superpowerType: 0,
            memory: 0
          }
        }
      }
    }

    const { row, col } = indexToPosition(squareId, boardSize)

    // Check if this is a removal (player clicking their own token)
    const isRemoval = newBoard[row][col].player === playerIndex;

    if (isRemoval) {
      // Remove the token - reset to empty cell
      newBoard[row][col] = {
        player: null,
        alive: false,
        superpowerType: 0,
        memory: 0
      };
    } else {
      // Place new token
      newBoard[row][col] = {
        player: playerIndex,
        alive: true, // Placed tokens start alive
        superpowerType: (options?.superpowerType || 0) as SuperpowerType, // Use provided superpower type or default to normal
        memory: 0
      };
    }

    // Handle token counting and phase management
    let nextTurn: 'P1' | 'P2' | null
    let newPlayerTokens: { player0: number; player1: number } | undefined
    let newTurnNetPlacements: number | undefined

    if ('currentPhase' in gosState && gosState.playerTokens) {
      // Update token count for GameOfStrife state
      newPlayerTokens = { ...gosState.playerTokens }
      const tokensKey = playerIndex === 0 ? 'player0' : 'player1'

      if (isRemoval) {
        // Restore token count when removing
        newPlayerTokens[tokensKey]++;
        // Decrement net placements (can go negative)
        newTurnNetPlacements = (gosState.turnNetPlacements || 0) - 1
        // Keep turn with same player when removing own token
        nextTurn = seat;
      } else {
        // Decrease token count when placing
        newPlayerTokens[tokensKey]--;

        // Check if placement phase should end
        const totalTokensRemaining = newPlayerTokens.player0 + newPlayerTokens.player1

        if (totalTokensRemaining === 0) {
          nextTurn = null // No more turns during simulation
          newTurnNetPlacements = 0 // Reset for simulation phase
        } else {
          // Track net placements this turn to allow free replacements
          const turnNetPlacements = (gosState.turnNetPlacements || 0) + 1

          // Only switch turn if player has made a net placement of at least 1 token
          if (turnNetPlacements >= 1) {
            const proposedNextTurn = seat === 'P1' ? 'P2' : 'P1'
            const nextPlayerTokensKey = proposedNextTurn === 'P1' ? 'player0' : 'player1'
            const currentPlayerTokensKey = seat === 'P1' ? 'player0' : 'player1'

            // Safety net: If next player has no tokens but current player does, keep turn
            if (newPlayerTokens[nextPlayerTokensKey] === 0 && newPlayerTokens[currentPlayerTokensKey] > 0) {
              nextTurn = seat // Keep turn with current player
              newTurnNetPlacements = 0 // Reset for continued placement
            } else {
              nextTurn = proposedNextTurn
              newTurnNetPlacements = 0 // Reset for next player's turn
            }
          } else {
            // Keep turn with same player (they're still replacing deleted tokens)
            nextTurn = seat
            newTurnNetPlacements = turnNetPlacements
          }
        }
      }
    } else {
      // For basic state, just switch turns
      nextTurn = seat === 'P1' ? 'P2' : 'P1'
    }

    // Create updated Game of Strife state
    const updatedGoSState: GameOfStrifeEngineState = {
      ...gosState,
      board: newBoard,
      version: state.version + 1,
      currentTurn: nextTurn,
      boardSize: boardSize
    }

    // Apply token counts and phase update if this is a proper GameOfStrife state
    if (newPlayerTokens) {
      updatedGoSState.playerTokens = newPlayerTokens

      // Update turn net placements tracker
      if (newTurnNetPlacements !== undefined) {
        updatedGoSState.turnNetPlacements = newTurnNetPlacements
      }

      // Update phase if all tokens placed
      const totalTokensRemaining = newPlayerTokens.player0 + newPlayerTokens.player1
      if (totalTokensRemaining === 0) {
        updatedGoSState.currentPhase = 'simulation'
      }
    }

    return {
      board: this.flattenBoard(newBoard), // Return flattened board for compatibility
      version: updatedGoSState.version,
      nextTurn,
      // Include full engine state for storage in match
      engineState: updatedGoSState,
      wasRemoval: isRemoval // Indicate if this was a token removal
    }
  }

  checkResult(state: EngineState): ResultCheck {
    const gosState = state as unknown as GameOfStrifeEngineState

    // For basic EngineState, always return active (no complex simulation)
    if (!('currentPhase' in gosState)) {
      return { status: 'active' }
    }

    // If we're still in placement phase, game is active
    if (gosState.currentPhase === 'placement') {
      return { status: 'active' }
    }

    // If we've transitioned to simulation phase, run Conway simulation and determine winner
    if (gosState.currentPhase === 'simulation') {
      const simulatedState = this.runConwaySimulation(gosState)
      const winnerResult = this.determineWinner(simulatedState)

      return {
        ...winnerResult,
        updatedState: simulatedState  // Include the simulated state for storage
      }
    }

    // If already finished, return existing result
    if (gosState.currentPhase === 'finished' || gosState.winner !== null) {
      return {
        status: 'finished',
        winner: gosState.winner || undefined,
        winningLine: gosState.winningLine || undefined
      }
    }

    return { status: 'active' }
  }

  // Conway's Game of Life simulation
  private runConwaySimulation(state: GameOfStrifeEngineState): GameOfStrifeEngineState {
    let currentBoard = state.board.map(row => row.map(cell => ({ ...cell })))
    let generation = 0
    const maxGenerations = this.settings.simulationGenerations || 100

    // Log initial state
    const initialCounts = {
      player0: countLivingCells(currentBoard, 0),
      player1: countLivingCells(currentBoard, 1)
    }
    logger.debug('Conway simulation start', { P0: initialCounts.player0, P1: initialCounts.player1 })

    // Run simulation until stable or max generations reached
    while (generation < maxGenerations) {
      const nextBoard = this.simulateOneGeneration(currentBoard)
      generation++

      // Check if board has stabilized (no changes)
      if (this.boardsEqual(currentBoard, nextBoard)) {
        logger.debug('Conway stable', { generation })
        break
      }

      currentBoard = nextBoard
    }

    // Calculate final scores
    const finalScores = {
      player0: countLivingCells(currentBoard, 0),
      player1: countLivingCells(currentBoard, 1)
    }

    logger.debug('Conway complete', { generation, P0: finalScores.player0, P1: finalScores.player1 })

    return {
      ...state,
      board: currentBoard,
      currentPhase: 'finished',
      generation,
      finalScores,
      finishedAt: new Date()
    }
  }

  private simulateOneGeneration(board: Cell[][]): Cell[][] {
    const size = board.length
    const newBoard = createBoard(size)

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cell = board[row][col]
        const neighbors = this.getNeighbors(board, row, col)
        const aliveNeighbors = neighbors.filter(n => n.alive).length

        // Apply Conway's rules with superpower modifications
        const shouldLive = this.shouldCellLive(cell, aliveNeighbors)
        const newOwner = this.determineNewOwner(cell, neighbors)

        newBoard[row][col] = {
          player: newOwner,
          alive: shouldLive,
          superpowerType: shouldLive ? cell.superpowerType : 0,
          memory: this.updateMemory(cell, shouldLive, aliveNeighbors)
        }
      }
    }

    return newBoard
  }

  private getNeighbors(board: Cell[][], row: number, col: number): Cell[] {
    const neighbors: Cell[] = []
    const size = board.length

    // Moore neighborhood (8 directions)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue // Skip self

        const newRow = row + dr
        const newCol = col + dc

        if (isValidPosition(newRow, newCol, size)) {
          neighbors.push(board[newRow][newCol])
        }
      }
    }

    return neighbors
  }

  private shouldCellLive(cell: Cell, aliveNeighbors: number): boolean {
    const { birthRules, survivalRules } = this.settings.conwayRules

    // Apply superpower-specific rules (copied from standalone superpowerUtils.ts)
    switch (cell.superpowerType) {
      case 1: // Tank - Extra durability, harder to kill
        if (cell.alive) {
          return survivalRules.includes(aliveNeighbors) || aliveNeighbors >= 1
        } else {
          return birthRules.includes(aliveNeighbors)
        }

      case 2: // Spreader - Enhanced reproduction abilities
        if (cell.alive) {
          return survivalRules.includes(aliveNeighbors)
        } else {
          // Can birth with fewer neighbors than normal
          return birthRules.includes(aliveNeighbors) || aliveNeighbors >= 2
        }

      case 3: // Survivor - Can survive harsh conditions
        if (cell.alive) {
          // Much better survival - can survive with any neighbors or in isolation
          return survivalRules.includes(aliveNeighbors) || aliveNeighbors <= 1 || aliveNeighbors >= 6
        } else {
          return birthRules.includes(aliveNeighbors)
        }

      case 4: // Ghost - Semi-transparent, special movement
        if (cell.alive) {
          let shouldLive = survivalRules.includes(aliveNeighbors)
          // Sometimes randomly dies (phases out)
          if (shouldLive && Math.random() < 0.05) {
            shouldLive = false
          }
          return shouldLive
        } else {
          let shouldLive = birthRules.includes(aliveNeighbors)
          // Sometimes randomly comes alive (phases in)
          if (!shouldLive && aliveNeighbors > 0 && Math.random() < 0.1) {
            shouldLive = true
          }
          return shouldLive
        }

      case 5: // Replicator - Fast multiplication
        if (cell.alive) {
          return survivalRules.includes(aliveNeighbors)
        } else {
          // Enhanced birth conditions
          return birthRules.includes(aliveNeighbors) || (aliveNeighbors >= 2 && Math.random() < 0.3)
        }

      case 6: // Destroyer - Can eliminate other cells
        if (cell.alive) {
          // Very robust survival
          return survivalRules.includes(aliveNeighbors) || aliveNeighbors >= 1
        } else {
          return birthRules.includes(aliveNeighbors)
        }

      case 7: // Hybrid - Combines multiple abilities
        if (cell.alive) {
          // Combines Tank + Survivor abilities
          return survivalRules.includes(aliveNeighbors) || aliveNeighbors >= 1 || aliveNeighbors <= 1
        } else {
          // Combines Spreader birth ability
          return birthRules.includes(aliveNeighbors) || aliveNeighbors >= 2
        }

      case 0: // Normal - Standard Conway's rules
      default:
        if (cell.alive) {
          return survivalRules.includes(aliveNeighbors)
        } else {
          return birthRules.includes(aliveNeighbors)
        }
    }
  }

  private determineNewOwner(cell: Cell, neighbors: Cell[]): number | null {
    const aliveNeighbors = neighbors.filter(n => n.alive)

    if (aliveNeighbors.length === 0) {
      return null // No living neighbors
    }

    // If cell was alive and stays alive, keep owner
    if (cell.alive && this.shouldCellLive(cell, aliveNeighbors.length)) {
      return cell.player
    }

    // For new births, inherit from dominant neighbor
    const playerCounts: Record<number, number> = { 0: 0, 1: 0 }
    aliveNeighbors.forEach(neighbor => {
      if (neighbor.player !== null) {
        playerCounts[neighbor.player]++
      }
    })

    // Return player with most neighbors, or null if tied
    if (playerCounts[0] > playerCounts[1]) return 0
    if (playerCounts[1] > playerCounts[0]) return 1
    return null // Tie or no ownership
  }

  private updateMemory(cell: Cell, willLive: boolean, aliveNeighbors: number): number {
    let memory = cell.memory

    if (cell.alive && !willLive) {
      // Cell is dying
      memory |= MemoryFlags.BATTLE_SCARRED
    }

    if (!cell.alive && willLive) {
      // Cell is being born
      memory |= MemoryFlags.HAS_CAUSED_BIRTH
    }

    if (cell.alive && willLive) {
      // Cell survived another generation
      memory |= MemoryFlags.IS_VETERAN

      // Special case: Ghost cell surviving when it should have died
      if (cell.superpowerType === 4) {
        const wouldNormallyDie = !(aliveNeighbors === 2 || aliveNeighbors === 3)
        if (wouldNormallyDie && !(memory & MemoryFlags.HAS_SURVIVED_DEATH)) {
          memory |= MemoryFlags.HAS_SURVIVED_DEATH
        }
      }
    }

    return memory
  }

  private boardsEqual(board1: Cell[][], board2: Cell[][]): boolean {
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

  private determineWinner(state: GameOfStrifeEngineState): ResultCheck {
    if (!state.finalScores) {
      return { status: 'active' }
    }

    const { player0, player1 } = state.finalScores

    if (player0 > player1) {
      return { status: 'finished', winner: 'P1' }
    } else if (player1 > player0) {
      return { status: 'finished', winner: 'P2' }
    } else {
      return { status: 'finished', winner: 'draw' }
    }
  }

  // Utility method to flatten 2D board for compatibility with base engine
  private flattenBoard(board: Cell[][]): (string | null)[] {
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

  // Getter for settings
  getSettings(): GameOfStrifeSettings {
    return { ...this.settings }
  }

  /**
   * Public method to simulate one generation (for server-driven animation)
   */
  public simulateGeneration(state: GameOfStrifeEngineState): GameOfStrifeEngineState {
    const nextBoard = this.simulateOneGeneration(state.board)
    const generation = (state.generation || 0) + 1

    // Check if board stabilized
    const stabilized = this.boardsEqual(state.board, nextBoard)

    return {
      ...state,
      board: nextBoard,
      generation,
      currentPhase: stabilized ? 'finished' : state.currentPhase
    }
  }

  /**
   * Calculate final scores from current board state
   */
  public calculateScores(board: Cell[][]): { player0: number; player1: number } {
    return {
      player0: countLivingCells(board, 0),
      player1: countLivingCells(board, 1)
    }
  }
}