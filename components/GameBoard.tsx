// Game of Strife GameBoard for React Native
import React, { useCallback, useState, useRef } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions, GestureResponderEvent, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cell, MEMORY_FLAGS, GameStage } from '../utils/gameTypes';
import { devLog } from '../utils/devMode';

interface GameOfStrifeBoardProps {
  board: Cell[][];
  stage: GameStage;
  boardSize: number;
  isPlacementStage: boolean;
  isMyTurn: boolean;
  isFinished: boolean;
  onGameAction: (action: any) => void;
  selectedCell?: { row: number; col: number } | null;
  mySeat?: 'P1' | 'P2' | null;
}

export const GameOfStrifeBoard: React.FC<GameOfStrifeBoardProps> = ({
  board,
  stage,
  boardSize,
  isPlacementStage,
  isMyTurn,
  isFinished,
  onGameAction,
  selectedCell,
  mySeat,
}) => {
  const boardRef = useRef<View>(null);
  const lastPlacedCell = useRef<string | null>(null);

  // Component uses per-cell Pressable approach for touch handling

  // Handle token placement during drag
  const handlePlacement = useCallback((row: number, col: number) => {
    console.log('[GameBoard] handlePlacement called:', { row, col, isPlacementStage, isMyTurn, isFinished });

    if (!isPlacementStage || !isMyTurn || isFinished) {
      console.log('[GameBoard] Placement blocked by stage/turn/finish check');
      return;
    }

    const cellKey = `${row}-${col}`;
    // Avoid placing multiple tokens on the same cell during one drag
    if (lastPlacedCell.current === cellKey) {
      devLog('[GameBoard] Same cell as last placement, skipping');
      return;
    }

    // Check if cell is occupied
    const cell = board[row]?.[col];
    const cellOccupied = cell && cell.player !== null;
    const myPlayerIndex = mySeat === 'P1' ? 0 : 1;
    const isMyToken = cellOccupied && cell.player === myPlayerIndex;

    devLog('[GameBoard] Cell check:', {
      cellOccupied,
      player: cell?.player,
      myPlayerIndex,
      isMyToken
    });

    // If clicking own token, remove it (backend handles this automatically)
    if (isMyToken) {
      devLog('[GameBoard] Removing own token at position:', row * boardSize + col);
      onGameAction({
        type: 'PLACE_TOKEN',  // Use PLACE_TOKEN - backend detects removal automatically
        payload: { position: row * boardSize + col, row, col },
        timestamp: Date.now()
      });
      lastPlacedCell.current = cellKey;
      return;
    }

    // If cell occupied by opponent, skip
    if (cellOccupied) {
      console.log('[GameBoard] Cell occupied by opponent, skipping');
      return;
    }

    lastPlacedCell.current = cellKey;

    // Convert to flat board position for socket system
    const position = row * boardSize + col;

    console.log(`🔵 [GameBoard] SENDING TO SERVER: row=${row}, col=${col}, boardSize=${boardSize}, position=${position} (calculation: ${row}*${boardSize}+${col}=${position})`);
    onGameAction({
      type: 'PLACE_TOKEN',
      payload: { position, row, col },
      timestamp: Date.now()
    });
  }, [isPlacementStage, isMyTurn, isFinished, board, boardSize, onGameAction, mySeat]);

  // Handle cell press - called directly by each cell's Pressable
  const handleCellPress = useCallback((row: number, col: number) => {
    console.log('[GameBoard] Cell pressed:', { row, col });
    lastPlacedCell.current = null; // Reset for new placement
    handlePlacement(row, col);
  }, [handlePlacement]);

  const getSuperpowerStyle = (superpowerType: number) => {
    switch (superpowerType) {
      case 1: // Tank
        return styles.superpowerTank;
      case 2: // Spreader
        return styles.superpowerSpreader;
      case 3: // Survivor
        return styles.superpowerSurvivor;
      case 4: // Ghost
        return styles.superpowerGhost;
      case 5: // Replicator
        return styles.superpowerReplicator;
      case 6: // Destroyer
        return styles.superpowerDestroyer;
      case 7: // Hybrid
        return styles.superpowerHybrid;
      default:
        return null;
    }
  };

  const getCellStyle = (cell: Cell) => {
    const cellStyles: any[] = [styles.cell];

    // Base color for player
    if (cell.alive && cell.player === 0) {
      cellStyles.push(styles.cellP1); // Blue for P1
    } else if (cell.alive && cell.player === 1) {
      cellStyles.push(styles.cellP2); // Green for P2
    } else {
      cellStyles.push(styles.cellEmpty); // Dark gray for empty
    }

    // Superpower visual effect
    if (cell.alive && cell.superpowerType > 0) {
      const superpowerStyle = getSuperpowerStyle(cell.superpowerType);
      if (superpowerStyle) {
        cellStyles.push(superpowerStyle);
      }
    }

    // Memory effects
    if (cell.memory & MEMORY_FLAGS.IS_VETERAN) {
      cellStyles.push(styles.cellVeteran);
    }

    return cellStyles;
  };


  // Calculate board dimensions - responsive for phones, tablets, and Chromebooks
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Detect device type based on screen dimensions
  const isTablet = React.useMemo(() => {
    const smallerDimension = Math.min(width, height);
    return smallerDimension >= 600; // 600dp is standard tablet breakpoint
  }, [width, height]);

  const boardDimension = React.useMemo(() => {
    // Use the smaller dimension to handle landscape/portrait
    const smallerDimension = Math.min(width, height);

    // Account for safe area insets
    const availableWidth = width - insets.left - insets.right - 32; // 32px padding
    const availableHeight = height - insets.top - insets.bottom - 100; // 100px for HUD/cards
    const availableSpace = Math.min(availableWidth, availableHeight);

    // Different scaling for tablets/Chromebooks vs phones
    if (isTablet) {
      // Tablets/Chromebooks: use more of the screen, higher max size
      return Math.min(availableSpace * 0.85, 700);
    } else {
      // Phones: tighter fit, lower max size
      return Math.min(availableSpace * 0.9, 450);
    }
  }, [width, height, insets, isTablet]);

  // Calculate cell size and actual board dimensions
  const boardBorderWidth = 2;
  const cellBorderWidth = 0.5; // Each cell has 0.5px border on all sides

  // Calculate cell size from max available dimension
  // Account for borders: each cell adds (cellSize + 2*borderWidth) to total width
  // Total row width = boardSize * (cellSize + 2*borderWidth) must fit in maxAvailableSpace
  const maxAvailableSpace = boardDimension - (boardBorderWidth * 2);

  // Calculate cell size to exactly fill the board
  // In React Native, width includes borders (border-box model)
  // We need: cellSize * boardSize = maxAvailableSpace (as close as possible)
  const exactCellSize = maxAvailableSpace / boardSize;
  const cellSize = Math.floor(exactCellSize);

  // Calculate how many pixels we're short
  const totalCellsWidth = cellSize * boardSize;
  const remainingPixels = maxAvailableSpace - totalCellsWidth;

  // If we have significant remaining space (0.5px or more per cell on average),
  // we can make cells 1px bigger to fill the gap
  const shouldIncrementCellSize = remainingPixels >= boardSize * 0.5;
  const finalCellSize = shouldIncrementCellSize ? cellSize + 1 : cellSize;

  // Calculate actual space used
  const actualCellsWidth = finalCellSize * boardSize;
  const actualBoardWidth = actualCellsWidth + (boardBorderWidth * 2);

  return (
    <View style={styles.container}>
      <View
        ref={boardRef}
        style={[
          styles.board,
          {
            width: actualBoardWidth,
            height: actualBoardWidth,
          }
        ]}
      >
        {board.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell, colIndex) => {
              const cellStyle = [
                ...getCellStyle(cell),
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex && styles.cellSelected,
                { width: finalCellSize, height: finalCellSize }
              ];

              // During simulation/finished: use plain View (no touch overhead)
              // During placement: use Pressable (touchable)
              if (stage === 'simulation' || stage === 'finished') {
                return (
                  <View
                    key={`${rowIndex}-${colIndex}`}
                    style={cellStyle}
                  >
                    {cell.alive && cell.lives > 0 && (
                      <Text style={styles.livesText}>{cell.lives}</Text>
                    )}
                  </View>
                );
              }

              return (
                <Pressable
                  key={`${rowIndex}-${colIndex}`}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                  disabled={!isPlacementStage || !isMyTurn}
                  style={cellStyle}
                >
                  {cell.alive && cell.lives > 0 && (
                    <Text style={styles.livesText}>{cell.lives}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingVertical: 16,
  },
  board: {
    flexDirection: 'column',
    borderWidth: 2,
    borderColor: '#6B7280',
    backgroundColor: '#1F2937',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#4B5563',
  },
  cellEmpty: {
    backgroundColor: '#1F2937',
  },
  cellP1: {
    backgroundColor: '#3B82F6', // Blue
  },
  cellP2: {
    backgroundColor: '#10B981', // Green
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: '#FBBF24', // Yellow ring
  },
  cellVeteran: {
    opacity: 0.9,
  },
  // Superpower visual effects - Distinctive borders and patterns
  superpowerTank: {
    borderWidth: 3,
    borderColor: '#FFFFFF', // Thick white border (defensive)
    borderStyle: 'solid',
  },
  superpowerSpreader: {
    borderWidth: 2.5,
    borderColor: '#06B6D4', // Cyan dotted border (spreading)
    borderStyle: 'dotted',
  },
  superpowerSurvivor: {
    borderWidth: 3,
    borderColor: '#FBBF24', // Bright yellow border (glowing)
    borderStyle: 'solid',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4, // Android shadow
  },
  superpowerGhost: {
    opacity: 0.7, // Semi-transparent (ethereal)
    borderWidth: 2,
    borderColor: '#C084FC', // Purple border
    borderStyle: 'dashed',
  },
  superpowerReplicator: {
    borderWidth: 2.5,
    borderColor: '#F97316', // Orange dashed border (duplication pattern)
    borderStyle: 'dashed',
  },
  superpowerDestroyer: {
    borderWidth: 3.5,
    borderColor: '#EF4444', // Thick red border (aggressive)
    borderStyle: 'solid',
  },
  superpowerHybrid: {
    borderWidth: 3,
    borderColor: '#A855F7', // Purple border with glow
    borderStyle: 'solid',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  livesText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    lineHeight: 20,
  },
});
