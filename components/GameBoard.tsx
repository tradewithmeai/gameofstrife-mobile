// Game of Strife GameBoard for React Native
import React, { useCallback, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, GestureResponderEvent, Text } from 'react-native';
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

  // Get cell coordinates from touch position - using locationX/Y which is relative to the touched view
  const getCellFromPosition = useCallback((locationX: number, locationY: number, boardWidth: number, boardHeight: number): { row: number; col: number } | null => {
    console.log('[GameBoard] Touch calculation:', {
      locationX, locationY,
      boardWidth, boardHeight,
      boardSize
    });

    // Calculate cell size
    const cellSize = Math.min(boardWidth, boardHeight) / boardSize;

    // Direct calculation - locationX/Y are already relative to the board
    const col = Math.floor(locationX / cellSize);
    const row = Math.floor(locationY / cellSize);

    console.log('[GameBoard] Calculated cell:', { row, col, cellSize });

    // Check bounds
    if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
      console.log('[GameBoard] Cell valid!');
      return { row, col };
    }

    console.log('[GameBoard] Cell out of bounds:', { row, col, boardSize });
    return null;
  }, [boardSize]);

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
      console.log('[GameBoard] Same cell as last placement, skipping');
      return;
    }

    // Check if cell is already occupied
    const cellOccupied = board[row] && board[row][col] && board[row][col].player !== null;
    console.log('[GameBoard] Cell occupied check:', { cellOccupied, player: board[row]?.[col]?.player });

    if (cellOccupied) {
      console.log('[GameBoard] Cell already occupied, skipping');
      return;
    }

    lastPlacedCell.current = cellKey;

    // Convert to flat board position for socket system
    const position = row * boardSize + col;

    console.log('[GameBoard] Calling onGameAction with position:', position);
    onGameAction({
      type: 'PLACE_TOKEN',
      payload: { position, row, col },
      timestamp: Date.now()
    });
  }, [isPlacementStage, isMyTurn, isFinished, board, boardSize, onGameAction]);

  // Measure board layout on mount and when it changes
  const handleLayout = useCallback(() => {
    boardRef.current?.measureInWindow((x, y, width, height) => {
      boardLayout.current = { x, y, width, height };
      console.log('[GameBoard] Board measured in window:', { x, y, width, height });
    });
  }, []);

  // Touch event handler
  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    console.log('[GameBoard] Touch start:', { isPlacementStage, isMyTurn, isFinished });
    if (!isPlacementStage || !isMyTurn) return;

    setIsDragging(true);
    lastPlacedCell.current = null;

    const touch = e.nativeEvent;
    // Use locationX/Y which are relative to the touched view (the board)
    // Get board dimensions from the ref
    const boardWidth = boardDimension;
    const boardHeight = boardDimension;

    const cell = getCellFromPosition(touch.locationX, touch.locationY, boardWidth, boardHeight);
    console.log('[GameBoard] Cell detected on touch start:', cell);
    if (cell) {
      handlePlacement(cell.row, cell.col);
    }
  }, [isPlacementStage, isMyTurn, getCellFromPosition, handlePlacement, boardDimension]);

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!isDragging || !isPlacementStage || !isMyTurn) return;

    const touch = e.nativeEvent;
    const boardWidth = boardDimension;
    const boardHeight = boardDimension;

    const cell = getCellFromPosition(touch.locationX, touch.locationY, boardWidth, boardHeight);
    if (cell) {
      handlePlacement(cell.row, cell.col);
    }
  }, [isDragging, isPlacementStage, isMyTurn, getCellFromPosition, handlePlacement, boardDimension]);

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

  // Calculate board dimensions - move outside JSX so we can use in handlers
  const screenWidth = Dimensions.get('window').width;
  const boardDimension = React.useMemo(() => Math.min(screenWidth * 0.95, 500), [screenWidth]);

  return (
    <View style={styles.container}>
      {/* Debug info */}
      <Text style={{ color: '#FFF', fontSize: 10, marginBottom: 4 }}>
        Board: {boardDimension.toFixed(0)}px | Cells: {boardSize}x{boardSize} | Cell size: {(boardDimension/boardSize).toFixed(1)}px
      </Text>
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
