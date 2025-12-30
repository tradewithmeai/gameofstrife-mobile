// Game of Strife HUD component for React Native
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { GameStage, countLivingCells, Cell } from '../utils/gameTypes';

interface GameOfStrifeHUDProps {
  board: Cell[][];
  stage: GameStage;
  generation: number;
  playerTokens: {
    player0: number;
    player1: number;
  };
  mySeat?: 'P1' | 'P2' | null;
  isMyTurn?: boolean;
  isFinished?: boolean;
  matchState?: any;
  currentWindowId?: number;
  windowDeadline?: number;
  conwayRules?: {
    birthRules: number[];
    survivalRules: number[];
  };
  settings?: any;
  showDebugInfo?: boolean;
}

export const GameOfStrifeHUD: React.FC<GameOfStrifeHUDProps> = ({
  board,
  stage,
  generation,
  playerTokens,
  mySeat,
  isMyTurn,
  isFinished,
  matchState,
  currentWindowId,
  windowDeadline,
  showDebugInfo = false,
  conwayRules,
  settings
}) => {
  const myPlayerIndex = mySeat === 'P1' ? 0 : 1;
  const opponentPlayerIndex = mySeat === 'P1' ? 1 : 0;

  const myTokens = mySeat === 'P1' ? playerTokens.player0 : playerTokens.player1;
  const opponentTokens = mySeat === 'P1' ? playerTokens.player1 : playerTokens.player0;

  const myLivingCells = countLivingCells(board, myPlayerIndex);
  const opponentLivingCells = countLivingCells(board, opponentPlayerIndex);
  const totalLivingCells = countLivingCells(board);

  const getStageDisplay = () => {
    switch (stage) {
      case 'placement':
        return 'Token Placement';
      case 'simulation':
        return 'Conway Simulation';
      case 'paused':
        return 'Paused';
      case 'finished':
        return 'Game Complete';
      case 'waiting':
        return 'Waiting for Players';
      default:
        return stage;
    }
  };

  const getPlayerColor = (seat: 'P1' | 'P2') => {
    return seat === 'P1' ? '#3B82F6' : '#10B981'; // Blue for P1, Green for P2
  };

  const getTurnStatus = () => {
    if (isFinished) {
      if (matchState?.winner === 'draw') {
        return <Text variant="headlineSmall" style={styles.textYellow}>Draw</Text>;
      } else if (matchState?.winner) {
        return (
          <Text variant="headlineSmall" style={styles.textGreen}>
            {matchState.winner === mySeat ? 'You Win!' : 'You Lose'}
          </Text>
        );
      } else {
        return <Text variant="headlineSmall" style={styles.textGray}>Game Over</Text>;
      }
    }

    if (stage === 'simulation') {
      return (
        <Text variant="titleLarge" style={styles.textPurple}>
          Simulation Running...
        </Text>
      );
    }

    if (stage === 'placement') {
      return (
        <Text variant="titleLarge">
          {isMyTurn ? (
            <Text style={styles.textGreen}>Your Turn</Text>
          ) : (
            <Text style={styles.textOrange}>Opponent's Turn</Text>
          )}
        </Text>
      );
    }

    return <Text variant="titleMedium" style={styles.textGray}>{getStageDisplay()}</Text>;
  };

  return (
    <View style={styles.container}>
      {/* Game Status */}
      <Card style={styles.card}>
        <Card.Content style={styles.centerContent}>
          {getTurnStatus()}
          {stage === 'placement' && (
            <Text variant="bodySmall" style={[styles.textGray, styles.marginTop]}>
              Stage: {getStageDisplay()}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Player Information */}
      <View style={styles.playerGrid}>
        {/* My Stats */}
        <Card style={[styles.playerCard, { backgroundColor: mySeat === 'P1' ? '#1E3A8A' : '#065F46' }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: getPlayerColor(mySeat!) }}>
              ● You ({mySeat})
            </Text>
            <Text variant="bodySmall" style={styles.textLight}>Tokens: {myTokens}</Text>
            <Text variant="bodySmall" style={styles.textLight}>Living: {myLivingCells}</Text>
          </Card.Content>
        </Card>

        {/* Opponent Stats */}
        <Card style={[styles.playerCard, { backgroundColor: mySeat === 'P1' ? '#065F46' : '#1E3A8A' }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: getPlayerColor(mySeat === 'P1' ? 'P2' : 'P1') }}>
              ● Opponent ({mySeat === 'P1' ? 'P2' : 'P1'})
            </Text>
            <Text variant="bodySmall" style={styles.textLight}>Tokens: {opponentTokens}</Text>
            <Text variant="bodySmall" style={styles.textLight}>Living: {opponentLivingCells}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Game Settings Display */}
      {settings && (
        <Card style={[styles.card, styles.settingsCard]}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.textLight}>Game Settings</Text>
            <View style={styles.settingsGrid}>
              <Text variant="bodySmall" style={styles.textGray}>Board: {settings.boardSize}x{settings.boardSize}</Text>
              <Text variant="bodySmall" style={styles.textGray}>Tokens: {settings.tokensPerPlayer} each</Text>
              {conwayRules && (
                <>
                  <Text variant="bodySmall" style={styles.textGray}>Birth: {conwayRules.birthRules.join(', ')}</Text>
                  <Text variant="bodySmall" style={styles.textGray}>Survival: {conwayRules.survivalRules.join(', ')}</Text>
                </>
              )}
              <Text variant="bodySmall" style={styles.textGray}>Superpowers: {settings.superpowerPercentage}%</Text>
              <Text variant="bodySmall" style={styles.textGray}>Types: {settings.enabledSuperpowers?.length || 0} enabled</Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Conway Simulation Stats */}
      {(stage === 'simulation' || stage === 'finished') && (
        <Card style={[styles.card, styles.simulationCard]}>
          <Card.Content style={styles.centerContent}>
            <Text variant="titleMedium" style={styles.textPurpleLight}>Conway's Game of Life</Text>
            <Text variant="bodySmall" style={styles.textLight}>Generation: {generation}</Text>
            <Text variant="bodySmall" style={styles.textLight}>Total Living Cells: {totalLivingCells}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Simultaneous Mode Info */}
      {matchState?.mode === 'simul' && !isFinished && (
        <Card style={[styles.card, styles.simulCard]}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.textPurple}>
              🔀 Simultaneous mode - Both players can place tokens
            </Text>
            {currentWindowId && (
              <Text variant="bodySmall" style={styles.textPurple}>
                Window #{currentWindowId}
                {windowDeadline && (
                  <Text> {Math.max(0, Math.ceil((windowDeadline - Date.now()) / 1000))}s</Text>
                )}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Game Instructions */}
      {stage === 'placement' && !isFinished && (
        <Card style={[styles.card, styles.instructionsCard]}>
          <Card.Content style={styles.centerContent}>
            {isMyTurn ? (
              <Text variant="bodySmall" style={styles.textGray}>
                Tap or drag to place your tokens on the board.{'\n'}
                {myTokens > 0 ? `${myTokens} tokens remaining` : 'All tokens placed!'}
              </Text>
            ) : (
              <Text variant="bodySmall" style={styles.textGray}>
                Waiting for opponent to place tokens...
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {stage === 'simulation' && (
        <Card style={[styles.card, styles.instructionsCard]}>
          <Card.Content style={styles.centerContent}>
            <Text variant="bodySmall" style={styles.textGray}>
              Conway's Game of Life simulation is running.{'\n'}
              Cells evolve based on their neighbors!
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Debug Info */}
      {showDebugInfo && matchState && (
        <Card style={[styles.card, styles.debugCard]}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.debugText}>Seat: {mySeat}</Text>
            <Text variant="bodySmall" style={styles.debugText}>Turn: {matchState.currentTurn}</Text>
            <Text variant="bodySmall" style={styles.debugText}>Version: {matchState.version}</Text>
            <Text variant="bodySmall" style={styles.debugText}>Stage: {stage}</Text>
            <Text variant="bodySmall" style={styles.debugText}>Generation: {generation}</Text>
            <Text variant="bodySmall" style={styles.debugText}>Finished: {isFinished ? 'true' : 'false'}</Text>
            <Text variant="bodySmall" style={styles.debugText}>Match: {matchState.id?.split('_').pop()}</Text>
            <Text variant="bodySmall" style={styles.debugText}>Board Size: {board.length}x{board[0]?.length || 0}</Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#1F2937',
  },
  centerContent: {
    alignItems: 'center',
  },
  playerGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  playerCard: {
    flex: 1,
  },
  settingsCard: {
    backgroundColor: '#374151',
  },
  settingsGrid: {
    marginTop: 8,
    gap: 4,
  },
  simulationCard: {
    backgroundColor: '#581C87',
  },
  simulCard: {
    backgroundColor: '#DDD6FE',
    borderColor: '#A78BFA',
    borderWidth: 1,
  },
  instructionsCard: {
    backgroundColor: '#374151',
  },
  debugCard: {
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
  },
  textLight: {
    color: '#D1D5DB',
  },
  textGray: {
    color: '#9CA3AF',
  },
  textGreen: {
    color: '#10B981',
  },
  textYellow: {
    color: '#FBBF24',
  },
  textOrange: {
    color: '#F59E0B',
  },
  textPurple: {
    color: '#7C3AED',
  },
  textPurpleLight: {
    color: '#C4B5FD',
  },
  debugText: {
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  marginTop: {
    marginTop: 4,
  },
});
