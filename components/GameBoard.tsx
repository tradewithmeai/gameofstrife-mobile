// Game of Strife GameBoard for React Native
import React, { useCallback, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, GestureResponderEvent } from 'react-native';
import { Cell, MEMORY_FLAGS, GameStage } from '../utils/gameTypes';

interface GameOfStrifeBoardProps {
  board: Cell[][];
  stage: GameStage;
  boardSize: number;
  isPlacementStage: boolean;
  isMyTurn: boolean;
  isFinished: boolean;
  onGameAction: (action: any) => void;
  selectedCell?: { row: number; col: number } | null;
}

export const GameOfStrifeBoard: React.FC<GameOfStrifeBoardProps> = ({
  board,
  boardSize,
  isPlacementStage,
  isMyTurn,
  isFinished,
  onGameAction,
  selectedCell,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const boardRef = useRef<View>(null);
  const lastPlacedCell = useRef<string | null>(null);
  const boardLayout = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Get cell coordinates from touch position with expanded hit areas
  const getCellFromPosition = useCallback((pageX: number, pageY: number): { row: number; col: number } | null => {
    if (!boardLayout.current) return null;

    const { x, y, width, height } = boardLayout.current;
    const relativeX = pageX - x;
    const relativeY = pageY - y;

    // Calculate cell size
    const cellSize = Math.min(width, height) / boardSize;

    // Add tolerance for easier targeting (expand hit area by 25%)
    const tolerance = cellSize * 0.125;

    const col = Math.floor((relativeX + tolerance) / cellSize);
    const row = Math.floor((relativeY + tolerance) / cellSize);

    // Check bounds with tolerance
    if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
      // Additional check: ensure we're not too far from the actual cell center
      const cellCenterX = (col + 0.5) * cellSize;
      const cellCenterY = (row + 0.5) * cellSize;
      const distanceX = Math.abs(relativeX - cellCenterX);
      const distanceY = Math.abs(relativeY - cellCenterY);

      // Allow placement if within expanded area (cellSize/2 + tolerance)
      if (distanceX <= cellSize * 0.75 && distanceY <= cellSize * 0.75) {
        return { row, col };
      }
    }

    return null;
  }, [boardSize]);

  // Handle token placement during drag
  const handlePlacement = useCallback((row: number, col: number) => {
    if (!isPlacementStage || !isMyTurn || isFinished) return;

    const cellKey = `${row}-${col}`;
    // Avoid placing multiple tokens on the same cell during one drag
    if (lastPlacedCell.current === cellKey) return;

    // Check if cell is already occupied
    if (board[row] && board[row][col] && board[row][col].player !== null) return;

    lastPlacedCell.current = cellKey;

    // Convert to flat board position for socket system
    const position = row * boardSize + col;

    onGameAction({
      type: 'PLACE_TOKEN',
      payload: { position, row, col },
      timestamp: Date.now()
    });
  }, [isPlacementStage, isMyTurn, isFinished, board, boardSize, onGameAction]);

  // Measure board layout on mount and when it changes
  const handleLayout = useCallback(() => {
    boardRef.current?.measure((x, y, width, height, pageX, pageY) => {
      boardLayout.current = { x: pageX, y: pageY, width, height };
    });
  }, []);

  // Touch event handler
  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    console.log('[GameBoard] Touch start:', { isPlacementStage, isMyTurn, isFinished });
    if (!isPlacementStage || !isMyTurn) return;

    // Ensure board is measured (backup in case onLayout didn't fire)
    if (!boardLayout.current) {
      boardRef.current?.measure((x, y, width, height, pageX, pageY) => {
        boardLayout.current = { x: pageX, y: pageY, width, height };
      });
    }

    setIsDragging(true);
    lastPlacedCell.current = null;

    const touch = e.nativeEvent;
    const cell = getCellFromPosition(touch.pageX, touch.pageY);
    console.log('[GameBoard] Cell detected on touch start:', cell, 'boardLayout:', boardLayout.current);
    if (cell) {
      handlePlacement(cell.row, cell.col);
    }
  }, [isPlacementStage, isMyTurn, getCellFromPosition, handlePlacement]);

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!isDragging || !isPlacementStage || !isMyTurn) return;

    const touch = e.nativeEvent;
    const cell = getCellFromPosition(touch.pageX, touch.pageY);
    if (cell) {
      handlePlacement(cell.row, cell.col);
    }
  }, [isDragging, isPlacementStage, isMyTurn, getCellFromPosition, handlePlacement]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastPlacedCell.current = null;
  }, []);

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
      if (superpowerStyle) cellStyles.push(superpowerStyle);
    }

    // Memory effects
    if (cell.memory & MEMORY_FLAGS.IS_VETERAN) {
      cellStyles.push(styles.cellVeteran);
    }

    return cellStyles;
  };

  // Calculate board dimensions
  const screenWidth = Dimensions.get('window').width;
  const boardDimension = Math.min(screenWidth * 0.95, 500);

  return (
    <View style={styles.container}>
      <View
        ref={boardRef}
        style={[
          styles.board,
          {
            width: boardDimension,
            height: boardDimension,
          }
        ]}
        onLayout={handleLayout}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <View
              key={`${rowIndex}-${colIndex}`}
              style={[
                ...getCellStyle(cell),
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex && styles.cellSelected,
                { width: `${100 / boardSize}%`, height: `${100 / boardSize}%` }
              ]}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: '#6B7280',
    backgroundColor: '#1F2937',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#4B5563',
    aspectRatio: 1,
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
  // Superpower visual effects (use opacity/brightness for distinction)
  superpowerTank: {
    opacity: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  superpowerSpreader: {
    opacity: 0.85,
  },
  superpowerSurvivor: {
    opacity: 0.95,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  superpowerGhost: {
    opacity: 0.5,
  },
  superpowerReplicator: {
    opacity: 0.8,
  },
  superpowerDestroyer: {
    opacity: 1,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  superpowerHybrid: {
    opacity: 0.9,
    borderWidth: 1,
    borderColor: '#A855F7',
  },
});
