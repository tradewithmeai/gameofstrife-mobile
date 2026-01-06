// Main Game of Strife component for React Native
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Portal, Modal, Chip } from 'react-native-paper';
import { GameOfStrifeBoard } from './GameBoard';
import { GameOfStrifeHUD } from './GameHUD';
import {
  GameStage,
  DEFAULT_GAME_CONFIG,
  getBoardFromFlat,
  createEmptyBoard,
  Cell,
  simulateOneGeneration,
  boardsEqual,
  countLivingCells,
  DEFAULT_CONWAY_RULES
} from '../utils/gameTypes';
import { useSocketStore } from '../stores/socketStore';
import { useSettingsStore } from '../stores/settingsStore';
import { devLog, summarize, uploadLogs, DEV_MODE } from '../utils/devMode';
import Constants from 'expo-constants';

interface GameOfStrifeProps {
  matchState: any;
  mySeat?: 'P1' | 'P2' | null;
  isMyTurn?: boolean;
  onAction: (position: number, superpowerType?: number) => void;
  onRematch: () => void;
  onReturnToLobby: () => void;
}

export const GameOfStrife: React.FC<GameOfStrifeProps> = ({
  matchState,
  mySeat,
  isMyTurn,
  onAction,
  onRematch,
  onReturnToLobby
}) => {
  // Calculate isFinished from match state
  const isFinished = Boolean(matchState?.winner);

  // Socket store for additional state
  const {
    currentWindowId,
    windowDeadline,
    pendingClaims,
    pendingSimulClaims,
    rematchPending,
    rematchRequesterSeat,
    isPracticeMode
  } = useSocketStore();

  // Simulation state
  const [simulationBoard, setSimulationBoard] = useState<Cell[][] | null>(null);
  const [simulationGeneration, setSimulationGeneration] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [finalScores, setFinalScores] = useState<{player0: number, player1: number} | null>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedSimulation = useRef(false);
  const placementBoardRef = useRef<Cell[][] | null>(null);

  // Pre-calculated generations storage (avoids re-renders)
  const generationsRef = useRef<Cell[][][]>([]);
  const [currentGenerationIndex, setCurrentGenerationIndex] = useState(0);

  // Convert match state to Game of Strife format
  const gameData = useMemo(() => {
    if (!matchState) {
      return {
        board: createEmptyBoard(DEFAULT_GAME_CONFIG.boardSize),
        stage: 'waiting' as GameStage,
        generation: 0,
        playerTokens: {
          player0: DEFAULT_GAME_CONFIG.tokensPerPlayer,
          player1: DEFAULT_GAME_CONFIG.tokensPerPlayer
        },
        boardSize: DEFAULT_GAME_CONFIG.boardSize,
        conwayRules: DEFAULT_CONWAY_RULES,
        settings: null
      };
    }

    // Extract Game of Strife metadata if available
    const metadata = (matchState as any).metadata || {};
    devLog('[GameOfStrife] Metadata summary:', summarize(metadata));

    // Determine board size with validation
    const expectedLength = metadata.boardSize ? metadata.boardSize * metadata.boardSize : matchState.board.length;
    if (matchState.board.length !== expectedLength) {
      console.error('[GameOfStrife] CRITICAL: Board length mismatch!', {
        metadataBoardSize: metadata.boardSize,
        flatBoardLength: matchState.board.length,
        expected: expectedLength
      });
    }

    const boardSize = metadata.boardSize || Math.sqrt(matchState.board.length);
    console.log('🎮 [GameOfStrife] Board reconstruction - size:', boardSize, 'flat length:', matchState.board.length);

    // Use fullBoard from metadata if available (preserves superpowerType and memory)
    // Otherwise fall back to converting from flat board
    const board = metadata.fullBoard || getBoardFromFlat(matchState.board, boardSize);
    console.log('🎮 [GameOfStrife] Board source:', !!metadata.fullBoard ? 'USING FULLBOARD (has superpowers)' : 'USING FLAT BOARD (NO superpowers!)');

    // Log all occupied cells in the reconstructed board
    console.log('🗺️ [GameOfStrife] BOARD STRUCTURE after reconstruction:');
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c].player !== null) {
          console.log(`  Cell [${r}][${c}]: Player=${board[r][c].player === 0 ? 'P1' : 'P2'}, alive=${board[r][c].alive}`);
        }
      }
    }

    // Debug: Log token positions
    const tokenPositions: Array<{pos: number, row: number, col: number, player: string}> = [];
    for (let i = 0; i < matchState.board.length; i++) {
      if (matchState.board[i] !== null) {
        const row = Math.floor(i / boardSize);
        const col = i % boardSize;
        tokenPositions.push({pos: i, row, col, player: matchState.board[i] as string});
      }
    }
    console.log('🎮 [GameOfStrife] Token positions on board:', tokenPositions);
    console.log('🎮 [GameOfStrife] Seat:', mySeat, '| BoardSize:', boardSize, '| Expected cells:', boardSize * boardSize);

    // Check if any cells have superpowers
    if (board && board.length > 0) {
      let superpowerCount = 0;
      for (let row of board) {
        for (let cell of row) {
          if (cell.superpowerType > 0) superpowerCount++;
        }
      }
      console.log('🎮 [GameOfStrife] Cells with superpowers on board:', superpowerCount);

      // Sample a few cells to debug
      if (superpowerCount > 0) {
        console.log('🎮 [GameOfStrife] Sample superpower cells:',
          board.flat().filter(c => c.superpowerType > 0).slice(0, 3).map(c => ({
            player: c.player,
            superpowerType: c.superpowerType,
            alive: c.alive
          }))
        );
      }
    }

    // Extract Conway rules from metadata (set by backend from game settings)
    const conwayRules = metadata.conwayRules || DEFAULT_CONWAY_RULES;
    console.log('[GameOfStrife] Using Conway rules:', conwayRules);

    // Extract game settings from metadata (for superpower configuration)
    const settings = metadata.settings || null;
    console.log('[GameOfStrife] Using game settings:', settings);

    // DEBUG: Log superpower manifests
    if (metadata.player0Superpowers || metadata.player1Superpowers) {
      const p0Count = metadata.player0Superpowers?.filter((s: number) => s > 0).length || 0;
      const p1Count = metadata.player1Superpowers?.filter((s: number) => s > 0).length || 0;
      console.log('🎮 SUPERPOWER MANIFESTS LOADED:', {
        P1_Superpowers: p0Count,
        P2_Superpowers: p1Count,
        P1_Manifest: metadata.player0Superpowers,
        P2_Manifest: metadata.player1Superpowers
      });
    } else {
      console.warn('⚠️ NO SUPERPOWER MANIFESTS IN METADATA!');
    }

    // Determine game stage - prefer metadata.stage if available
    let stage: GameStage = 'placement';
    if (metadata.stage) {
      // Use stage from backend metadata (most reliable)
      stage = metadata.stage;
      console.log('[GameOfStrife] Using stage from metadata:', stage);
    } else if (isFinished) {
      stage = 'finished';
      console.log('[GameOfStrife] Using stage from isFinished:', stage);
    } else if (matchState.currentTurn === null) {
      // When no current turn, likely in simulation phase
      stage = 'simulation';
      console.log('[GameOfStrife] Using stage from currentTurn=null:', stage);
    }

    // IMPORTANT: Save placement board BEFORE transitioning to simulation/finished
    // This must happen in useMemo so it runs synchronously before useEffect
    if (stage === 'placement' && board) {
      // Save a deep copy of the placement board
      placementBoardRef.current = board.map((row: Cell[]) => row.map((cell: Cell) => ({ ...cell })));
      console.log('[GameOfStrife] Saved placement board in useMemo');
    }

    return {
      board,
      stage,
      generation: metadata.generation || 0,
      playerTokens: metadata.playerTokens || {
        player0: DEFAULT_GAME_CONFIG.tokensPerPlayer,
        player1: DEFAULT_GAME_CONFIG.tokensPerPlayer
      },
      boardSize,
      conwayRules,
      settings
    };
  }, [matchState, isFinished]);

  // Run Conway's simulation when entering simulation phase
  useEffect(() => {
    console.log('[GameOfStrife] useEffect check:', {
      stage: gameData.stage,
      hasStarted: hasStartedSimulation.current,
      hasBoard: !!gameData.board,
      hasPlacementBoard: !!placementBoardRef.current,
      generation: gameData.generation
    });

    // Check if we should start simulation
    if ((gameData.stage === 'simulation' || gameData.stage === 'finished') && !hasStartedSimulation.current && placementBoardRef.current) {
      console.log('[GameOfStrife] Starting simulation animation from placement board!');
      hasStartedSimulation.current = true;
      setIsSimulating(true);

      // PRE-CALCULATE ALL GENERATIONS (fast, runs in <100ms even on large boards)
      console.log('[GameOfStrife] Pre-calculating all generations...');
      const startTime = Date.now();

      const generations: Cell[][][] = [];
      let currentBoard = placementBoardRef.current.map(row => row.map(cell => ({ ...cell })));
      generations.push(currentBoard); // Gen 0

      const maxGenerations = 100;

      // Calculate all generations upfront
      for (let i = 0; i < maxGenerations; i++) {
        const nextBoard = simulateOneGeneration(currentBoard, gameData.conwayRules);
        generations.push(nextBoard);

        // Stop early if board becomes stable
        if (boardsEqual(currentBoard, nextBoard)) {
          console.log(`[GameOfStrife] Board stabilized at generation ${i + 1}`);
          break;
        }

        currentBoard = nextBoard;
      }

      // Store in ref (doesn't trigger re-render)
      generationsRef.current = generations;

      const calcTime = Date.now() - startTime;
      console.log(`[GameOfStrife] Pre-calculated ${generations.length} generations in ${calcTime}ms`);

      // ANIMATE BY INCREMENTING INDEX ONLY (1 state variable = minimal re-renders)
      setCurrentGenerationIndex(0);
      let frameIndex = 0;

      const animateNextFrame = () => {
        frameIndex++;

        if (frameIndex < generationsRef.current.length) {
          // Only update index - board will be derived from generationsRef
          setCurrentGenerationIndex(frameIndex);

          // Continue animation at 60fps (16.67ms per frame)
          simulationTimerRef.current = setTimeout(animateNextFrame, 17);
        } else {
          // Animation complete
          const finalBoard = generationsRef.current[generationsRef.current.length - 1];
          const scores = {
            player0: countLivingCells(finalBoard, 0),
            player1: countLivingCells(finalBoard, 1)
          };
          console.log(`[GameOfStrife] Simulation complete! Final: P1=${scores.player0}, P2=${scores.player1}`);
          setFinalScores(scores);
          setIsSimulating(false);
          setSimulationComplete(true);
        }
      };

      // Start animation
      console.log(`[GameOfStrife] Starting 60fps animation (${generations.length} frames)...`);
      simulationTimerRef.current = setTimeout(animateNextFrame, 100);
    }

    // Cleanup on unmount
    return () => {
      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current);
      }
    };
  }, [gameData.stage]);

  // Reset simulation state when match changes
  useEffect(() => {
    if (matchState?.status === 'active' && matchState?.currentTurn !== null) {
      console.log('[GameOfStrife] Resetting simulation state for new match');
      hasStartedSimulation.current = false;
      placementBoardRef.current = null;
      setIsSimulating(false);
      setSimulationComplete(false);
      setSimulationBoard(null);
      setSimulationGeneration(0);
      setFinalScores(null);
    }
  }, [matchState?.id]);

  // Handle game actions from the board
  const handleGameAction = useCallback((action: any) => {
    console.log('[GameOfStrife] handleGameAction called:', action, 'matchState:', !!matchState, 'mySeat:', mySeat);
    if (!matchState || !mySeat) {
      console.log('[GameOfStrife] Action blocked - no matchState or mySeat');
      return;
    }

    switch (action.type) {
      case 'PLACE_TOKEN':
        // For Game of Strife, use pre-allocated superpower from manifest
        // Extract metadata from gameData (sent from backend)
        const metadata = (matchState as any)?.metadata || {};
        const placementCounts = metadata.placementCounts || { player0: 0, player1: 0 };

        // Determine which player's manifest to use based on seat
        const playerKey = mySeat === 'P1' ? 'player0' : 'player1';
        const playerManifest = mySeat === 'P1' ? metadata.player0Superpowers : metadata.player1Superpowers;
        const currentPlacementIndex = placementCounts[playerKey] || 0;

        // Look up superpower from manifest (default to 0 if manifest not available)
        let superpowerType = 0; // Normal cell by default
        if (playerManifest && currentPlacementIndex < playerManifest.length) {
          superpowerType = playerManifest[currentPlacementIndex];
        }

        console.log(`🎯 PLACING TOKEN #${currentPlacementIndex + 1} with SUPERPOWER TYPE ${superpowerType}`, {
          position: action.payload.position,
          seat: mySeat,
          manifestHas: playerManifest ? 'YES' : 'NO',
          manifestLength: playerManifest?.length || 0,
          fullManifest: playerManifest
        });

        // Convert to socket claim square action with superpowerType
        onAction(action.payload.position, superpowerType);
        break;

      default:
        // For other actions (tic-tac-toe), don't pass superpowerType
        if (action.payload?.squareId !== undefined) {
          onAction(action.payload.squareId);
        } else if (action.payload?.position !== undefined) {
          onAction(action.payload.position);
        }
    }
  }, [matchState, mySeat, onAction, gameData]);

  // Handle rematch
  const handleRematch = useCallback(() => {
    onRematch();
  }, [onRematch]);

  // Handle return to lobby
  const handleReturnToLobby = useCallback(() => {
    // Clear simulation state to hide modal
    setSimulationComplete(false);
    setFinalScores(null);
    setSimulationBoard(null);
    setIsSimulating(false);
    setSimulationGeneration(0);
    hasStartedSimulation.current = false;

    // Clear any running timers
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    // Navigate back to lobby
    onReturnToLobby();
  }, [onReturnToLobby]);

  // Handle log upload
  const handleUploadLogs = useCallback(async () => {
    if (!DEV_MODE) {
      console.log('[GameOfStrife] Log upload only available in DEV mode');
      return;
    }

    const wsUrl = Constants.expoConfig?.extra?.wsUrl || 'https://gameofstrife-mobile-production.up.railway.app';
    const serverUrl = wsUrl.replace(/^wss?:\/\//, 'https://');

    console.log('[GameOfStrife] Uploading logs to:', serverUrl);
    const result = await uploadLogs(serverUrl, matchState?.id);

    if (result) {
      // Add to settings store
      useSettingsStore.getState().addLogSession({
        sessionId: result.sessionId,
        timestamp: new Date().toISOString(),
        expiresAt: result.expiresAt,
        matchId: matchState?.id || 'unknown'
      });
      console.log(`📤 Logs uploaded. Session ID: ${result.sessionId}`);
      alert(`Logs uploaded!\nSession ID: ${result.sessionId}`);
    } else {
      console.error('[GameOfStrife] Upload failed');
      alert('Log upload failed - check console for details');
    }
  }, [matchState]);

  if (!matchState) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge" style={styles.textGray}>No active match</Text>
      </View>
    );
  }

  const isPlacementStage = gameData.stage === 'placement';

  // Use simulation board when simulating, otherwise use game board
  // Derive board from ref + index (avoids re-rendering entire board structure)
  const displayBoard = generationsRef.current[currentGenerationIndex] || simulationBoard || gameData.board;
  const displayGeneration = isSimulating ? currentGenerationIndex : gameData.generation;

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        {/* Game HUD */}
        <GameOfStrifeHUD
          board={displayBoard}
          stage={gameData.stage}
          generation={displayGeneration}
          playerTokens={gameData.playerTokens}
          matchState={matchState}
          mySeat={mySeat}
          isMyTurn={isMyTurn}
          isFinished={isFinished}
          currentWindowId={currentWindowId || undefined}
          windowDeadline={windowDeadline || undefined}
          showDebugInfo={false}
          conwayRules={gameData.conwayRules}
          settings={gameData.settings}
        />

        {/* Practice Mode Indicator */}
        {isPracticeMode && (
          <Chip icon="account" style={styles.practiceChip} textStyle={styles.practiceChipText}>
            Practice Mode
          </Chip>
        )}

        {/* Game Board */}
        <GameOfStrifeBoard
          board={displayBoard}
          stage={gameData.stage}
          boardSize={gameData.boardSize}
          isPlacementStage={isPlacementStage}
          isMyTurn={isMyTurn || false}
          isFinished={isFinished}
          onGameAction={handleGameAction}
          mySeat={mySeat}
        />

        {/* Additional Game Info */}
        {isSimulating && (
          <Card style={styles.simulatingCard}>
            <Card.Content style={styles.centerContent}>
              <Text variant="titleMedium" style={styles.textPurple}>
                🧬 Conway's Game of Life simulation in progress...
              </Text>
              <Text variant="bodySmall" style={styles.textPurpleLight}>
                Generation {simulationGeneration}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Dev Mode - Upload Logs Button */}
        {/* Temporarily disabled for screenshots
        {DEV_MODE && (
          <Button
            mode="outlined"
            onPress={handleUploadLogs}
            style={styles.uploadButton}
            compact
          >
            📤 Upload Logs
          </Button>
        )}
        */}

        {/* Conway's Game of Life Rules Info */}
        {gameData.stage === 'placement' && (
          <Card style={styles.rulesCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.textWhite}>Conway's Game of Life Rules:</Text>
              <Text variant="bodySmall" style={styles.textGray}>
                • Live cells with {gameData.conwayRules.survivalRules.join(', ')} neighbor{gameData.conwayRules.survivalRules.length > 1 ? 's' : ''} survive
              </Text>
              <Text variant="bodySmall" style={styles.textGray}>
                • Dead cells with {gameData.conwayRules.birthRules.join(', ')} neighbor{gameData.conwayRules.birthRules.length > 1 ? 's' : ''} become alive
              </Text>
              <Text variant="bodySmall" style={styles.textGray}>
                • All other cells die or stay dead
              </Text>
              <Text variant="bodySmall" style={[styles.textYellow, styles.marginTop]}>
                Place your tokens strategically!
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Pending Claims Indicator */}
        {(pendingClaims.size > 0 || pendingSimulClaims.size > 0) && (
          <Card style={styles.pendingCard}>
            <Card.Content>
              <Text variant="bodySmall" style={styles.textYellow}>
                ⏳ Processing token placement...
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Simulation Results Card - positioned at bottom to not cover board */}
        {simulationComplete && !!finalScores && (isPracticeMode || !!matchState?.winner) && (
          <Card style={styles.resultsCard}>
            <Card.Content>
              <Text variant="displaySmall" style={styles.centerText}>
                {isPracticeMode ? '🧬' : '🏆'}
              </Text>
              <Text variant="headlineMedium" style={[styles.textWhite, styles.centerText, styles.marginBottom]}>
                Simulation Complete!
              </Text>

              {isPracticeMode ? (
                // PRACTICE MODE: Show only P1 cell count
                <View style={styles.scoresContainer}>
                  <Text variant="titleLarge" style={[styles.textBlue, styles.centerText]}>
                    Final Cells: {finalScores.player0}
                  </Text>
                </View>
              ) : (
                // MULTIPLAYER: Show winner and both scores
                <>
                  <Text variant="titleLarge" style={[styles.centerText, styles.marginBottom]}>
                    {matchState?.winner === 'draw' ? (
                      <Text style={styles.textYellow}>It's a Draw!</Text>
                    ) : matchState?.winner === mySeat ? (
                      <Text style={styles.textGreen}>You Win!</Text>
                    ) : (
                      <Text style={styles.textRed}>You Lose</Text>
                    )}
                  </Text>

                  {finalScores && (
                    <View style={styles.scoresContainer}>
                      <View style={styles.scoreRow}>
                        <Text variant="titleSmall" style={styles.textBlue}>Player 1 (Blue):</Text>
                        <Text variant="titleSmall" style={styles.textWhite}>{finalScores.player0} cells</Text>
                      </View>
                      <View style={styles.scoreRow}>
                        <Text variant="titleSmall" style={styles.textGreen}>Player 2 (Green):</Text>
                        <Text variant="titleSmall" style={styles.textWhite}>{finalScores.player1} cells</Text>
                      </View>
                    </View>
                  )}
                </>
              )}

              <Text variant="bodySmall" style={[styles.textGray, styles.centerText, styles.marginBottom]}>
                Simulation ran for {simulationGeneration} generations
              </Text>

              {/* Rematch Status Indicator */}
              {rematchPending && rematchRequesterSeat && (
                <View style={styles.marginBottom}>
                  {rematchRequesterSeat === mySeat ? (
                    <Text variant="bodySmall" style={[styles.textBlue, styles.centerText]}>
                      ⏳ Waiting for opponent to accept rematch...
                    </Text>
                  ) : (
                    <Text variant="bodySmall" style={[styles.textGreen, styles.centerText]}>
                      🎮 Opponent wants a rematch! Click Play Again to accept
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={handleReturnToLobby}
                  style={styles.flexButton}
                >
                  Return to Lobby
                </Button>

                <Button mode="contained" onPress={handleRematch} style={styles.flexButton}>
                  Play Again
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  centerContent: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  simulatingCard: {
    backgroundColor: '#581C87',
  },
  rulesCard: {
    backgroundColor: '#1F2937',
  },
  pendingCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FBBF24',
    borderWidth: 1,
  },
  modal: {
    backgroundColor: '#1F2937',
    padding: 24,
    margin: 20,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#7C3AED',
  },
  scoresContainer: {
    marginBottom: 16,
    gap: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rematchCard: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  uploadButton: {
    borderColor: '#3B82F6',
    marginVertical: 8,
  },
  resultsCard: {
    backgroundColor: '#1F2937',
    borderColor: '#7C3AED',
    borderWidth: 3,
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  flexButton: {
    flex: 1,
  },
  lobbyButton: {
    borderColor: '#6B7280',
    marginBottom: 12,
  },
  rematchButton: {
    backgroundColor: '#7C3AED',
  },
  marginTop: {
    marginTop: 8,
  },
  marginBottom: {
    marginBottom: 16,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textGray: {
    color: '#9CA3AF',
  },
  textBlue: {
    color: '#3B82F6',
  },
  textGreen: {
    color: '#10B981',
  },
  textYellow: {
    color: '#FBBF24',
  },
  textRed: {
    color: '#EF4444',
  },
  textPurple: {
    color: '#C4B5FD',
  },
  textPurpleLight: {
    color: '#DDD6FE',
  },
  practiceChip: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#3B82F6',
  },
  practiceChipText: {
    color: '#FFFFFF',
  },
});
